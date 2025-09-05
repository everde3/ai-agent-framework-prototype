import { describe, expect, it } from "vitest";

import { isPlainObject } from ".";

describe("isPlainObject", () => {
	it("should return true for plain objects", () => {
		expect(isPlainObject({})).toBe(true);
		expect(isPlainObject({ a: 1, b: 2 })).toBe(true);
		expect(isPlainObject(Object.create(null))).toBe(false);
	});

	it("should return false for arrays", () => {
		expect(isPlainObject([])).toBe(false);
		expect(isPlainObject([1, 2, 3])).toBe(false);
	});

	it("should return false for null", () => {
		expect(isPlainObject(null)).toBe(false);
	});

	it("should return false for primitives", () => {
		expect(isPlainObject(42)).toBe(false);
		expect(isPlainObject("string")).toBe(false);
		expect(isPlainObject(true)).toBe(false);
		expect(isPlainObject(undefined)).toBe(false);
		expect(isPlainObject(Symbol())).toBe(false);
		expect(isPlainObject(BigInt(42))).toBe(false);
	});

	it("should return false for functions", () => {
		expect(isPlainObject(() => {})).toBe(false);
		expect(isPlainObject(function () {})).toBe(false);
		expect(isPlainObject(Math.max)).toBe(false);
	});

	it("should return false for class instances", () => {
		class TestClass {}
		expect(isPlainObject(new TestClass())).toBe(false);
		expect(isPlainObject(new Date())).toBe(false);
		expect(isPlainObject(/./)).toBe(false);
	});

	it("should return false for objects with custom prototypes", () => {
		const proto = { foo: "bar" };
		expect(isPlainObject(Object.create(proto))).toBe(false);
	});
});
