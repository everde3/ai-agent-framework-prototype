/**
 * This is an anti pattern we use at PY, the types will cause a circular dependencies.
 * Its better to keep it closer and abstract as much to the DTO as possible
 */
import { Db, ObjectId } from "mongodb";

import {
  findUsersByEmailOrID,
  getReviewDataById,
  getReviewParticipantsByReviewId,
  getUsersToEmployeeRoles,
} from "@repo/dto";
import { InternalDocumentParseError, NotFoundError } from "@repo/errors";

import {
  AiUserSchema,
  Task,
  TaskWithUserInfo,
} from "../prompt/schemas/review-insight";

interface ReviewsProps {
  companyId: ObjectId;
  db: Db;
  userId: ObjectId;
}

export class ReviewsService {
  companyId: ObjectId;
  db: Db;
  userId: ObjectId;

  constructor(props: ReviewsProps) {
    this.companyId = props.companyId;
    this.db = props.db;
    this.userId = props.userId;
  }

  /**
   * Get a Reviews and all review reports, questions, and answers associated with it
   */
  getCollectiveReviewDataById = async (props: { reviewId: ObjectId }) => {
    const { reviewId } = props;

    const result = await getReviewDataById({
      db: this.db,
      reviewId,
      companyId: this.companyId,
    });
    const reviewDataRaw = result[0];

    if (!reviewDataRaw || reviewDataRaw.reports.length === 0) {
      return { reviewData: null, users: [] };
    }

    const parsed = Task.safeParse(reviewDataRaw);

    if (!parsed.success) {
      console.error(
        { reviewId, issues: parsed.error.issues },
        "Invalid review data shape"
      );
      throw new InternalDocumentParseError(
        `Malformed Review Data for Task UI`,
        {
          message: "Unable to process review, please contact support",
        },
        { parseError: parsed.error.issues }
      );
    }

    return { reviewData: parsed.data, users: reviewDataRaw.allParticipants };
  };

  /**
   * Get all participants of a review
   */

  getReviewParticipantsByReviewId = async (props: { reviewId: ObjectId }) => {
    const { reviewId } = props;

    const users = await getReviewParticipantsByReviewId({
      db: this.db,
      reviewId,
      companyId: this.companyId,
    });

    const flattened = [];
    const uniqueIds = new Set<string>();

    // Add the subject
    if (users.subject?._id && !uniqueIds.has(users.subject._id.toString())) {
      flattened.push(users.subject);
      uniqueIds.add(users.subject._id.toString());
    }

    // Add participants
    if (Array.isArray(users.participants)) {
      for (const participant of users.participants) {
        if (participant?._id && !uniqueIds.has(participant._id.toString())) {
          flattened.push(participant);
          uniqueIds.add(participant._id.toString());
        }
      }
    }

    return flattened;
  };

  /**
   * Replace UserIds with User Info
   */
  replaceUserIdsWithUserInfo = async (props: {
    reviewData: Task;
    users: AiUserSchema[];
  }): Promise<TaskWithUserInfo> => {
    const { reviewData, users } = props;

    const UNKNOWN_USER = {
      _id: new ObjectId(),
      name: "Unknown",
      role: "Unknown",
    };

    const fallback = (): AiUserSchema => UNKNOWN_USER;

    // Initialize user map (ID -> UserInfo)
    const userMap = new Map<string, AiUserSchema>(
      users.map((user) => [
        user._id.toString(),
        { _id: user._id, name: user.name, role: user.role },
      ])
    );

    // Step 1: Override redacted users in the userMap
    for (const report of reviewData.reports ?? []) {
      if (report.redacted) {
        const authorIds = Array.isArray(report.author)
          ? report.author
          : report.author
          ? [report.author]
          : [];

        for (const id of authorIds) {
          if (id) {
            const idStr = id.toString();
            if (userMap.has(idStr)) {
              userMap.set(idStr, {
                _id: new ObjectId(idStr),
                name: "Anonymous",
                role: "Anonymous",
              });
            }
          }
        }
      }
    }

    // Step 2: Define mapping helpers using the final userMap
    const mapUserId = (id: string | null | undefined): AiUserSchema =>
      id ? userMap.get(id.toString()) ?? fallback() : fallback();

    const mapUserIds = (
      ids: (string | null | undefined)[] | null | undefined
    ): AiUserSchema[] => (Array.isArray(ids) ? ids.map(mapUserId) : []);

    // Step 3: Apply mappings
    const subjectInfo: AiUserSchema = mapUserId(reviewData.subject.toString());

    const participantsInfo: AiUserSchema[] = (
      reviewData.participants ?? []
    ).map((participant) => mapUserId(participant.toString()));

    const reportsInfo = (reviewData.reports ?? []).map((report) => ({
      ...report,
      author: mapUserIds(report.author?.map((id) => id?.toString())),
      signer: mapUserIds(report.signer?.map((id) => id?.toString())),
    }));

    return {
      ...reviewData,
      subject: subjectInfo,
      participants: participantsInfo,
      reports: reportsInfo,
    };
  };

  /**
   * Combining Getting Data, find participates and replace user ids with names
   */
  getCompleteReviewDataById = async (props: { reviewId: ObjectId }) => {
    const { reviewId } = props;

    // Get review data
    const { reviewData, users } = await this.getCollectiveReviewDataById({
      reviewId,
    });

    if (!reviewData || reviewData.reports.length === 0) {
      throw new NotFoundError(
        `Review data cannot be found for reviewId: ${reviewId}`,
        {
          message: "We couldn't find the review data you requested.",
        },
        { reviewId: reviewId }
      );
    }

    // Find relationship between participants and subject
    const subject = reviewData.subject;
    const participants = users;

    // using dto/user.ts, find the relationship between participants and subject
    const userRoles = await getUsersToEmployeeRoles(
      this.db,
      participants,
      this.companyId,
      new ObjectId(subject)
    );

    const userInformation = await findUsersByEmailOrID(
      this.db,
      this.companyId,
      participants,
      true,
      ["_id", "name"]
    );

    //combine userRoles and userInformation
    const userInformationWithRoles = userInformation.map((user) => {
      const role = userRoles.find((role) => role._id.equals(user._id)) || {
        _id: user._id,
        role: "unknown",
      };
      return { _id: role._id, name: user.name, role: role.role };
    });

    // Replace user IDs with names
    const result = await this.replaceUserIdsWithUserInfo({
      reviewData,
      users: userInformationWithRoles,
    });

    return result;
  };
}
