/**
 * Checks if a value is a plain object. A plain object is dictionary-like,
 * has no special prototype, and is not an array.
 *
 * @param value The value to check
 * @returns True if the value is a plain object, false otherwise
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		Object.getPrototypeOf(value) === Object.prototype
	);
};
