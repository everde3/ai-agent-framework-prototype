import * as Handlebars from "handlebars";
import { Db, ObjectId } from "mongodb";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { InternalDocumentParseError } from "@repo/errors";

import { chunkPromptVariables } from "../utils/tokenizer";

import { createModelInstance } from "../providers";
import { PromptNames, promptRegistry } from "./prompt-registry";

/**
 * Structure of the returned config that can be passed to generateText, generateObject, etc.
 */
// export interface PromptConfig {
// 	model: ReturnType<typeof createModelInstance>;
// 	prompt: string;
// 	schema?: unknown; // Used by generateObject/streamObject
// }

/**
 * Options for preparing a prompt config.
 *
 * @template T The name of the prompt, strongly typed
 */
export interface PreparePromptConfigOptions<T extends PromptNames> {
  /**
   * The name of the registered prompt (must exist in promptRegistry)
   */
  promptName: T;
  /**
   * The required variables for this prompt, inferred based on prompt name
   */
  variables: z.infer<(typeof promptRegistry)[T]["variables"]>;
  /**
   * Optional: Provide output schema for generateObject/streamObject
   */
  structuredOutput: boolean;
}

export interface PreparePromptExecutionOptions<T extends PromptNames> {
  promptName: T;
  requestBody: any;
  db: Db;
  companyId: ObjectId;
  userId: ObjectId;
  responseStyle: string;
}

// Register the 'eq' helper
Handlebars.registerHelper("eq", (a, b) => a === b);

// Register the 'json' helper
Handlebars.registerHelper("json", function (context) {
  return JSON.stringify(context, null, 2);
});

/**
 * Registers Handlebars partials from the specified directory.
 */
const registerPartials = async (partialsDir: string) => {
  const files = await fs.readdir(partialsDir);

  await Promise.all(
    files.map(async (file) => {
      if (file.endsWith(".hbs")) {
        const partialName = path.basename(file, ".hbs");
        const content = await fs.readFile(
          path.join(partialsDir, file),
          "utf-8"
        );
        Handlebars.registerPartial(partialName, content);
      }
    })
  );
};

/**
 * Returns a prompt string for the given prompt name
 * @param promptName name of the prompt
 * @param variables variables to be used in the prompt template
 * @returns string
 */
export const getPromptTemplate = async <T extends PromptNames>(
  promptName: T
) => {
  const promptDef = promptRegistry[promptName];

  // Read the .hbs file
  const templatePath = `${__dirname}/raw/${promptDef.templateName}.hbs`;
  const partialsDir = path.join(__dirname, "/raw/partials");

  // Register partials, including global-config.hbs
  await registerPartials(partialsDir);

  const templateContent = await fs.readFile(templatePath, "utf-8");

  return templateContent;
};

/**
 * Returns a prompt with variables rendered.
 * @param promptName name of the prompt
 * @param variables variables to be used in the prompt template
 * @returns string
 */

export const getPromptWithVariables = async <T extends PromptNames>(
  promptName: T,
  variables: z.infer<(typeof promptRegistry)[T]["variables"]>
): Promise<string> => {
  const promptDef = promptRegistry[promptName];

  const formattedVars = promptDef.variables.safeParse(variables);
  if (!formattedVars.success) {
    console.error(formattedVars.error.issues, "Invalid prompt variables");
    throw new InternalDocumentParseError(
      `Malformed Review Data for Task UI`,
      {
        message: "Unable to process review, please contact support",
      },
      { parseError: formattedVars.error.issues }
    );
  }

  const templateContent = await getPromptTemplate(promptName);
  // Process the template with the provided variables
  const template = Handlebars.compile(templateContent);
  const prompt = template({ ...formattedVars.data });

  return prompt;
};

/**
 * Prepares a typed, reusable config for generateText / generateObject / streamObject.
 * Includes the prompt, model, and schema (if available).
 *
 * @template T The prompt name (inferred automatically)
 * @param opts The options including name, variables, and settings override
 * @returns
 *
 * @example
 * const promptConfig = await preparePromptConfig({
 *   promptName: "review-insight",
 *   variables: { question: "What’s working?", subject: "Alice", answers: [...] },
 * });
 * const { object } = await generateObject({ ...promptConfig });
 */
export const preparePromptConfig = async <T extends PromptNames>(
  opts: PreparePromptConfigOptions<T>
) => {
  const { promptName, variables, structuredOutput } = opts;

  const def = promptRegistry[promptName];
  const prompt = await getPromptWithVariables(promptName, variables);

  const model = createModelInstance({
    provider: def.provider, // Could be resolved dynamically later
    model: def.model,
  });

  return {
    modelId: def.model,
    model,
    prompt,
    schema: structuredOutput ? def.output : undefined,
    tools: def.tools,
  };
};

/**
 * Validates prompt variables for a given prompt name using its Zod schema.
 * Throws a ZodError if invalid.
 *
 * @template T Prompt name (inferred)
 * @param promptName The name of the prompt
 * @param variables The variables to validate
 * @returns The validated variables (parsed by Zod)
 *
 * @example
 * const safeVars = validatePromptVariables("review-insight", {
 *   question: "What works?",
 *   subject: "Jane",
 *   answers: ["Smart", "Empathetic"]
 * });
 */
export const validatePromptVariables = <T extends PromptNames>(
  promptName: T,
  variables: unknown
) => {
  const schema = promptRegistry[promptName].variables;
  if (!schema)
    throw new Error(`No variable schema found for prompt: ${promptName}`);

  const parsed = schema.safeParse(variables);
  if (!parsed.success) {
    console.error(parsed.error.issues, "Invalid prompt variables");
    throw new InternalDocumentParseError(
      `Malformed Review Data for Task UI`,
      {
        message: "Unable to process review, please contact support",
      },
      { parseError: parsed.error.issues }
    );
  }

  return parsed.data;
};

/**
 * Returns a prompts variables schema
 */
export const getPromptVariablesSchema = <T extends PromptNames>(
  promptName: T
) => {
  return promptRegistry[promptName].variables;
};

export const preparePromptExecution = async <T extends PromptNames>(
  opts: PreparePromptExecutionOptions<T>
) => {
  const { promptName, requestBody, db, companyId, userId } = opts;

  // Getting the correct prompt registry item
  const def = promptRegistry[promptName];

  // Get the prompt variables
  const promptVariables = await def.getPromptVariables({
    requestBody,
    db,
    companyId,
    userId,
  });

  const promptTemplate = await getPromptTemplate(promptName);
  // Validate the prompt variables
  const validatedVariables = validatePromptVariables(
    promptName,
    promptVariables
  );

  const model = createModelInstance({
    provider: def.provider, // Could be resolved dynamically later
    model: def.model,
  });

  const chunks = await chunkPromptVariables({
    promptTemplate,
    promptName: promptName,
    promptVariables: validatedVariables,
  });

  return {
    promptTemplate: promptTemplate,
    promptVariables: chunks,
    model,
    schema: def.output,
    modelId: def.model,
    tools: def.tools,
  };
};
