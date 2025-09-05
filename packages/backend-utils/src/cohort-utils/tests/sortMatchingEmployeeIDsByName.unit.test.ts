// Dependencies
import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { sortMatchingEmployeeIDsByName } from "../index";

describe.concurrent("sortMatchingEmployeeIDsByName()", () => {
    const userId1 = new ObjectId();
    const userId2 = new ObjectId();
    const userId3 = new ObjectId();
    const userId4 = new ObjectId();

    const usersWithNames = [{ _id: userId1, name: "Bob" }, {_id: userId2, name: "Carly"}, {_id: userId3, name: "Anna"}, {_id: userId4, name: "Dylan"}]
    it("returns array of ids sorted by associated names in alphabetical order as expected", () => {
        const sortedIds = sortMatchingEmployeeIDsByName(usersWithNames, [userId1, userId2, userId3, userId4])
        expect(sortedIds).toEqual([userId3, userId1, userId2, userId4])
    })

    it("returns null if there is an error", () => {
        const usersWithNamesError =
        [
            { id: userId1, name: "Bob" }, 
            {_id: userId2, name: "Carly"}, 
            {_id: userId3, name: "Anna"}, 
            {_id: userId4, name: "Dylan"}
        ] as unknown as any;
        const sortedIds = sortMatchingEmployeeIDsByName(usersWithNamesError, [userId1, userId2, userId3, userId4])
        expect(sortedIds).toEqual(null)
    });
    it("sorts user ids associated with empty strings to the end of the list", () => {
        const usersWithEmptyNames = [
            { _id: userId1, name: "Bob" },
            { _id: userId2 },
            { _id: userId3, name: "Anna" },
            { _id: userId4, name: "Dylan" }
        ] as unknown as any;
        const sortedIds = sortMatchingEmployeeIDsByName(usersWithEmptyNames, [userId1, userId2, userId3, userId4]);
        expect(sortedIds).toEqual([userId3, userId1, userId4, userId2]);
    });
})
