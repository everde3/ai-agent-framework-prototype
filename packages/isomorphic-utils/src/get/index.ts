import { ObjectId } from "bson";

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * This will safely access nested values in an object.
 * This was made a little complicated to handle falsy values.
 *
 * @param {array|string} keyPath - path of properties to access
 * @param {object} obj - object we will be accessing
 * @param {any} notSetValue - the value to return if the keyPath is invalid
 */
export const get = <ReturnType = unknown, NotSetType = ReturnType>(
	path: string[] | string,
	nestedObj: unknown,
	notSetValue: NotSetType = undefined as unknown as NotSetType
): ReturnType | NotSetType => {
	const keyPath = typeof path === "string" ? [path] : path;

	// get a new keyPath with the last item removed
	const transformedList = keyPath.slice(0, keyPath.length - 1);

	// gets the object before the final key
	const shallowObj = transformedList.reduce(
		(xs, x) => (isPlainObject(xs) && xs[x] ? xs[x] : {}) as PlainObject,
		nestedObj as PlainObject
	);

	// set the return value to the notSetValue ( will overwrite later )
	let value: ReturnType | NotSetType = notSetValue;

	try {
		const lastKey = keyPath.slice(-1)[0];

		// at this point, we have the final object
		if (isPlainObject(shallowObj) && Object.prototype.hasOwnProperty.call(shallowObj, lastKey)) {
			value = shallowObj[lastKey] as ReturnType;
		}
	} catch (err) {
		value = notSetValue;
	}

	return value;
};

/**
 * This will safely access nested values in an object in a case insensitive manner.
 * This was made a little complicated to handle falsy values.
 *
 * @param {array|string} keyPath - path of properties to access
 * @param {object} obj - object we will be accessing
 * @param {any} notSetValue - the value to return if the keyPath is invalid
 */
export const getCaseInsensitive = <ReturnType = unknown, NotSetType = ReturnType>(
	path: Array<string | ObjectId> | string,
	nestedObj: unknown,
	notSetValue: NotSetType = undefined as unknown as NotSetType
): ReturnType | NotSetType => {
	const keyPath = typeof path === "string" ? [path] : path;

	// Create a key path array with each path string in lowercase
	const keyPathLowerCase = keyPath.map((value) => value.toString()?.toLowerCase());

	// get a new keyPath with the last item removed
	const transformedList = keyPathLowerCase.slice(0, keyPathLowerCase.length - 1);

	// gets the object before the final key
	const shallowObj = transformedList.reduce((xs, x) => {
		if (isPlainObject(xs)) {
			// converts keys of object at each level to lowercase for matching
			const objectLowerCase = Object.fromEntries(
				Object.entries(xs).map(([key, value]) => {
					if (typeof key === "string") {
						return [key.toLowerCase(), value];
					} else {
						return [key, value];
					}
				})
			);

			if (objectLowerCase[x]) {
				return objectLowerCase[x] as PlainObject;
			}
		}

		return {};
	}, nestedObj as PlainObject);

	// Get the key at the final index of the lowercase key path
	const lastKey = keyPathLowerCase[keyPathLowerCase.length - 1];

	// Convert keys in inner object to lowercase for matching
	const shallowObjLowerCase = Object.fromEntries(
		Object.entries(shallowObj).map(([key, value]) => {
			if (typeof key === "string") {
				return [key.toLowerCase(), value];
			} else {
				return [key, value];
			}
		})
	);

	// If inner object is valid and a key matching lastKey is present, return that value
	if (isPlainObject(shallowObjLowerCase) && Object.prototype.hasOwnProperty.call(shallowObjLowerCase, lastKey)) {
		return shallowObjLowerCase[lastKey] as ReturnType;
	}

	// Otherwise return not set value
	return notSetValue;
};
