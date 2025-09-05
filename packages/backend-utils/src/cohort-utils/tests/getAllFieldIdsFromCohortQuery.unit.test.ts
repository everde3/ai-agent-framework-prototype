// Dependencies
import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { getAllFieldIdsFromCohortQuery } from "..";

describe.concurrent("getAllFieldIdsFromCohortQuery()", () => {
	it("can get all field ids from a cohort query", () => {
		const query = {
			$and: [
				{
					$or: [
						{
							field: new ObjectId("530fbba4dfbd9b96fcc03947"),
							value: {
								$gte: new Date(),
							},
						},
					],
				},
				{
					$or: [
						{
							field: new ObjectId("530fbba4dfbd9b96fcc03948"),
							value: {
								$eq: null,
							},
						},
					],
				},
			],
		};

		const response = getAllFieldIdsFromCohortQuery(query);
		expect(response).toStrictEqual([
			new ObjectId("530fbba4dfbd9b96fcc03947"),
			new ObjectId("530fbba4dfbd9b96fcc03948"),
		]);
	});

	it("handles non-object and non-array values", () => {
		const query = "This is a string, not an object or array"; 
		const response = getAllFieldIdsFromCohortQuery(query as any);
		expect(response).toStrictEqual([]);
	});
});
