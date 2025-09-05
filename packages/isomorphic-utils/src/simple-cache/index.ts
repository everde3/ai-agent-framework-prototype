/**
 * SimpleCache is a class that caches the results of a function that takes one string argument and returns a promise.
 */
export class SimpleCache<T> {
	data: Record<string, Promise<T>> = {};
	accessor: (key: string) => Promise<T>;

	constructor(accessor: (key: string) => Promise<T>) {
		this.accessor = accessor;
	}

	get(key: string) {
		if (this.data[key] === undefined) {
			this.data[key] = this.accessor(key);
		}
		return this.data[key];
	}

	async awaitAll() {
		await Promise.all(Object.values(this.data).map((promise) => Promise.resolve(promise)));
	}
}
