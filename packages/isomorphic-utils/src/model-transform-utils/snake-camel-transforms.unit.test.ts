import { ObjectId } from "bson";
import { describe, expect, it } from "vitest";

import { camelToSnake, snakeToCamel } from ".";

const mockDate = new Date();

describe.concurrent("snakeToCamel function", () => {
	it("should convert snake_case keys to camelCase", () => {
		const input = {
			first_name: "John",
			last_name: "Doe",
			nested_object: {
				nested_key_one: "value1",
				nested_key_two: "value2",
			},
		};

		const expectedOutput = {
			firstName: "John",
			lastName: "Doe",
			nestedObject: {
				nestedKeyOne: "value1",
				nestedKeyTwo: "value2",
			},
		};

		expect(snakeToCamel(input)).toEqual(expectedOutput);
	});

	it("should skip converting values of the specified keys", () => {
		const input = {
			first_name: "John",
			last_name: "Doe",
			nested_obj: {
				user_age: 30,
				user_name: "John Doe",
			},
		};

		const expectedOutput = {
			firstName: "John",
			lastName: "Doe",
			nested_obj: {
				user_age: 30,
				user_name: "John Doe",
			},
		};

		expect(snakeToCamel(input, ["nested_obj"])).toEqual(expectedOutput);
	});

	it("should skip nested keys correctly", () => {
		const input = {
			first_name: "John",
			last_name: "Doe",
			age: 30,
			skip_me: {
				some_key_1: "but don't actually skip me",
				some_key_2: "but don't actually skip me",
			},
			some_nested_object: {
				skip_me: {
					some_key_1: "but don't actually skip me",
					some_key_2: "but don't actually skip me",
				},
				array_values: [
					{
						skip_me: {
							some_key_1: "value",
							some_key_2: "value",
						},
						something: "",
					},
					{
						skip_me: {
							some_key_1: "value",
							some_key_2: "value",
						},
						something: "",
					},
					{
						do_not_skip_me: {
							some_key_1: "value",
							some_key_2: "value",
						},
						skip_me_not: {
							some_key_1: "value",
							some_key_2: "value",
						},
						something: "",
					},
				],
			},
			some_nested_object_2: {
				skip_me: {
					some_key_1: "value",
					some_key_2: "value",
				},
				skip_me_too: {
					some_key_1: "value",
					some_key_2: "value",
				},
			},
		};

		const expectedOutput = {
			firstName: "John",
			lastName: "Doe",
			age: 30,
			skipMe: {
				someKey1: "but don't actually skip me",
				someKey2: "but don't actually skip me",
			},
			someNestedObject: {
				skipMe: {
					someKey1: "but don't actually skip me",
					someKey2: "but don't actually skip me",
				},
				arrayValues: [
					{
						skip_me: {
							some_key_1: "value",
							some_key_2: "value",
						},
						something: "",
					},
					{
						skip_me: {
							some_key_1: "value",
							some_key_2: "value",
						},
						something: "",
					},
					{
						doNotSkipMe: {
							someKey1: "value",
							someKey2: "value",
						},
						skipMeNot: {
							someKey1: "value",
							someKey2: "value",
						},
						something: "",
					},
				],
			},
			some_nested_object_2: {
				skip_me: {
					some_key_1: "value",
					some_key_2: "value",
				},
				skip_me_too: {
					some_key_1: "value",
					some_key_2: "value",
				},
			},
		};

		expect(snakeToCamel(input, ["some_nested_object.array_values.skip_me", "some_nested_object_2"])).toEqual(
			expectedOutput
		);
	});

	it("should handle ObjectId values", () => {
		const input = {
			some_id: new ObjectId(),
		};

		const expectedOutput = {
			someId: input.some_id,
		};

		expect(snakeToCamel(input)).toEqual(expectedOutput);
	});

	it("should handle Date values", () => {
		const input = {
			some_date: new Date(),
		};

		const expectedOutput = {
			someDate: input.some_date,
		};

		expect(snakeToCamel(input)).toEqual(expectedOutput);
	});

	it("should handle array of objects", () => {
		const input = {
			name: "Test Autoflow",
			tasks: [
				{
					task_type: "console:log",
					task_id: "console-log-01",
					config: {
						template: "Query Returned userId: [<AUTOFLOWPARAM::userId>]",
						header: "\n\n---------- Console Log Action Output: ----------",
						footer: "---------- Console Log Action End ----------\n\n",
						params: {
							user_id: "query-user-01",
						},
					},
					retries: 3,
				},
			],
			deleted_at: mockDate,
		};

		const expectedOutput = {
			name: "Test Autoflow",
			tasks: [
				{
					taskType: "console:log",
					taskId: "console-log-01",
					config: {
						template: "Query Returned userId: [<AUTOFLOWPARAM::userId>]",
						header: "\n\n---------- Console Log Action Output: ----------",
						footer: "---------- Console Log Action End ----------\n\n",
						params: {
							userId: "query-user-01",
						},
					},
					retries: 3,
				},
			],
			deletedAt: mockDate,
		};

		expect(snakeToCamel(input)).toEqual(expectedOutput);
	});
});

