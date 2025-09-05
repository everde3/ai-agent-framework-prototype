import { createOpenAI } from "@ai-sdk/openai";

import { MissingApiKeyError } from "@repo/errors";

import {
  ModelConfig,
  OpenAIModel,
  OpenAIModels,
  ProviderType,
} from "./model-registry";

let openaiInstance: ReturnType<typeof createOpenAI>;

const initOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new MissingApiKeyError("OPENAI_API_KEY is not set");
  }

  openaiInstance = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    compatibility: "strict",
  });
};

export const getOpenAIModel = ({
  modelId,
}: ModelConfig<{ provider: ProviderType.OPENAI; model: OpenAIModel }>) => {
  initOpenAI();

  const model = OpenAIModels[modelId];

  return openaiInstance(model);
};
