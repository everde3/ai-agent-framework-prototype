// Dependencies
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { AggregationCursor } from "mongodb";

/**
 * Creates a queue that processes documents from a cursor concurrently. This
 * is useful for processing large amounts of data without fetching all
 * documents from a cursor into memory at once.
 *
 * This was inspired by @supercharge/promise-pool, but that library does not
 * allow for dynamic arrays. This function uses fastq by Matt Collina to add
 * the documents to a queue as they are streamed from the cursor.
 *
 * Future Improvements:
 * - It might be worth adding documents to the queue slower than simply
 * streaming them all at once. If the cursor is very large, it might cause
 * memory issues.
 */
export const cursorPool = async <T>(props: {
	cursor: AggregationCursor<T>;
	concurrency: number;
	process: (doc: T) => Promise<void>;
	onError?: (err: fastq.errorHandler<T>) => void;
}): Promise<void> => {
	const { cursor, concurrency, process } = props;

	/**
	 * Create a queue that processes documents from the cursor.
	 */
	const queue: queueAsPromised<T> = fastq.promise(process, concurrency);

	/**
	 * An error callback when a processed item throws
	 */
	queue.error = (err) => {
		if (props.onError) {
			props.onError(err);
		}
	};

	/**
	 * Stream documents from the cursor and add them to the queue.
	 */
	for await (const doc of cursor) {
		queue.push({ ...doc });
	}

	/**
	 * Return a promise that resolves when the queue is drained (finished).
	 */
	await queue.drained();
};
