/**
 * This is a helper function that allows us to use async/await with promises
 * that may throw errors. It lets us avoid the try/catch tower of terror.
 * The result is Golang style error handling. Runs the given async function
 * around a try/catch block.
 */
export const promiseResolver = async <T>(promise: Promise<T>): Promise<[T, null] | [null, Error]> => {
	try {
		const data = await promise;
		return [data, null];
	} catch (throwable) {
		if (throwable instanceof Error) return [null, throwable];

		throw throwable;
	}
};
