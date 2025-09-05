import { describe, it, expect } from "vitest";
import { buildPromptHash } from "../prompt-hash";

describe("buildPromptHash", () => {
  it("should generate a stable hash for the same input", () => {
    const promptName = "review-insight";
    const requestVariables = {
      name: "Test Form",
      completed: true,
      count: 5,
    };

    const hash1 = buildPromptHash({ promptName, requestVariables });
    const hash2 = buildPromptHash({ promptName, requestVariables });

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  it("should generate different hashes for different variables", () => {
    const promptName = "review-insight";
    const variablesA = { name: "A", completed: true };
    const variablesB = { name: "B", completed: true };

    const hashA = buildPromptHash({ promptName, requestVariables: variablesA });
    const hashB = buildPromptHash({ promptName, requestVariables: variablesB });

    expect(hashA).not.toBe(hashB);
  });

  it("should generate different hashes for different prompt names", () => {
    const variables = { name: "Test", completed: true };

    const hash1 = buildPromptHash({ promptName: "first", requestVariables: variables });
    const hash2 = buildPromptHash({ promptName: "second", requestVariables: variables });

    expect(hash1).not.toBe(hash2);
  });

  it("should generate different hashes when level or parentHash changes", () => {
    const promptName = "review-insight";
    const variables = { name: "Test" };

    const baseHash = buildPromptHash({ promptName, requestVariables: variables });
    const levelHash = buildPromptHash({ promptName, requestVariables: variables, level: 1 });
    const parentHashHash = buildPromptHash({
      promptName,
      requestVariables: variables,
      parentHash: "abcdef12345",
    });

    expect(baseHash).not.toBe(levelHash);
    expect(baseHash).not.toBe(parentHashHash);
    expect(levelHash).not.toBe(parentHashHash);
  });

  it("should produce the same hash regardless of requestVariables key order", () => {
    const promptName = "review-insight";
    const variables1 = { b: 2, a: 1 };
    const variables2 = { a: 1, b: 2 };

    const hash1 = buildPromptHash({ promptName, requestVariables: variables1 });
    const hash2 = buildPromptHash({ promptName, requestVariables: variables2 });

    expect(hash1).toBe(hash2);
  });
});
