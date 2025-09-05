// Dependencies
import { ObjectId } from "mongodb";
import { describe, expect, it, vi } from "vitest";

import { removeDuplicateObjectIDs } from ".";

describe.concurrent("removeDuplicateObjectIDs()", () => {
	it("removes duplicate ObjectIDs from an array of ObjectIDs", () => {
		const objectIDsArray = [
			new ObjectId("517fdbfb4c4a0873491ae19e"),
			new ObjectId("517fdbfb4c4a0873491ae19c"),
			new ObjectId("517fdbfb4c4a0873491ae19d"),
			new ObjectId("517fdbfb4c4a0873491ae19d"),
		];

		const response = removeDuplicateObjectIDs(objectIDsArray);

		expect(response).toStrictEqual([
			new ObjectId("517fdbfb4c4a0873491ae19e"),
			new ObjectId("517fdbfb4c4a0873491ae19c"),
			new ObjectId("517fdbfb4c4a0873491ae19d"),
		]);
	});

	it("removes duplicate ObjectIds when some are strings", () => {
		const objectIDsArray = ["517fdbfb4c4a0873491ae19e", new ObjectId("517fdbfb4c4a0873491ae19e")];

		const response = removeDuplicateObjectIDs(objectIDsArray);

		expect(response).toStrictEqual([new ObjectId("517fdbfb4c4a0873491ae19e")]);
	});

	it("returns empty array if given an empty array", () => {
		const objectIDsArray = [] as ObjectId[];

		const response = removeDuplicateObjectIDs(objectIDsArray);

		expect(response).toStrictEqual([]);
	});

	it("removes invalid ObjectIDs", () => {
		const objectIDsArray = ["517fdbfb4c4a0873491ae19e", new ObjectId("517fdbfb4c4a0873491ae19e"), "foobar"];

		const response = removeDuplicateObjectIDs(objectIDsArray);

		expect(response).toStrictEqual([new ObjectId("517fdbfb4c4a0873491ae19e")]);
	});

	it("handles a mix of valid and invalid ObjectId strings", () => {
        const objectIDsArray = [
            "517fdbfb4c4a0873491ae19e",
            new ObjectId("517fdbfb4c4a0873491ae19c"),
            "invalidObjectId",
            "anotherInvalidOne"
        ];

        const response = removeDuplicateObjectIDs(objectIDsArray);

        expect(response).toStrictEqual([
            new ObjectId("517fdbfb4c4a0873491ae19e"),
            new ObjectId("517fdbfb4c4a0873491ae19c")
        ]);
    });

    it("handles only invalid ObjectId strings", () => {
        const objectIDsArray = ["invalid1", "invalid2", "invalid3"];

        const response = removeDuplicateObjectIDs(objectIDsArray);

        expect(response).toStrictEqual([]);
    });

    it("maintains the original order of unique ObjectIds", () => {
        const objectIDsArray = [
            new ObjectId("517fdbfb4c4a0873491ae19e"),
            new ObjectId("517fdbfb4c4a0873491ae19c"),
            new ObjectId("517fdbfb4c4a0873491ae19e"),
            "517fdbfb4c4a0873491ae19d",
            "517fdbfb4c4a0873491ae19d"
        ];

        const response = removeDuplicateObjectIDs(objectIDsArray);

        expect(response).toStrictEqual([
            new ObjectId("517fdbfb4c4a0873491ae19e"),
            new ObjectId("517fdbfb4c4a0873491ae19c"),
            new ObjectId("517fdbfb4c4a0873491ae19d")
        ]);
    });
});
