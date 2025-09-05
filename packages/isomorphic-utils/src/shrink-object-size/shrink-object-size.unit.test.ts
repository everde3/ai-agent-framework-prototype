import { describe, expect, it } from "vitest";

import { shrinkObjectSize } from ".";

describe("shrinkObjectSize", () => {
	it("should handle empty objects", () => {
		const input = {};
		const result = shrinkObjectSize(input);
		expect(result).toEqual({});
	});

	it("should limit number of keys at root level", () => {
		const input = {
			a: 1,
			b: 2,
			c: 3,
			d: 4,
		};
		const result = shrinkObjectSize(input, { maxKeys: 2 });
		expect(Object.keys(result).length).toBe(2);
		expect(result).toEqual({ a: 1, b: 2 });
	});

	it("should limit number of keys at all levels", () => {
		const input = {
			a: 1,
			level1: {
				level2: {
					level3: {
						deep: "value",
					},
				},
			},
		};

		const result = shrinkObjectSize(input, { maxKeys: 2 });
		expect(Object.keys(result).length).toBe(2);
		expect(result).toEqual({ a: 1, level1: {} });
	});

	it("should limit nested object depth", () => {
		const input = {
			level1: {
				level2: {
					level3: {
						deep: "value",
					},
				},
			},
		};
		const result = shrinkObjectSize(input, { maxDepth: 2 });
		expect(result).toEqual({
			level1: {
				level2: {},
			},
		});
	});

	it("should handle arrays without modifying them", () => {
		const input = {
			arr: [1, 2, 3],
			nested: {
				anotherArr: [4, 5, 6],
			},
		};
		const result = shrinkObjectSize(input, { maxDepth: 2, maxKeys: 3 });
		expect(result).toEqual(input);
	});

	it("should handle null values", () => {
		const input = {
			nullValue: null,
			nested: {
				anotherNull: null,
			},
		};
		const result = shrinkObjectSize(input);
		expect(result).toEqual(input);
	});

	it("should limit keys at all levels", () => {
		const input = {
			a: 1,
			b: 2,
			nested: {
				c: 3,
				d: 4,
				e: 5,
			},
		};
		const result = shrinkObjectSize(input, { maxKeys: 2 });
		expect(result).toEqual({
			a: 1,
			b: 2,
		});
	});

	it("should handle mixed nested content", () => {
		const input = {
			string: "hello",
			number: 42,
			object: {
				nested: "world",
				array: [1, 2, 3],
				deepObject: {
					foo: "bar",
				},
			},
			boolean: true,
		};

		const result = shrinkObjectSize(input, { maxDepth: 2 });
		expect(result).toEqual({
			string: "hello",
			number: 42,
			object: {
				nested: "world",
				array: [1, 2, 3],
				deepObject: {},
			},
			boolean: true,
		});
	});

	it("should slice objects to meet maxKeys limit", () => {
		const input = {
			string: "hello",
			number: 42,
			object: {
				nested: "world",
				array: [1, 2, 3],
				null: null,
				value1: 1,
				value2: 2,
			},
			boolean: true,
		};

		const result = shrinkObjectSize(input, { maxKeys: 6 });
		expect(result).toEqual({
			string: "hello",
			number: 42,
			object: {
				nested: "world",
				array: [1, 2, 3],
			},
			boolean: true,
		});
	});

	it("prioritizes keys at lower depths", () => {
		const input = {
			a: 1,
			b: {
				d: {
					e: {
						f: "f",
					},
				},
				g: "g",
				h: "h",
			},
			i: "i",
			j: "j",
		};

		const result = shrinkObjectSize(input, { maxKeys: 6 });
		expect(result).toEqual({
			a: 1,
			b: {
				d: {},
				g: "g",
			},
			i: "i",
			j: "j",
		});
	});

	it("should handle non-object values in nested properties", () => {
		const input = {
			a: {
				b: undefined,
				c: null,
				d: 123,
				e: "string",
				f: true,
			},
		};
		const result = shrinkObjectSize(input, { maxKeys: 4, maxDepth: 2 });
		expect(result).toEqual({
			a: {
				b: undefined,
				c: null,
				d: 123,
			},
		});
	});

	it("should maintain object references when within limits", () => {
		const nestedObj = { x: 1 };
		const input = {
			a: nestedObj,
		};
		const result = shrinkObjectSize(input, { maxDepth: 2 });
		expect(result.a).toEqual(nestedObj);
	});

	it("should handle Date objects without modification", () => {
		const date = new Date();
		const input = {
			timestamp: date,
			nested: {
				anotherDate: new Date(),
			},
		};
		const result = shrinkObjectSize(input, { maxDepth: 2 });
		expect(result).toEqual(input);
	});
});
