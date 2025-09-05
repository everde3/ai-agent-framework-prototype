// Dependencies
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";

export const taskPool = <T>(props: {
	initialTasks: T[];
	concurrency: number;
	process: (doc: T) => Promise<void>;
	onError?: (err: fastq.errorHandler<T>) => void;
}) => {
	const { concurrency, process } = props;

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
	 * Add the initial tasks to the queue.
	 */
	props.initialTasks.forEach((task) => {
		queue.push({ ...task });
	});

	/**
	 * Add a task to the queue.
	 */
	const addToQueue = (task: T) => {
		queue.push({ ...task });
	};

	/**
	 * Add multiple tasks to the queue.
	 */
	const addManyToQueue = (tasks: T[]) => {
		tasks.forEach((task) => {
			addToQueue(task);
		});
	};

	return {
		addToQueue,
		addManyToQueue,
		whenDone: (): Promise<void> => {
			return queue.drained();
		},
	};
};
