import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

import { reviewAuthoringHandler } from "../review-authoring";
import * as dto from "@repo/dto";

vi.mock("@repo/dto");

describe("reviewAuthoringHandler", () => {
  let db: any;
  const companyId = new ObjectId();

  beforeEach(() => {
    db = {};
    vi.resetAllMocks();
  });

  it("should return parsed prompt variables with AI settings", async () => {
    const requestBody = {
      answer: ["This is an answer"],
      author: "John Doe",
      question: "What did you accomplish?",
      subject: "Jane Smith",
      subText: "Optional subtext",
      questionType: "text",
      goalName: "",
    };

    const mockAISettings = {
      authoringAssistantSettings: {
        disallowedWords: ["badword1", "badword2"],
        preferredWritingStyle: "concise",
      },
    };

    (dto.selectCompanyAISettings as any).mockResolvedValue(mockAISettings);

    const result = await reviewAuthoringHandler({ requestBody, db, companyId });

    expect(result).toEqual({
      answer: requestBody.answer,
      author: requestBody.author,
      question: requestBody.question,
      subject: requestBody.subject,
      subText: requestBody.subText,
      questionType: requestBody.questionType,
      goalName: requestBody.goalName,
      disallowedWords:
        mockAISettings.authoringAssistantSettings.disallowedWords,
      writingStyle:
        mockAISettings.authoringAssistantSettings.preferredWritingStyle,
    });
  });

  it("should throw if requestBody is invalid", async () => {
    const invalidRequestBody = {
      answer: 123, // invalid type, should be string
    };

    await expect(
      reviewAuthoringHandler({
        requestBody: invalidRequestBody as any,
        db,
        companyId,
      })
    ).rejects.toThrow();
  });

  it("should pass through empty optional fields correctly", async () => {
    const requestBody = {
      answer: ["Answer"],
      author: "Author",
      question: "Question",
      subject: "Subject",
      subText: "",
      questionType: "text",
      goalName: "",
    };

    const mockAISettings = {
      authoringAssistantSettings: {
        disallowedWords: [],
        preferredWritingStyle: "formal",
      },
    };

    (dto.selectCompanyAISettings as any).mockResolvedValue(mockAISettings);

    const result = await reviewAuthoringHandler({ requestBody, db, companyId });

    expect(result).toEqual({
      ...requestBody,
      disallowedWords: [],
      writingStyle: "formal",
    });
  });
});
