import { ObjectId } from "mongodb";

/**
 * The purpose of this function is remove duplicate ObjectIDs from an array of ObjectIDs.
 * ex: [ObjectId("123"), ObjectId("123"), ObjectId("456")] => [ObjectId("123"), ObjectId("456")]
 */

export const removeDuplicateObjectIDs = (objectIDsArray: (ObjectId | string)[]): ObjectId[] => {
	const uniqueObjectIDMap = {} as { [key: string]: ObjectId };

	objectIDsArray.forEach((objectIDItem) => {
		if (ObjectId.isValid(objectIDItem)) {
			const objectIDString = objectIDItem.toString();

			if (!uniqueObjectIDMap[objectIDString]) {
				try {
					uniqueObjectIDMap[objectIDString] = new ObjectId(objectIDString);
				} catch {
					// if we can't convert the string to an ObjectId, just ignore it
				}
			}
		}
	});

	return Object.values(uniqueObjectIDMap);
};
