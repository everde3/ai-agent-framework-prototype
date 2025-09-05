import { ObjectId } from "bson";
import { describe, expect, it } from "vitest";

import { get, getCaseInsensitive } from ".";

describe.concurrent("get function", () => {
	it("should return correct value for existing path", () => {
		const obj = { a: { b: { c: "value" } } };
		const result = get(["a", "b", "c"], obj);
		expect(result).toBe("value");
	});

	it("should return undefined for non-existing path", () => {
		const obj = { a: { b: { c: "value" } } };
		const result = get(["a", "b", "d"], obj);
		expect(result).toBeUndefined();
	});

	it("should handle string path correctly", () => {
		const obj = { a: { b: { c: "value" } } };
		const result = get("a", obj);
		expect(result).toEqual({ b: { c: "value" } });
	});

	it("should return provided notSetValue for non-existing path", () => {
		const obj = { a: { b: { c: "value" } } };
		const result = get(["a", "b", "d"], obj, "defaultValue");
		expect(result).toBe("defaultValue");
	});

	it("should return value for path leading to falsy value", () => {
		const obj = { a: { b: { c: 0 } } };
		const result = get(["a", "b", "c"], obj);
		expect(result).toBe(0);
	});

	it("should return undefined for incorrect types for nestedObj", () => {
		const result = get(["a", "b", "c"], 123);
		expect(result).toBeUndefined();
	});

	it("should not throw errors for edge cases", () => {
		expect(() => get(["a", "b", "c"], null)).not.toThrow();
		expect(() => get(["a", "b", "c"], undefined)).not.toThrow();
	});
});

describe.concurrent("getCaseInsensitive function", () => {
	it("should return correct value for existing path", () => {
		const obj = { a: { b: { C: "value" } } };
		const result = getCaseInsensitive(["A", "b", "c"], obj);
		expect(result).toBe("value");
	});

	it("should return correct value for existing ObjectId path", () => {
		const objectId = new ObjectId();
		const stringObjectId = objectId.toString();

		const nestedObj = {
			[stringObjectId]: { value: "test" },
		};
		const keyPath = [objectId, "value"];

		const result = getCaseInsensitive(keyPath, nestedObj);
		expect(result).toBe("test");
	});

	it("should return undefined for non-existing path", () => {
		const obj = { A: { b: { c: "value" } } };
		const result = getCaseInsensitive(["a", "b", "d"], obj);
		expect(result).toBeUndefined();
	});

	it("should handle string path correctly", () => {
		const obj = { a: { b: { c: "value" } } };
		const result = getCaseInsensitive("A", obj);
		expect(result).toEqual({ b: { c: "value" } });
	});

	it("should return provided notSetValue for non-existing path", () => {
		const obj = { A: { b: { c: "value" } } };
		const result = getCaseInsensitive(["a", "B", "d"], obj, "defaultValue");
		expect(result).toBe("defaultValue");
	});

	it("should return value for path leading to falsy value", () => {
		const obj = { A: { b: { C: 0 } } };
		const result = getCaseInsensitive(["a", "B", "C"], obj);
		expect(result).toBe(0);
	});

	it("should return undefined for incorrect types for nestedObj", () => {
		const result = getCaseInsensitive(["a", "b", "c"], 123);
		expect(result).toBeUndefined();
	});

	it("should not throw errors for edge cases", () => {
		expect(() => getCaseInsensitive(["a", "b", "c"], null)).not.toThrow();
		expect(() => getCaseInsensitive(["a", "b", "c"], undefined)).not.toThrow();
	});
});
