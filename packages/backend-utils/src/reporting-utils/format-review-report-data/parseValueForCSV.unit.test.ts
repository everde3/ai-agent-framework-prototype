import { format } from "date-fns";
import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { parseValueForCSV } from "./parsers";

const settings = {
  decimalPlaces: 2,
};

describe("analytics csv value parser", () => {
  it("parses a string", () => {
    const stringValue = "abc 123";

    const result = parseValueForCSV(stringValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(stringValue);
  });

  it("parses an array of strings", () => {
    const arrayValue = ["abc", "123", "test"];

    const expectedStringValue = "abc;123;test";

    const result = parseValueForCSV(arrayValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses a Date", () => {
    const dateValue = new Date();
    const expectedStringValue = format(dateValue, "yyyy/MM/dd");

    const result = parseValueForCSV(dateValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses a null", () => {
    const nullValue = null;
    const expectedStringValue = "";

    const result = parseValueForCSV(nullValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses a truthy bool", () => {
    const truthyBoolValue = true;
    const expectedStringValue = "True";

    const result = parseValueForCSV(truthyBoolValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses a falsy bool", () => {
    const truthyBoolValue = false;
    const expectedStringValue = "False";

    const result = parseValueForCSV(truthyBoolValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses an integer", () => {
    const integerValue = 123;
    const expectedStringValue = "123";

    const result = parseValueForCSV(integerValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses a float with the correct decimal place setting", () => {
    const floatValue = 123.123;
    const expectedStringValue = "123.12";

    const result = parseValueForCSV(floatValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses a complete UserReference Object", () => {
    const userReferenceValue = {
      _id: new ObjectId(),
      name: "test",
      email: "myemail@email.com",
    };
    const expectedStringValue = userReferenceValue.name;

    const result = parseValueForCSV(userReferenceValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses a UserReference Object with name missing", () => {
    const userReferenceValue = {
      _id: new ObjectId(),
      name: null,
      email: "myemail@email.com",
    };
    const expectedStringValue = userReferenceValue.email;

    const result = parseValueForCSV(userReferenceValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses a UserReference Object with name and email missing", () => {
    const userReferenceValue = {
      _id: new ObjectId(),
      name: null,
      email: null,
    };
    const expectedStringValue = "repo User";

    const result = parseValueForCSV(userReferenceValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses a UserReference Object with name, email, _id missing", () => {
    const userReferenceValue = {
      _id: null,
      name: null,
      email: null,
    };
    const expectedStringValue = "repo User";

    const result = parseValueForCSV(userReferenceValue, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });

  it("parses an unrecognized type", () => {
    const someObject = {
      hey: "there",
    };
    const expectedStringValue = "";

    const result = parseValueForCSV(someObject, settings);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expectedStringValue);
  });
});
