import { z } from "zod";

import { getPromptTemplate } from "../prompt/prompt-config";
import { type PromptNames, promptRegistry } from "../prompt/prompt-registry";
import { ModelTokenLimits } from "../providers/model-registry";

const AVG_CHARS_PER_TOKEN = 4;
const SAFETY_BUFFER = 50000;

const estimateTokens = (text: string) => {
	return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
};

/**
 * Splits a large promptVariables object into multiple smaller objects
 * that can fit within the token context limit of the specified LLM model.
 *
 * This function uses a specified `chunkingKey` to determine which field
 * in the promptVariables (usually an array like `answers`) should be split
 * across multiple requests. All other fields are kept constant.
 *
 * @param model - The target model name, used to get the token limit.
 * @param promptName - The name of the registered prompt (must exist in promptRegistry).
 * @param promptVariables - The full prompt variables object to be rendered into the prompt.
 * @param chunkingKey - The name of the key in promptVariables that holds the array to be chunked.
 * @returns An array of promptVariable objects, each sized to fit within the context window.
 *  maybe change return to be promptWithVariables and promptVariables for each chunk
 */
export const chunkPromptVariables = async <T extends PromptNames>({
	promptTemplate,
	promptName,
	promptVariables,
}: {
	promptTemplate: string;
	promptName: T;
	promptVariables: z.infer<(typeof promptRegistry)[T]["variables"]>;
}): Promise<z.infer<(typeof promptRegistry)[T]["variables"]>[]> => {
	const { model, chunkingKey } = promptRegistry[promptName];
	const modelLimit = ModelTokenLimits[model] ?? ModelTokenLimits.default;

	// estimate base prompt size
	const promptSize = estimateTokens(JSON.stringify(promptTemplate));
	const availableTokens = modelLimit - promptSize - SAFETY_BUFFER;

	// Estimate size of full promptVariables
	const promptVariablesSize = estimateTokens(JSON.stringify(promptVariables));

	if (!chunkingKey) {
		return [promptVariables];
	}
	// Isolate the array to be chunked
	const chunkArray = promptVariables[chunkingKey];
	if (!Array.isArray(chunkArray)) {
		throw new Error(`Chunking key '${chunkingKey}' must point to an array`);
	}

	// If the entire promptVariables fits, return it as a single element array
	if (promptVariablesSize < availableTokens) {
		return [promptVariables];
	}

	console.log(
		`Context window too small (${availableTokens} tokens) for full prompt (${promptVariablesSize} tokens), chunking on '${chunkingKey}'`
	);

	// Copy all other fields into a base object (everything except the chunking key)
	const baseObject = { ...promptVariables };
	delete baseObject[chunkingKey];

	// Estimate size of the base object (non-chunked part)
	const baseSize = estimateTokens(JSON.stringify(baseObject));
	const remainingTokens = availableTokens - baseSize;

	const result: (typeof promptVariables)[] = [];
	let currentChunk: unknown[] = [];
	let currentTokens = 0;

	// Build chunks of chunkArray that fit within remainingTokens
	for (const item of chunkArray) {
		const itemSize = estimateTokens(JSON.stringify(item));

		// If even a single item doesn't fit, hard stop
		if (itemSize > remainingTokens) {
			throw new Error(
				`Single item in '${chunkingKey}' too large (${itemSize}) to fit in remaining token budget (${remainingTokens})`
			);
		}

		// If adding this item would overflow, push current chunk and start new one
		if (currentTokens + itemSize > remainingTokens) {
			result.push({
				...baseObject,
				[chunkingKey]: currentChunk,
			} as typeof promptVariables);
			currentChunk = [item];
			currentTokens = itemSize;
		} else {
			currentChunk.push(item);
			currentTokens += itemSize;
		}
	}

	// Push final chunk if it has items
	if (currentChunk.length > 0) {
		result.push({
			...baseObject,
			[chunkingKey]: currentChunk,
		} as typeof promptVariables);
	}

	return result;
};
