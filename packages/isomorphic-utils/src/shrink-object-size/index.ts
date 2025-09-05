import { isPlainObject } from "../is-plain-object";

type ShrinkOptions = {
	maxKeys?: number;
	maxDepth?: number;
	currentDepth?: number;
};

/**
 * Reduces the size of an object by limiting the number of keys and nesting
 * depth.
 *
 * Note: this algorithm first tries to fill the root level keys before shrinking
 * nested objects.
 *
 * @param obj The input object to shrink
 * @param options Configuration options for shrinking
 * @returns A new object with reduced size
 */
export const shrinkObjectSize = (
	obj: Record<string, unknown>,
	options: ShrinkOptions = {}
): Record<string, unknown> => {
	const { maxKeys = Number.POSITIVE_INFINITY, maxDepth = Number.POSITIVE_INFINITY, currentDepth = 0 } = options;

	// Return empty object if we've exceeded max depth
	if (currentDepth >= maxDepth) {
		return {};
	}

	const entries = Object.entries(obj);
	const limitedEntries = entries.slice(0, maxKeys);

	return Object.fromEntries(
		limitedEntries.map(([key, value]) => {
			// Handle nested objects recursively
			if (value && isPlainObject(value)) {
				return [
					key,
					shrinkObjectSize(value as Record<string, unknown>, {
						maxKeys: maxKeys - limitedEntries.length,
						maxDepth,
						currentDepth: currentDepth + 1,
					}),
				];
			}

			return [key, value];
		})
	);
};
