import { describe, it, expect } from "vitest";
import { chunkPromptVariables } from "../tokenizer";

const mockPromptVariables = {
  reviewId: "688a381030cd72965bf4eb35",
  name: "test form",
  completed: true,
  startDate: new Date("2025-07-31T22:00:00.000Z"),
  completeDate: new Date("2025-08-05T18:16:08.263Z"),
  subject: {
    _id: "6876b037a75208e2d21c69a7",
    name: "0 westbrook",
    role: "Self",
  },
  participants: [
    {
      _id: "68596a1cf27ed58244532398",
      name: "Anonymous",
      role: "Anonymous",
    },
  ],
  reviewSummarizationSettings: {
    strengths: true,
    quotes: true,
    actions: false,
    tone: true,
    opinions: true,
    summary: true,
  },
  reports: [
    {
      author: [
        {
          _id: "68596a1cf27ed58244532398",
          name: "Anonymous",
          role: "Anonymous",
        },
      ],
      completeDate: new Date("2025-08-05T18:16:08.147Z"),
      formName: "test form",
      signer: [
        {
          _id: "68596a1cf27ed58244532398",
          name: "Anonymous",
          role: "Anonymous",
        },
      ],
      redacted: true,
      visible: true,
      questionsWithAnswers: [
        {
          question: "test",
          subtext: "",
          type: "numeric",
          answer: {
            value: 20,
            min: 10,
            max: 100,
          },
        },
        {
          question: "multiple line answer",
          subtext: "",
          type: "multiline",
          answer: [
            "amazing guy",
            "franchise greatest player ever",
            "hard worker",
          ],
        },
      ],
    },
  ],
};

describe("chunkPromptVariables", () => {
  it("should not chunk when promptVariables fit", async () => {
    const results = await chunkPromptVariables({
      promptName: "review-insight",
      promptTemplate: "mock template",
      promptVariables: mockPromptVariables,
    });

    expect(results.length).toBe(1);
    expect(results[0].reports.length).toBe(1);
    expect(results[0].name).toBe("test form");
  });

  it("should chunk when many reports are present", async () => {
    const largePromptVariables = {
      ...mockPromptVariables,
      reports: new Array(5000).fill(mockPromptVariables.reports[0]),
    };

    const results = await chunkPromptVariables({
      promptName: "review-insight",
      promptTemplate: "mock template",
      promptVariables: largePromptVariables,
    });

    expect(results.length).toBeGreaterThan(1);
    expect(results.length).toBe(5);
  });

  it("should throw error when chunking key is not array", async () => {
    const badVars = {
      ...mockPromptVariables,
      reports: { not: "an array" },
    };

    await expect(
      chunkPromptVariables({
        promptName: "review-insight",
        promptTemplate: "mock template",
        promptVariables: badVars as any,
      })
    ).rejects.toThrow(Error);
  });
});
