import { UnknownProviderError } from "@repo/errors";

import { getBedrockModel } from "./bedrock";
import {
  AllModels,
  BedrockModel,
  OpenAIModel,
  ProviderType,
} from "./model-registry";
import { getOpenAIModel } from "./openai";

/**
 * Unified entry point for creating a model instance (Bedrock or OpenAI).
 * Validates provider/model match and returns a usable model instance.
 *
 * @example
 * const model = createModelInstance({
 *   provider: "bedrock",
 *   modelId: "claude-3-5-sonnet-v2"
 * });
 *
 * await generateText({
 *   model: model,
 *   prompt: "Hello, how are you?"
 * })
 */
export function createModelInstance(config: {
  provider: ProviderType;
  model: AllModels;
}) {
  const { provider, model } = config;

  if (provider === ProviderType.BEDROCK) {
    return getBedrockModel({ modelId: model as BedrockModel });
  } else if (provider === ProviderType.OPENAI) {
    return getOpenAIModel({ modelId: model as OpenAIModel });
  } else {
    throw new UnknownProviderError(`Unknown provider: ${provider}`);
  }
}