describe.concurrent("camelToSnake function", () => {
	it("should convert camelCase keys to snake_case", () => {
		const input = {
			firstName: "John",
			lastName: "Doe",
			nestedObject: {
				nestedKeyOne: "value1",
				nestedKeyTwo: "value2",
			},
		};

		const expectedOutput = {
			first_name: "John",
			last_name: "Doe",
			nested_object: {
				nested_key_one: "value1",
				nested_key_two: "value2",
			},
		};

		expect(camelToSnake(input)).toEqual(expectedOutput);
	});

	it("should skip converting values of the specified keys", () => {
		const input = {
			firstName: "John",
			lastName: "Doe",
			nestedObj: {
				userAge: 30,
				userName: "John Doe",
			},
		};

		const expectedOutput = {
			first_name: "John",
			last_name: "Doe",
			nestedObj: {
				userAge: 30,
				userName: "John Doe",
			},
		};

		expect(camelToSnake(input, ["nestedObj"])).toEqual(expectedOutput);
	});

	it("should skip nested keys correctly", () => {
		const input = {
			firstName: "John",
			lastName: "Doe",
			age: 30,
			skipMe: {
				someKey1: "but don't actually skip me",
				someKey2: "but don't actually skip me",
			},
			someNestedObject: {
				skipMe: {
					someKey1: "but don't actually skip me",
					someKey2: "but don't actually skip me",
				},
				arrayValues: [
					{
						skipMe: {
							someKey1: "value",
							someKey2: "value",
						},
						something: "",
					},
					{
						skipMe: {
							someKey1: "value",
							someKey2: "value",
						},
						something: "",
					},
					{
						doNotSkipMe: {
							someKey1: "value",
							someKey2: "value",
						},
						skipMeNot: {
							someKey1: "value",
							someKey2: "value",
						},
						something: "",
					},
				],
			},
			someNestedObject2: {
				skipMe: {
					someKey1: "value",
					someKey2: "value",
				},
				skipMeToo: {
					someKey1: "value",
					someKey2: "value",
				},
			},
		};

		const expectedOutput = {
			first_name: "John",
			last_name: "Doe",
			age: 30,
			skip_me: {
				some_key_1: "but don't actually skip me",
				some_key_2: "but don't actually skip me",
			},
			some_nested_object: {
				skip_me: {
					some_key_1: "but don't actually skip me",
					some_key_2: "but don't actually skip me",
				},
				array_values: [
					{
						skipMe: {
							someKey1: "value",
							someKey2: "value",
						},
						something: "",
					},
					{
						skipMe: {
							someKey1: "value",
							someKey2: "value",
						},
						something: "",
					},
					{
						do_not_skip_me: {
							some_key_1: "value",
							some_key_2: "value",
						},
						skip_me_not: {
							some_key_1: "value",
							some_key_2: "value",
						},
						something: "",
					},
				],
			},
			someNestedObject2: {
				skipMe: {
					someKey1: "value",
					someKey2: "value",
				},
				skipMeToo: {
					someKey1: "value",
					someKey2: "value",
				},
			},
		};

		expect(camelToSnake(input, ["someNestedObject.arrayValues.skipMe", "someNestedObject2"])).toEqual(
			expectedOutput
		);
	});

	it("should handle ObjectId values", () => {
		const input = {
			someId: new ObjectId(),
		};

		const expectedOutput = {
			some_id: input.someId,
		};

		expect(camelToSnake(input, ["age"])).toEqual(expectedOutput);
	});

	it("should handle Date values", () => {
		const input = {
			someDate: new Date(),
		};

		const expectedOutput = {
			some_date: input.someDate,
		};

		expect(camelToSnake(input)).toEqual(expectedOutput);
	});

	it("should handle array of objects", () => {
		const input = {
			name: "Test Autoflow",
			tasks: [
				{
					taskType: "console:log",
					taskId: "console-log-01",
					config: {
						template: "Query Returned userId: [<AUTOFLOWPARAM::userId>]",
						header: "\n\n---------- Console Log Action Output: ----------",
						footer: "---------- Console Log Action End ----------\n\n",
						params: {
							userId: "query-user-01",
						},
					},
					retries: 3,
				},
			],
			deletedAt: mockDate,
		};

		const expectedOutput = {
			name: "Test Autoflow",
			tasks: [
				{
					task_type: "console:log",
					task_id: "console-log-01",
					config: {
						template: "Query Returned userId: [<AUTOFLOWPARAM::userId>]",
						header: "\n\n---------- Console Log Action Output: ----------",
						footer: "---------- Console Log Action End ----------\n\n",
						params: {
							user_id: "query-user-01",
						},
					},
					retries: 3,
				},
			],
			deleted_at: mockDate,
		};

		expect(camelToSnake(input)).toEqual(expectedOutput);
	});
});
