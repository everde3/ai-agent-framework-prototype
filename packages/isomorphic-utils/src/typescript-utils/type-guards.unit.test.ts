import { ObjectId } from "bson";
import { describe, expect, it } from "vitest";

import {
  isArray,
  isBoolean,
  isDate,
  isNamedReference,
  isRecord,
  isString,
  isSummarizeByReference,
  isUserReference,
  isValidISODate,
  isValidJSONString,
  NamedReference,
  SummarizeByReference,
  UserReference,
  validObjectID,
} from "./type-guards";

describe.concurrent("validObjectID", () => {
  it("a string of length 12, such as an email, should be invalid objectId", () => {
    const result = validObjectID("a@nomail.com");
    expect(result).toBe(false);
  });

  it("a random email, should be invalid objectId", () => {
    const result = validObjectID("jcoker@repo.com");
    expect(result).toBe(false);
  });

  it("a random number should be false", () => {
    const result = validObjectID(123456789112);
    expect(result).toBe(false);
  });

  it("string representation of a random number should be false", () => {
    const result = validObjectID("123456789112");
    expect(result).toBe(false);
  });

  it("newly generated ObjectId should be true", () => {
    const result = validObjectID(new ObjectId());
    expect(result).toBe(true);
  });

  it("string value of a newly generated ObjectId should be true", () => {
    const result = validObjectID(new ObjectId().toString());
    expect(result).toBe(true);
  });

  it("test a random _id from the db converted to string, should be true", () => {
    const result = validObjectID(
      new ObjectId("5f89ceb0209e94386b557626").toString()
    );
    expect(result).toBe(true);
  });

  it("test string value of a random _id from the db, should be true", () => {
    const result = validObjectID("5f92f85581d54cf5fd1d1287");
    expect(result).toBe(true);
  });

  it("test a random _id from the db converted to string, should be true", () => {
    const result = validObjectID(
      new ObjectId("5f89ceb0209e94386b557626").toString()
    );
    expect(result).toBe(true);
  });
});

describe.concurrent("isString", () => {
  it("returns true for a string", () => {
    expect(isString("hello")).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isString(123)).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
  });
});

describe.concurrent("isBoolean", () => {
  it("returns true for a boolean", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isBoolean("hello")).toBe(false);
    expect(isBoolean(123)).toBe(false);
    expect(isBoolean(null)).toBe(false);
    expect(isBoolean(undefined)).toBe(false);
    expect(isBoolean({})).toBe(false);
    expect(isBoolean([])).toBe(false);
  });
});

describe.concurrent("isArray", () => {
  it("returns true for an array", () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2, 3])).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isArray("hello")).toBe(false);
    expect(isArray(123)).toBe(false);
    expect(isArray(true)).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isArray(undefined)).toBe(false);
    expect(isArray({})).toBe(false);
  });
});

describe.concurrent("isDate", () => {
  it("returns true for a Date object", () => {
    expect(isDate(new Date())).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isDate("2023-09-12T13:30:00Z")).toBe(false); // Even a valid date string is not a Date object
    expect(isDate(123)).toBe(false);
    expect(isDate(true)).toBe(false);
    expect(isDate(null)).toBe(false);
    expect(isDate(undefined)).toBe(false);
    expect(isDate({})).toBe(false);
    expect(isDate([])).toBe(false);
  });
});

describe.concurrent("isRecord", () => {
  it("returns true for a plain object", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1, b: "hello" })).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord(123)).toBe(false);
    expect(isRecord("hello")).toBe(false);
    expect(isRecord(true)).toBe(false);
  });
});

describe.concurrent("isValidISODate", () => {
  it("returns true for a valid ISO date string", () => {
    expect(isValidISODate("2023-09-12T13:30:00Z")).toBe(true);
  });

  it("returns false for an invalid ISO date string", () => {
    expect(isValidISODate("invalid date")).toBe(false);
    expect(isValidISODate("2023-13-01")).toBe(false);
  });
});

describe.concurrent("isValidJSONString", () => {
  it("returns true for a valid JSON string", () => {
    expect(isValidJSONString('{"a": 1, "b": "hello"}')).toBe(true);
  });

  it("returns false for an invalid JSON string", () => {
    expect(isValidJSONString("invalid json")).toBe(false);
    expect(isValidJSONString('{"a": 1, "b": "hello"')).toBe(false);
  });
});

describe.concurrent("isUserReference", () => {
  it("returns true for a valid UserReference", () => {
    const userRef: UserReference = {
      _id: new ObjectId(),
      name: "John Doe",
      email: "john.doe@example.com",
    };
    expect(isUserReference(userRef)).toBe(true);
  });

  it("returns false for invalid UserReference", () => {
    expect(isUserReference(null)).toBe(false);
    expect(isUserReference({})).toBe(false);
    expect(isUserReference({ _id: new ObjectId(), name: "John Doe" })).toBe(
      false
    );
  });
});

describe.concurrent("isNamedReference", () => {
  it("returns true for a valid NamedReference", () => {
    const namedRef: NamedReference = {
      name: "Some Name",
    };
    expect(isNamedReference(namedRef)).toBe(true);

    const namedRefWithId: NamedReference = {
      _id: new ObjectId(),
      name: "Some Name",
    };
    expect(isNamedReference(namedRefWithId)).toBe(true);
  });

  it("returns false for invalid NamedReference", () => {
    expect(isNamedReference(null)).toBe(false);
    expect(isNamedReference({})).toBe(false);
    expect(isNamedReference({ _id: new ObjectId() })).toBe(false);
  });
});

describe.concurrent("isSummarizeByReference", () => {
  it("returns true for a valid SummarizeByReference", () => {
    const summarizeRef: SummarizeByReference = {
      _id: new ObjectId(),
      name: "Summary Name",
    };
    expect(isSummarizeByReference(summarizeRef)).toBe(true);
  });

  it("returns false for invalid SummarizeByReference", () => {
    expect(isSummarizeByReference(null)).toBe(false);
    expect(isSummarizeByReference({})).toBe(false);
    expect(isSummarizeByReference({ _id: new ObjectId() })).toBe(false);
    expect(isSummarizeByReference({ name: "Summary Name" })).toBe(false);
  });
});
