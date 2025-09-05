type Result<T> = [T, null] | [null, Error];

/**
 * This is a helper function to make a function safe. It will catch any errors
 * thrown by the given function and return a Result object. This brings
 * Golang-style error handling to Typescript.
 *
 * Implementation inspired from this tweet:
 * https://twitter.com/mattpocockuk/status/1633064377518628866
 */
export const invokeSafe = <T>(fn: () => T): Result<T> => {
	try {
		const data = fn();
		return [data, null];
	} catch (throwable) {
		return [null, throwable as Error];
	}
};
