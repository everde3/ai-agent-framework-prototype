import { ObjectId } from "mongodb";

import {
  IFieldFilter,
  IReportingQuestionGroupingSessionDocument,
  IReviewReportSort,
} from "@repo/models";

export type Sort = {
  name: string;
  direction: 1 | -1;
};

export type MongoSort = Record<string, Sort["direction"]>;

export const AVAILABLE_AGGREGATION_OPERATIONS = [
  "sum",
  "average",
  "minimum",
  "maximum",
  "count",
  "concatenate",
];
export type ReviewReportAggregationOperation =
  (typeof AVAILABLE_AGGREGATION_OPERATIONS)[number];

export type ReviewReportAggregationOperationInput = {
  type: string;
  name: string;
  operation: string;
};

export interface ReviewReportAggregationOperationDefinition
  extends Omit<ReviewReportAggregationOperationInput, "operation"> {
  operation: ReviewReportAggregationOperation;
}
export interface ReviewReportSummarizeByInput {
  type: string;
  name: string;
  selection: string | undefined | number | null;
  fieldType?: string;
}

export type ReviewReportDataProps = {
  questionGroupingSessionID: ObjectId;
  companyID: ObjectId;
  columns: { id: string; type: string }[] | null;
  filters: IFieldFilter[][] | null;
  pageNumber?: number;
  pageSize?: number;
  sorts: IReviewReportSort[] | null;
  summarizeBy: ReviewReportSummarizeByInput[];
  aggregationOperations: ReviewReportAggregationOperationInput[];
  userPermissions: string[];
  maximumReviewReportPageSize?: number;
};
export interface QuestionGroupMinMaxResult {
  _id: string;
  min: number;
  max: number;
}

export type SelectedQuestion =
  IReportingQuestionGroupingSessionDocument["selectedQuestions"][number];

export type QuestionGroupingSession = {
  _id: ObjectId;
  selectedQuestions: SelectedQuestion[];
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
  reviewQueryID: ObjectId;
  employeeQueryID: ObjectId;
  companyID: ObjectId;
};

export type MatchStage = {
  [key: string]: any;
};

export type ReviewFields = {
  [key: string]: {
    name: string;
    type: string;
  };
};

export const ReviewFields: ReviewFields = {
  review: {
    name: "Review Name",
    type: "text",
  },
  startDate: {
    name: "Start Date",
    type: "date",
  },
  participants: {
    name: "Participants",
    type: "people",
  },
  reports: {
    name: "Review Reports",
    type: "text",
  },
  authors_due_date: {
    name: "Author's Due Date",
    type: "date",
  },
  signers_due_date: {
    name: "Signer's Due Date",
    type: "date",
  },
  authors: {
    name: "Authors",
    type: "people",
  },
  signers: {
    name: "Signers",
    type: "people",
  },
  visible_to_subject: {
    name: "Visible to Subject",
    type: "boolean",
  },
  redact_authors: {
    name: "Redact Authors",
    type: "boolean",
  },
  review_template: {
    name: "Review Template",
    type: "template",
  },
  review_cycle: {
    name: "Review Cycle",
    type: "cycle",
  },
  reviewCycleGroup: {
    name: "Review Cycle Group",
    type: "department",
  },
  form_360: {
    name: "Form 360",
    type: "boolean",
  },
  authoring_completed_at: {
    name: "Authored Date",
    type: "date",
  },
  signing_completed_at: {
    name: "Signed Date",
    type: "date",
  },
};
