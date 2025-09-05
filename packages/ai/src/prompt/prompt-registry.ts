import { Db, ObjectId } from "mongodb";
import z from "zod";

import {
  DefaultRephraseResponseStream,
  EngagementInsightResponseStream,
  ReviewCycleInsightResponseStream,
  ReviewInsightResponseStream,
} from "@repo/service-contracts";

import {
  engagementInsightPromptVariables,
  engagementInsightSummaryOfSummaryPromptVariables,
} from "./schemas/engagement-insight";
import { reviewAuthoringPromptVariables } from "./schemas/review-authoring";
import { reviewCycleInsightPromptVariables } from "./schemas/review-cycle-insight";
import { reviewInsightPromptVariables } from "./schemas/review-insight";

import {
  engagementInsightHandler,
  engagementInsightSummaryOfSummaryHandler,
  reviewAuthoringHandler,
  reviewInsightHandler,
} from "./handlers";

import {
  BedrockModel,
  OpenAIModel,
  ProviderModel,
  ProviderType,
} from "../providers/model-registry";
import { AI_DEFAULTS } from "./default";

// All GetPromptVariables handlers should have the same props
export type PromptVariableContext = {
  requestBody: any;
  db: Db;
  companyId: ObjectId;
  userId?: ObjectId;
};

type BasePromptRegistryItem<
  VariablesSchema extends z.ZodObject<any>,
  OutputSchema extends z.ZodObject<any>
> = {
  templateName: string;
  variables: any;
  output: OutputSchema;
  settings: Record<string, any>;
  chunkingKey?: string;
  getPromptVariables: (
    ctx: PromptVariableContext
  ) => Promise<z.infer<VariablesSchema>>;
  tools?: Record<string, any>;
};

type PromptRegistryItem = BasePromptRegistryItem<
  z.ZodObject<any>,
  z.ZodObject<any>
> &
  ProviderModel;

export const promptRegistry: Record<string, PromptRegistryItem> = {
  "review-authoring-haiku": {
    provider: ProviderType.BEDROCK,
    model: "claude-3-5-haiku-v1",
    templateName: "review-authoring-haiku",
    variables: reviewAuthoringPromptVariables,
    output: DefaultRephraseResponseStream,
    settings: {
      temperature: 0.39,
    },
    tools: {}, //Only used for text responses
    getPromptVariables: reviewAuthoringHandler,
  },
  "review-authoring-sonnet": {
    provider: ProviderType.BEDROCK,
    model: "claude-3-5-sonnet-v2",
    templateName: "review-authoring-sonnet",
    variables: reviewAuthoringPromptVariables,
    output: DefaultRephraseResponseStream,
    settings: AI_DEFAULTS,
    tools: {}, //Only used for text responses
    getPromptVariables: reviewAuthoringHandler,
  },
  "review-insight": {
    provider: ProviderType.BEDROCK,
    model: "claude-3-5-sonnet-v2",
    templateName: "review-insight",
    variables: reviewInsightPromptVariables,
    output: ReviewInsightResponseStream,
    settings: AI_DEFAULTS,
    chunkingKey: "reports",
    tools: {}, //Only used for text responses
    getPromptVariables: reviewInsightHandler,
  },
  "review-insight-haiku": {
    provider: ProviderType.BEDROCK,
    model: "claude-3-5-haiku-v1",
    templateName: "review-insight-haiku",
    variables: reviewInsightPromptVariables,
    output: ReviewInsightResponseStream,
    settings: AI_DEFAULTS,
    chunkingKey: "reports",
    tools: {}, //Only used for text responses
    getPromptVariables: reviewInsightHandler,
  },
  "engagement-insight": {
    provider: ProviderType.BEDROCK,
    model: "claude-3-5-sonnet-v2",
    templateName: "engagement-insight",
    variables: engagementInsightPromptVariables,
    output: EngagementInsightResponseStream,
    chunkingKey: "answers",
    settings: {
      temperature: 0.35,
    },
    tools: {}, //Only used for text responses
    getPromptVariables: engagementInsightHandler,
  },
  "engagement-insight-summary-of-summary": {
    provider: ProviderType.BEDROCK,
    model: "claude-3-5-sonnet-v2",
    templateName: "engagement-insight-summary-of-summary",
    variables: engagementInsightSummaryOfSummaryPromptVariables,
    output: EngagementInsightResponseStream,
    settings: AI_DEFAULTS,
    chunkingKey: "answers",
    tools: {}, //Only used for text responses
    getPromptVariables: engagementInsightSummaryOfSummaryHandler,
  },
  "review-cycle-insight": {
    provider: ProviderType.BEDROCK,
    model: "claude-3-5-sonnet-v2",
    templateName: "review-cycle-insight",
    variables: reviewCycleInsightPromptVariables,
    output: ReviewCycleInsightResponseStream,
    settings: AI_DEFAULTS,
    chunkingKey: "reports",
    tools: {}, //Only used for text responses
    getPromptVariables: reviewInsightHandler,
  },
  // Just an example of a tool
  // "DONT-USE-getCurrentTime": {
  // 	provider: ProviderType.BEDROCK,
  // 	model: "claude-3-5-sonnet-v2",
  // 	templateName: "DONT-USE-getCurrentTime",
  // 	variables: z.object({}),
  // 	output: z.object({}),
  // 	settings: AI_DEFAULTS,
  // 	tools: {
  // 		getCurrentTime,
  // 	}, //Only used for text responses
  // },
} as const;

export type PromptRegistry = typeof promptRegistry;
export type PromptNames = keyof typeof promptRegistry;
export type PromptVariables = PromptRegistry[PromptNames]["variables"];
