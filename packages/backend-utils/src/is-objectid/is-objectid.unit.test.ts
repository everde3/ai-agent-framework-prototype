import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import { isObjectId } from "./index";

describe("isObjectId", () => {
  it("should return true for valid ObjectId instances", () => {
    const objectId = new ObjectId();
    expect(isObjectId(objectId)).toBe(true);
  });

  it("should return true for valid ObjectId strings", () => {
    const objectIdString = "507f1f77bcf86cd799439011";
    expect(isObjectId(objectIdString)).toBe(true);
  });

  it("should return false for invalid ObjectId strings", () => {
    expect(isObjectId("invalid-object-id")).toBe(false);
    expect(isObjectId("123")).toBe(false);
    expect(isObjectId("507f1f77bcf86cd7994390")).toBe(false); // Too short
    expect(isObjectId("507f1f77bcf86cd79943901111")).toBe(false); // Too long
  });

  it("should return false for non-string/non-ObjectId values", () => {
    expect(isObjectId(null)).toBe(false);
    expect(isObjectId(undefined)).toBe(false);
    expect(isObjectId(123)).toBe(false);
    expect(isObjectId({})).toBe(false);
    expect(isObjectId([])).toBe(false);
    expect(isObjectId(true)).toBe(false);
  });
}); 