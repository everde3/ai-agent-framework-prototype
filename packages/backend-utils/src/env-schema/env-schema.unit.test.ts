import dotenv from "dotenv";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isOptional, loadEnvVariables, validateEnv } from "./index";
import { z } from "zod";

describe("validateEnv function", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("validates correctly according to schema", () => {
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("JWT_LOCATION", "jwt_location_test");

    const result = validateEnv(["AWS_REGION", "JWT_LOCATION"]);
    expect(result.AWS_REGION).toBe("us-east-1");
    expect(result.JWT_LOCATION).toBe("jwt_location_test");
  });

  it("throws error for missing environment variable", () => {
    vi.stubEnv("AWS_REGION", "us-east-1");

    expect(() => validateEnv(["AWS_REGION", "JWT_LOCATION"])).toThrow(
      "Required environment variable JWT_LOCATION is missing"
    );
  });

  it("throws error for invalid value according to schema", () => {
    vi.stubEnv("AWS_REGION", "wrong-region");
    vi.stubEnv("NODE_ENV", "not-test");

    expect(() => validateEnv(["AWS_REGION"])).toThrowError(
      "Unexpected value type for variable AWS_REGION"
    );
  });

  it("returns validated environment variables", () => {
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("JWT_LOCATION", "jwt_location_test");

    const result = validateEnv(["AWS_REGION", "JWT_LOCATION"]);
    expect(result).toMatchObject({
      AWS_REGION: "us-east-1",
      JWT_LOCATION: "jwt_location_test",
    });
  });

  it("returns number type for string environment variable", () => {
    vi.stubEnv("SIGNED_URL_EXPIRE_TIME", "1000");

    const result = validateEnv(["SIGNED_URL_EXPIRE_TIME"]);
    expect(result.SIGNED_URL_EXPIRE_TIME).toBe(1000);
  });

  it("returns boolean type for string environment variable", () => {
    vi.stubEnv("repo_DEBUG", "true");

    const result = validateEnv(["repo_DEBUG"]);
    expect(result.repo_DEBUG).toBe(true);
  });

  it("returns a decimal number for string environment variable", () => {
    vi.stubEnv("SYNC_MORATORIUM_IN_HOURS", "0.1667");

    const result = validateEnv(["SYNC_MORATORIUM_IN_HOURS"]);
    expect(result.SYNC_MORATORIUM_IN_HOURS).toBe(0.1667);
  });
});

describe.concurrent("isOptional function", () => {
  it("returns true for optional schema", () => {
    const optionalSchema = z.string().optional();
    expect(isOptional(optionalSchema)).toBe(true);
  });

  it("returns true for nullable schema", () => {
    const nullableSchema = z.string().nullable();
    expect(isOptional(nullableSchema)).toBe(true);
  });

  it("returns false for required schema", () => {
    const requiredSchema = z.string();
    expect(isOptional(requiredSchema)).toBe(false);
  });
});

describe.concurrent("loadEnvVariables function", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("loads environment variables from .env file", () => {
    vi.spyOn(dotenv, "config").mockImplementation(() => {
      vi.stubEnv("SOME_VAR", "some_value");
      return { error: undefined, parsed: { SOME_VAR: "some_value" } };
    });

    loadEnvVariables();

    expect(process.env.SOME_VAR).toBe("some_value");
  });

  it("throws an error if .env file loading fails", () => {
    vi.spyOn(dotenv, "config").mockReturnValue({
      error: new Error("File not found"),
      parsed: undefined,
    });

    expect(() => loadEnvVariables()).toThrow(
      "Failed to load environment variables: Error: File not found"
    );
  });
});
