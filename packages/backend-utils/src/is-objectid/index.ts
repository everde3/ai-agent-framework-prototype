import { ObjectId } from "mongodb";

/**
 * Checks if a value is a valid ObjectId.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid ObjectId, false otherwise.
 */
const isObjectId = (value: unknown): value is ObjectId => {
	try {
		const objectId = new ObjectId(value as string);
		return objectId.toString() === String(value);
	} catch {}

	return false;
};

export { isObjectId };
