import { ObjectId } from "bson";
import { camelCase, snakeCase } from "lodash";

/**
 * Check if we should convert the keys of the object or leave as is.
 *
 * This is important for things like ObjectId, which we don't want to convert.
 *
 * Make sure to add a unit test when adding new types.
 */
const isConvertible = (obj: any): boolean => {
	// Null or non-object types should not be converted
	if (obj === null || typeof obj !== "object") {
		return false;
	}

	// Don't convert these types
	const unconvertibleTypes = [ObjectId, Date];
	if (unconvertibleTypes.some((type) => obj instanceof type)) {
		return false;
	}

	return true;
};

// skipKeys should match the path of the key to skip, delimited by dots, ignoring array indexes.
const convertKeys = <T extends Record<string, any>>(
	obj: T | T[],
	convertFn: (key: string) => string,
	skipKeys: string[] = []
): T | T[] => {
	// Always skip _id
	if (!skipKeys.includes("_id")) {
		skipKeys.push("_id");
	}

	if (!isConvertible(obj)) return obj;

	if (Array.isArray(obj)) {
		return obj.map((item) => convertKeys(item, convertFn, skipKeys)) as T | T[];
	}

	const newObj: any = {};
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			// Convert key to new case
			const newKey = convertFn(key);
			if (skipKeys.includes(key)) {
				// Save values without converting
				newObj[key] = obj[key];
			} else {
				// Save key with recursively converted value
				newObj[newKey] = convertKeys(
					obj[key],
					convertFn,
					skipKeys.map((keyToSkip) => {
						// Remove this key prefix from the skipKeys
						return keyToSkip.replace(new RegExp(`^(${key}|${newKey})\.`), "");
					})
				);
			}
		}
	}
	return newObj;
};

export const snakeToCamel = <T extends Record<string, any>>(obj: T | T[], skipKeys: string[] = []): T | T[] =>
	convertKeys(obj, camelCase, skipKeys);
export const camelToSnake = <T extends Record<string, any>>(obj: T | T[], skipKeys: string[] = []): T | T[] =>
	convertKeys(obj, snakeCase, skipKeys);
