import { describe, expect, it } from "vitest";
import { startsWithThe } from ".";

describe("startsWithThe", () => {
    it("should return true for strings starting with 'the'", () => {
        expect(startsWithThe("the company")).toBe(true);
    });

    it("should return true for strings starting with 'The'", () => {
        expect(startsWithThe("The Company")).toBe(true);
    });

    it("should return true for strings starting with 'THE'", () => {
        expect(startsWithThe("THE COMPANY")).toBe(true);
    });

    it("should return false for strings not starting with 'the'", () => {
        expect(startsWithThe("a company")).toBe(false);
    });

    it("should return false for strings containing 'the' but not at start", () => {
        expect(startsWithThe("company the")).toBe(false);
    });

    it("should return false for strings starting with 'there'", () => {
        expect(startsWithThe("there is a company")).toBe(false);
    });

    it("should return false for empty strings", () => {
        expect(startsWithThe("")).toBe(false);
    });

    it("should return false for strings with only whitespace", () => {
        expect(startsWithThe("   ")).toBe(false);
    });

    it("should return false for strings starting with 'the' without space", () => {
        expect(startsWithThe("therapy")).toBe(false);
    });
});