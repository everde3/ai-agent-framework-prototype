import { createHash } from "crypto";

/**
 * Generates a stable SHA-256 hash for a given prompt and variables.
 * Used to uniquely identify an AI job for deduplication and caching.
 */
export const buildPromptHash = ({
	promptName,
	requestVariables,
	level = 0,
	parentHash = "",
}: {
	promptName: string;
	requestVariables: Record<string, unknown>; //  request body
	level?: number; // Depth of recursive summarization (default = 0)
	parentHash?: string; // Hash of parent summarization, if applicable
}): string => {
	// Sort the requestVariables by key to ensure stable key order
	const sortedVariables = Object.keys(requestVariables)
		.sort()
		.reduce((acc: Record<string, unknown>, key: string) => {
			acc[key] = requestVariables[key];
			return acc;
		}, {});

	// Create a consistent identity object with name, variables, level, and parentHash
	const promptKeys = {
		promptName,
		level,
		parentHash,
		...sortedVariables,
	};

	// Stringify the identity object using sorted keys to ensure consistency
	const stringifyObject = JSON.stringify(promptKeys, Object.keys(promptKeys).sort());

	// Generate a hash of the stringified object
	const jobHash = createHash("sha256").update(stringifyObject).digest("hex");

	// Return the resulting hash as the job hash different form object_id
	return jobHash;
};
