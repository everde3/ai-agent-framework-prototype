/**
 * Developer-facing Bedrock model aliases mapped to provider-specific values
 */

/**
 * Model Token Limits
 * This is a map of model names to their token limits
 */
/**
 * Model Token Limits
 * This is a map of model names to their token limits
 */
export const ModelTokenLimits: Record<string, number> = {
	"claude-4-opus-v1": 200_000,
	"claude-4-sonnet-v1": 200_000,
	"claude-3-7-sonnet-v1": 200_000,
	"claude-3-5-haiku-v1": 200_000,
	"claude-3-5-sonnet-v2": 200_000,
	"claude-3-5-sonnet-v1": 200_000,
	"claude-3-opus-v1": 200_000,
	"claude-3-haiku-v1": 200_000,
	"claude-3-sonnet-v1": 200_000,
	"nova-micro-v1": 8_000,
	"nova-lite-v1": 8_000,
	"nova-pro-v1": 8_000,
	"nova-premier-v1": 1_000_000,
	"llama-4-maverick-17b-instruct-v4": 1_000_000,
};

/**
 * Bedrock Models
 */
export const BedrockModels = {
	"llama-4-maverick-17b-instruct-v4": "meta.llama4-maverick-17b-instruct-v1:0",
	"nova-micro-v1": "amazon.nova-micro-v1:0",
	"nova-lite-v1": "amazon.nova-lite-v1:0",
	"nova-pro-v1": "amazon.nova-pro-v1:0",
	"nova-premier-v1": "amazon.nova-premier-v1:0",
	"claude-4-sonnet-v1": "us.anthropic.claude-4-sonnet-20250514-v1:0",
	"claude-4-opus-v1": "us.anthropic.claude-4-opus-20250514-v1:0",
	"claude-3-7-sonnet-v1": "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
	"claude-3-5-sonnet-v2": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
	"claude-3-5-sonnet-v1": "us.anthropic.claude-3-5-sonnet-20240620-v1:0",
	"claude-3-5-haiku-v1": "us.anthropic.claude-3-5-haiku-20241022-v1:0",
	"claude-3-opus-v1": "us.anthropic.claude-3-opus-20240229-v1:0",
	"claude-3-sonnet-v1": "us.anthropic.claude-3-sonnet-20240229-v1:0",
	"claude-3-haiku-v1": "us.anthropic.claude-3-haiku-20240307-v1:0",
	"claude-opus-4-v1": "anthropic.claude-opus-4-20250514-v1:0",
	"claude-opus-4-1-v1": "anthropic.claude-opus-4-1-20250805-v1:0",
} as const;

/**
 * OpenAI Models
 */
export const OpenAIModels = {
	"gpt-4.1": "gpt-4.1",
	"gpt-4.1-mini": "gpt-4.1-mini",
	"gpt-4.1-nano": "gpt-4.1-nano",
	"gpt-4o": "gpt-4o",
	"gpt-4o-mini": "gpt-4o-mini",
	"gpt-4o-audio-preview": "gpt-4o-audio-preview",
	"gpt-4-turbo": "gpt-4-turbo",
	"gpt-4": "gpt-4",
	"gpt-3.5-turbo": "gpt-3.5-turbo",
	o1: "o1",
	"o3-mini": "o3-mini",
	o3: "o3",
	"o4-mini": "o4-mini",
} as const;

export const AllModels = {
	...BedrockModels,
	...OpenAIModels,
} as const;

export type LlmModels = typeof AllModels;
export type LlmModelNames = keyof LlmModels;
export type LlmModelIds = LlmModels[LlmModelNames];

export enum ProviderType {
	BEDROCK = "bedrock",
	OPENAI = "openai",
}

/**
 * Model Types
 */
export type BedrockModel = keyof typeof BedrockModels;
export type OpenAIModel = keyof typeof OpenAIModels;
export type AllModels = BedrockModel | OpenAIModel;

/**
 * Union of supported model configurations with enforced type mapping by provider
 */
export type ProviderModel =
	| { provider: ProviderType.BEDROCK; model: BedrockModel }
	| { provider: ProviderType.OPENAI; model: OpenAIModel };

/**
 * Shared config format for invoking models
 */
export interface ModelConfig<T extends { provider: ProviderType; model: AllModels }> {
	modelId: T["model"];
	settings?: Record<string, any>;
}
