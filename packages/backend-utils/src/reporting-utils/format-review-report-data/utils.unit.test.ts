import { describe, expect, it } from "vitest";

import { addAggregationPrefix, formatCSVDisplayName } from "./utils";

describe("reporting csv utils", () => {
	it("format CSV Display Name - lower case", () => {
		const input = "hello world";

		const expected = "Hello world";

		const result = formatCSVDisplayName(input);

		expect(typeof result).toBe("string");
		expect(result).toStrictEqual(expected);
	});
	it("format CSV Display Name - caps", () => {
		const input = "HELLO WORLD";

		const expected = "HELLO WORLD";

		const result = formatCSVDisplayName(input);

		expect(typeof result).toBe("string");
		expect(result).toStrictEqual(expected);
	});
	it("format CSV Display Name - special chars", () => {
		const input = "@hello world";

		const expected = "@hello world";

		const result = formatCSVDisplayName(input);

		expect(typeof result).toBe("string");
		expect(result).toStrictEqual(expected);
	});
	it("build question summary display name", () => {
		const input = "@hello world";

		const expected = "@hello world";

		const result = formatCSVDisplayName(input);

		expect(typeof result).toBe("string");
		expect(result).toStrictEqual(expected);
	});
	it("summary aggregation prefix", () => {
		const aggregationOperationName = "maximum";
		const rawColumnDisplayName = "my super cool column name";

		const expected = "maximum of my super cool column name";

		const result = addAggregationPrefix(aggregationOperationName, rawColumnDisplayName);

		expect(typeof result).toBe("string");
		expect(result).toStrictEqual(expected);
	});
});
