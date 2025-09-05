/**
 * Default generation settings for AI model inference.
 * These values apply across providers, unless overridden.
 *
 * Adjust these defaults based on model capabilities and desired behavior.
 */
export const AI_DEFAULTS = {
	// Controls creativity/randomness. Lower = more deterministic.
	temperature: 0.39,

	// Nucleus sampling: only consider tokens within top X% probability mass.
	// topP: 0.9,

	// (Optional) Only consider top K tokens per generation step.
	// Useful for fine-grained sampling control, usually not needed.
	// topK: 50,

	// Maximum number of tokens to generate.
	// maxTokens: 2000,

	// -- Optional defaults below, comment out unless needed --

	// Penalizes repeated content from earlier in the prompt.
	// presencePenalty: 0.0,

	// Penalizes repeated tokens to reduce redundancy.
	// frequencyPenalty: 0.0,

	// Force stop generation on specific sequences.
	// stopSequences: ["\n\n"],

	// Set to ensure deterministic results across runs (if supported).
	// seed: 42,

	// Retry on failure or rate limit.
	// maxRetries: 2,

	// Provide abort controller for cancellation or timeout support.
	// abortSignal: AbortSignal.timeout(5000), // 5 seconds

	// Add extra HTTP headers (e.g. for observability or traceability).
	// headers: {
	//   'prompt-id': 'my-default-prompt-id',
	// },
};
