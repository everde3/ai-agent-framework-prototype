import { ObjectId } from "mongodb";

import {
  findCohortById,
  findCustomQuestionByID,
  getAllEnpsAdditionalFeedback,
  getAllQuestionAnswersByID,
} from "@repo/dto";
import { getQuestionById as getJsonEngagementQuestionById } from "@repo/engagement";
import { NotFoundError } from "@repo/errors";
import { IEngagementSurveyFormModelByQuestionID } from "@repo/models";
import { EngagementAnalysis } from "@repo/service-contracts";
import { isObjectId } from "@repo/utils-backend";

import {
  EngagementInsightPromptVariables,
  EngagementInsightSummaryOfSummaryPromptVariables,
  engagementInsightSummaryOfSummaryPromptVariables,
} from "../schemas/engagement-insight";

import { PromptVariableContext } from "../prompt-registry";

export const engagementInsightHandler = async ({
  requestBody,
  db,
  companyId,
}: PromptVariableContext): Promise<EngagementInsightPromptVariables> => {
  // Verify that the initial body request (similar to API request is valid)
  const parseBody = EngagementAnalysis.parse(requestBody);
  let cohortId: ObjectId | undefined;
  let cohortName: string;

  // Get the cohort name default to "All Employees"
  if (isObjectId(parseBody.cohortId)) {
    cohortId = new ObjectId(parseBody.cohortId);
    const cohort = await findCohortById({ db, companyId, cohortId });
    cohortName = cohort?.name || "All Employees";
  } else {
    cohortName = "All Employees";
  }
  let question: string;

  if (isObjectId(parseBody.questionId)) {
    const customQuestion = await findCustomQuestionByID({
      db,
      companyID: companyId,
      customQuestionID: parseBody.questionId,
    });
    question = customQuestion?.question || "";
  } else {
    const jsonQuestion = getJsonEngagementQuestionById(parseBody.questionId);
    question = jsonQuestion?.question || "";
  }
  let answers: IEngagementSurveyFormModelByQuestionID[] | null = null;
  const startDate = parseBody.startDate
    ? new Date(parseBody.startDate)
    : undefined;
  const endDate = parseBody.endDate ? new Date(parseBody.endDate) : undefined;
  if (parseBody.questionId === "eNPSAdditionalFeedback") {
    answers = await getAllEnpsAdditionalFeedback({
      db,
      companyId,
      startDate,
      endDate,
      cohortId,
    });
  } else {
    answers = await getAllQuestionAnswersByID({
      db,
      companyId,
      questionId: parseBody.questionId,
      startDate,
      endDate,
      cohortId,
    });
  }

  if (!answers?.length) {
    throw new NotFoundError("No answers found for this question", {
      message: "We couldn't find any answers for this question.",
    });
  }

  return {
    cohortName,
    answers,
    question,
    total: answers.length,
    additionalFeedback: parseBody.questionId === "eNPSAdditionalFeedback",
  };
};

export const engagementInsightSummaryOfSummaryHandler = async ({
  requestBody,
  db,
  companyId,
}: PromptVariableContext): Promise<EngagementInsightSummaryOfSummaryPromptVariables> => {
  const parseBody =
    engagementInsightSummaryOfSummaryPromptVariables.parse(requestBody);
  return parseBody;
};
