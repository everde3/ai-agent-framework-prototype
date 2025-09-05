import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { ReviewsService } from "../reviews";
import {
  getReviewDataById,
  getReviewParticipantsByReviewId,
  getUsersToEmployeeRoles,
  findUsersByEmailOrID,
} from "@repo/dto";

vi.mock("@repo/dto", () => ({
  getReviewDataById: vi.fn(),
  getReviewParticipantsByReviewId: vi.fn(),
  getUsersToEmployeeRoles: vi.fn(),
  findUsersByEmailOrID: vi.fn(),
}));

const mockDb = {} as any;
const mockCompanyId = new ObjectId();
const mockUserId = new ObjectId();

let service: ReviewsService;

beforeEach(() => {
  service = new ReviewsService({
    companyId: mockCompanyId,
    db: mockDb,
    userId: mockUserId,
  });
});

describe("ReviewsService", () => {
  describe("getCollectiveReviewDataById", () => {
    it("returns parsed review data and allParticipants", async () => {
      const reviewId = new ObjectId();
      const subjectId = new ObjectId();
      const participantId = new ObjectId();
      const participant2Id = new ObjectId();

      const reviewDataMock = {
        _id: new ObjectId(),
        name: "Mini Review",
        completed: false,
        startDate: "2025-01-01T22:00:00.000Z",
        completeDate: null,
        subject: subjectId,
        participants: [participantId, participant2Id],
        reports: [
          {
            _id: new ObjectId(),
            author: [participantId],
            formName: "Short Form",
            signer: [participant2Id],
            questionsWithAnswers: [
              { question: "Q", type: "text", answer: "A" },
            ],
            redacted: false,
            visible: false,
            reacted: false,
          },
        ],
        allParticipants: [participantId, participant2Id],
      };

      (getReviewDataById as any).mockResolvedValue([reviewDataMock]);

      const result = await service.getCollectiveReviewDataById({ reviewId });

      expect(result.reviewData?.name).toBe("Mini Review");
      expect(result.users).toEqual(reviewDataMock.allParticipants);
    });

    it("returns null and empty array if review not found", async () => {
      (getReviewDataById as any).mockResolvedValue([]);
      const result = await service.getCollectiveReviewDataById({
        reviewId: new ObjectId(),
      });
      expect(result).toEqual({ reviewData: null, users: [] });
    });

    it("throws InternalDocumentParseError if review shape invalid", async () => {
      const reviewId = new ObjectId();

      (getReviewDataById as any).mockResolvedValue([
        { name: "Invalid", reports: [{}] },
      ]);
      await expect(
        service.getCollectiveReviewDataById({ reviewId: reviewId })
      ).rejects.toThrow("Malformed Review Data for Task UI");
    });
  });

  describe("getReviewParticipantsByReviewId", () => {
    it("returns unique subject + participants", async () => {
      const subjectId = new ObjectId();
      const participantId = new ObjectId();

      const usersMock = {
        subject: { _id: subjectId, name: "Subject" },
        participants: [
          { _id: participantId, name: "Participant" },
          { _id: subjectId, name: "SubjectDuplicate" },
        ],
      };

      (getReviewParticipantsByReviewId as any).mockResolvedValue(usersMock);

      const result = await service.getReviewParticipantsByReviewId({
        reviewId: new ObjectId(),
      });

      expect(result).toHaveLength(2);
      expect(result.map((u) => u.name)).toEqual(
        expect.arrayContaining(["Subject", "Participant"])
      );
    });
  });

  describe("replaceUserIdsWithUserInfo", () => {
    it("replaces IDs with user info and handles reports", async () => {
      const subjectId = new ObjectId();
      const participantId = new ObjectId();

      const reviewData = {
        _id: new ObjectId(),
        subject: subjectId,
        participants: [participantId],
        reports: [
          {
            _id: new ObjectId(),
            author: [participantId],
            signer: [participantId],
            redacted: false,
            visible: false,
          },
        ],
      };

      const users = [
        { _id: subjectId, name: "Subject", role: "Employee" },
        { _id: participantId, name: "Author", role: "Manager" },
      ];

      const result = await service.replaceUserIdsWithUserInfo({
        reviewData: reviewData as any,
        users,
      });

      expect(result.subject?.name).toBe("Subject");
      expect(result.participants?.[0]?.name).toBe("Author");
      expect(result.reports?.[0]?.author?.[0]?.name).toBe("Author");
    });

    it("maps redacted authors to Anonymous", async () => {
      const id = new ObjectId();
      const reviewData = {
        _id: new ObjectId(),
        subject: id,
        participants: [id],
        reports: [{ author: [id], signer: [id], redacted: true }],
      };
      const users = [{ _id: id, name: "User", role: "Employee" }];

      const result = await service.replaceUserIdsWithUserInfo({
        reviewData: reviewData as any,
        users,
      });
      const author = result.reports?.[0]?.author?.[0];
      expect(author?.name).toBe("Anonymous");
      expect(author?.role).toBe("Anonymous");
    });
  });

  describe("getCompleteReviewDataById", () => {
    it("returns complete review data with roles and names", async () => {
      const reviewId = new ObjectId();
      const subjectId = new ObjectId();
      const participantId = new ObjectId();

      const reviewData = {
        _id: new ObjectId(),
        name: "Full Review",
        subject: subjectId,
        participants: [participantId],
        reports: [
          {
            author: [participantId],
            signer: [participantId],
            redacted: false,
            visible: false,
          },
        ],
        allParticipants: [subjectId, participantId],
        completed: true,
        startDate: "2025-01-01T22:00:00.000Z",
        completeDate: null,
      };

      (service.getCollectiveReviewDataById as any) = vi.fn().mockResolvedValue({
        reviewData,
        users: [subjectId, participantId],
      });

      (getUsersToEmployeeRoles as any).mockResolvedValue([
        { _id: subjectId, role: "Employee" },
        { _id: participantId, role: "Manager" },
      ]);

      (findUsersByEmailOrID as any).mockResolvedValue([
        { _id: subjectId, name: "Subject" },
        { _id: participantId, name: "Author" },
      ]);

      const result = await service.getCompleteReviewDataById({ reviewId });

      expect(result.subject).toEqual(
        expect.objectContaining({ name: "Subject", role: "Employee" })
      );
      expect(result.participants?.[0]).toEqual(
        expect.objectContaining({ name: "Author", role: "Manager" })
      );
      expect(result.reports?.[0]?.author?.[0]).toEqual({
        _id: participantId,
        name: "Author",
        role: "Manager",
      });
    });
  });
});
