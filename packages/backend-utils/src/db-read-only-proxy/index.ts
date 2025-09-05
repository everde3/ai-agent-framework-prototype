import type { Collection, Db } from "mongodb";

export class DryRunError extends Error {
	constructor(operation: string) {
		super(`Write operation "${operation}" attempted during dry run`);
		this.name = "DryRunError";
	}
}

/**
 * Creates a read-only proxy for a MongoDB database.
 *
 * This is useful for things like running migrations without accidentally
 * writing to the database in a dry run.
 */
export const createDbReadOnlyProxy = (db: Db): Db => {
	return new Proxy(db, {
		get: (target: Db, prop: keyof Db) => {
			if (prop === "collection") {
				return (collectionName: string) => {
					const collection = target.collection(collectionName);
					return new Proxy(collection, {
						get: (target: Collection, prop: keyof Collection) => {
							// Allow read operations
							const readOperations = [
								"find",
								"findOne",
								"count",
								"countDocuments",
								"estimatedDocumentCount",
								"distinct",
								"aggregate",
								"watch",
								"indexes",
								"indexExists",
								"indexInformation",
								"listIndexes",
								"stats",
								"options",
							];

							if (readOperations.includes(prop) && typeof target[prop] === "function") {
								return target[prop].bind(target);
							}

							// Block write operations
							const writeOperations = [
								"insertOne",
								"insertMany",
								"updateOne",
								"updateMany",
								"deleteOne",
								"deleteMany",
								"findOneAndUpdate",
								"findOneAndDelete",
								"findOneAndReplace",
								"bulkWrite",
								"createIndex",
								"createIndexes",
								"dropIndex",
								"dropIndexes",
								"drop",
							];

							if (writeOperations.includes(prop)) {
								return () => {
									throw new DryRunError(prop);
								};
							}

							return target[prop];
						},
					});
				};
			}

			return target[prop];
		},
	});
};
