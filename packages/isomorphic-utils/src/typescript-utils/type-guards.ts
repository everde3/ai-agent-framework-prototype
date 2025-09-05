import { ObjectId } from "bson";
import { isValid, parseISO } from "date-fns";

export interface UserReference {
	_id: ObjectId;
	name: string;
	email: string;
}

export interface NamedReference {
	_id?: ObjectId;
	name: string;
}

export interface SummarizeByReference {
	_id: ObjectId;
	name: string;
}

export const isString = (value: unknown): value is string => {
	return typeof value === "string";
};

export const isBoolean = (value: unknown): value is boolean => {
	return typeof value === "boolean";
};

export const isArray = (value: unknown): value is unknown[] => {
	return Array.isArray(value);
};

export const isDate = (value: unknown): value is Date => {
	return value instanceof Date;
};

/**
 * The purpose of this function is to determine if the value arg is a valid
 * typescript Record.
 *
 * Note that arrays and null are javascript objects, but are not valid
 * records.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
	if (typeof value !== "object" || value === null || isArray(value)) {
		return false;
	}

	return true;
};

export const isValidObjectID = (value: unknown): boolean => {
	return validObjectID(value);
};

export const isValidISODate = (value: string): boolean => {
	return isValid(parseISO(value));
};

export const isValidJSONString = (value: string): boolean => {
	try {
		JSON.parse(value);
		return true;
	} catch (e) {
		return false;
	}
};

export const isUserReference = (item: unknown): item is UserReference => {
	if (!isRecord(item)) {
		return false;
	}

	if (item._id === undefined || item.name === undefined || item.email === undefined) {
		return false;
	}

	return true;
};

export const isNamedReference = (item: unknown): item is NamedReference => {
	if (!isRecord(item)) {
		return false;
	}

	if (item.name === undefined) {
		return false;
	}

	return true;
};

export const isSummarizeByReference = (item: unknown): item is SummarizeByReference => {
	if (!isRecord(item)) {
		return false;
	}

	if (item._id === undefined || item.name === undefined) {
		return false;
	}

	return true;
};

export const validObjectID = (valueToCheck: unknown): valueToCheck is ObjectId => {
	// Check if valueToCheck is of the types compatible with ObjectId
	const isBuffer = typeof globalThis !== 'undefined' && 
		typeof (globalThis as any).Buffer !== 'undefined' && 
		valueToCheck instanceof (globalThis as any).Buffer;
	if (
		typeof valueToCheck !== "string" &&
		typeof valueToCheck !== "number" &&
		!(valueToCheck instanceof ObjectId) &&
		!isBuffer &&
		!(valueToCheck instanceof Uint8Array)
	) {
		return false;
	}

	// if isValid() is false, we can be sure it is not a valid mongo ObjectId
	if (!ObjectId.isValid(valueToCheck as any)) {
		return false;
	}

	// However, isValid() will return true for any input
	// that is str of length 12 or number, so we must check.

	// ObjectId().toString() should be idempotent if operating on a valid
	// mongo ObjectId or a string representation of a valid ObjectId,
	// but not if operating on a number or random string of length 12

	const inputAsObjectID = new ObjectId(valueToCheck as any);

	if (inputAsObjectID.toString() !== (valueToCheck as any).toString()) {
		return false;
	}

	return true;
};
