import { Db, ObjectId } from "mongodb";

import { IFieldFilter } from "@repo/models";

import {
  AVAILABLE_AGGREGATION_OPERATIONS,
  MatchStage,
  QuestionGroupMinMaxResult,
  QuestionGroupingSession,
  ReviewReportAggregationOperationDefinition,
  ReviewReportAggregationOperationInput,
  ReviewReportDataProps,
  ReviewReportSummarizeByInput,
  SelectedQuestion,
} from "./types";

import {
  binningOptions,
  removeNullMatches,
  reviewSummarizeByFieldPathMap,
} from "./utils";

import { ReportAnalyticsRbacPermissions } from "../format-review-report-data";
import {
  createGroupByDateField,
  generateAllowedCustomFields,
  getBucketAggregation,
  getBucketBoundaries,
} from "../shared-utils";
import { formatFilters } from "./format-filter";
import { selectMatchOperation } from "./select-match-operation";
import { translateSorts } from "./translate-sort";

export * from "./format-filter";
export * from "./translate-sort";
export * from "./select-match-operation";
export * from "./types";

enum ColumnType {
  question = "UNIQUE_QUESTION",
}

export const maximumReviewReportPageSize = 200;

// format the path string to for response object
// handles the case where some values are nested
export const generateFieldPath = (rawType: string, rawName: string): string => {
  if (rawType === "GROUPED_QUESTION") {
    return `question_group_map.${rawName}.answer`;
  }
  if (rawType === "UNIQUE_QUESTION") {
    return `questions_map.${rawName}.answer`;
  }
  if (rawType === "REVIEW_FORM_FIELD") {
    if (rawName === "name") {
      return `review_form.${rawName}`;
    }
    return `${rawName}`;
  }
  if (rawType === "REVIEW_FIELD") {
    return `review.${rawName}`;
  }
  if (rawType === "EMPLOYEE_FIELD") {
    return `review.subject.custom_values.${rawName}`;
  }
  if (rawType === "REVIEW_CYCLE_FIELD") {
    return `review_cycle.${rawName}`;
  }
  return "";
};

// formats the ID field path or object for summarizing
const generateSummarizeBy = (type: string, name: string) => {
  if (type === "GROUPED_QUESTION") {
    return {
      _id: `question_group_map.${name}.answer`,
      name: `question_group_map.${name}.answer`,
    };
  }
  if (type === "EMPLOYEE_FIELD") {
    if (
      reviewSummarizeByFieldPathMap[type] &&
      reviewSummarizeByFieldPathMap[type][name]
    ) {
      return reviewSummarizeByFieldPathMap[type][name];
    }
    return {
      _id: `review.subject.custom_values.${name}`,
      name: `review.subject.custom_values.${name}`,
    };
  }
  if (
    reviewSummarizeByFieldPathMap[type] &&
    reviewSummarizeByFieldPathMap[type][name]
  ) {
    return reviewSummarizeByFieldPathMap[type][name];
  }

  return { _id: "", name: "" };
};

export const getQuestionGroupingStages = (
  selectedQuestions?: SelectedQuestion[]
) => {
  const questionGroupAddFields: Record<string, unknown> = {};
  const questionGroupCleanup: Record<string, unknown> = {};
  const questionGroupDistinctCount: Record<string, unknown> = {};

  selectedQuestions?.forEach((questionGroup) => {
    const fieldID = `question_group_map.${questionGroup._id.toString()}`;

    // this will add a new record inside the `question_group_map` object
    // for each question group. The result will be an array from the
    // 'questions' field filtered down to only the questions in the group.
    questionGroupAddFields[fieldID] = {
      $filter: {
        input: "$questions",
        as: "question",
        cond: {
          $in: ["$$question.hash", questionGroup.questions],
        },
      },
    };

    // after we have the questions in each group, we then combine them
    // into a single value. For now I'm taking the max of the answers.
    questionGroupCleanup[fieldID] = {
      $cond: [
        {
          $in: [
            {
              $first: `$${fieldID}.type`,
            },
            ["multiple-select", "multiple-choice"],
          ],
        },
        {
          $reduce: {
            // reduce to one document with all answers pushed to "answer" field
            input: {
              // filter out null values (no answer given for the question)
              $filter: {
                input: `$${fieldID}`,
                as: "this",
                cond: { $ne: ["$$this.answer", null] },
              },
            },
            initialValue: {
              answer: [],
              type: [],
            },
            in: {
              answer: {
                $cond: [
                  { $isArray: "$$this.answer" },
                  { $concatArrays: ["$$value.answer", "$$this.answer"] },
                  { $concatArrays: ["$$value.answer", ["$$this.answer"]] },
                ],
              },
              type: { $setUnion: ["$$value.type", ["$$this.type"]] },
            },
          },
        },
        { $arrayElemAt: [`$${fieldID}`, 0] },
      ],
    };

    // finally we add a distinct count for the question group if it's a multiple choice question
    questionGroupDistinctCount[`${fieldID}.distinctCount`] = {
      $cond: [
        {
          $and: [
            { $isArray: `$${fieldID}.type` },
            {
              $in: [
                { $arrayElemAt: [`$${fieldID}.type`, 0] },
                ["multiple-select", "multiple-choice"],
              ],
            },
          ],
        },
        {
          $size: {
            $setUnion: [`$${fieldID}.answer`],
          },
        },
        "$$REMOVE",
      ],
    };
  });

  return {
    questionGroupAddFields,
    questionGroupCleanup,
    questionGroupDistinctCount,
  };
};

// this function returns the min and max values for the field being summarized by
// this is in preparation for calculating the boundary values for the bucket stage
const getMinMaxForReviewReportField = async (
  db: Db,
  companyID: ObjectId,
  reviewReportMatches: MatchStage[] | null,
  questionGroupingSession: QuestionGroupingSession | null,
  name: string,
  fieldPath: string,
  type: string
) => {
  // pipeline to return the max and min values for all grouped question answers
  const pipeline = [
    {
      $match: {
        company_id: companyID,
        status: { $ne: "deleted" },
        ...(reviewReportMatches && reviewReportMatches.length > 0
          ? { $and: reviewReportMatches }
          : {}),
      },
    },
    {
      $group: {
        _id: {},
        min: { $min: `$${fieldPath}` },
        max: { $max: `$${fieldPath}` },
      },
    },
  ] as Record<string, unknown>[];

  // if fieldType is question groupe, we need to add some addField stages to get more data on the question group
  if (type === "GROUPED_QUESTION") {
    const questionGroupDetails =
      questionGroupingSession?.selectedQuestions.find(
        (question: { _id: { toString: () => any } }) =>
          question._id.toString() === name
      );
    const selectedQuestion = questionGroupDetails ? [questionGroupDetails] : [];

    const { questionGroupAddFields, questionGroupCleanup } =
      getQuestionGroupingStages(selectedQuestion as SelectedQuestion[]);

    pipeline.splice(1, 0, { $addFields: { ...questionGroupAddFields } });
    pipeline.splice(2, 0, { $addFields: { ...questionGroupCleanup } });
  }
  // run pipeline
  const results = await db
    .collection("review_reports")
    .aggregate<QuestionGroupMinMaxResult>(pipeline, {
      allowDiskUse: true,
      collation: { locale: "en" }, // sort case insensitive
    })
    .toArray();

  return {
    min: results.length ? results[0].min : null,
    max: results.length ? results[0].max : null,
  };
};

const getSecondarySelectionAggregation = (
  field: { _id: string; name: string },
  name: string,
  selection: string | number | null
) => {
  const dateFields = [
    "Hire Date",
    "Termination Date",
    "due_date",
    "start_date",
    "completed_date",
    "signers_due_date",
    "authors_due_date",
  ];

  if (dateFields.includes(name)) {
    return createGroupByDateField(selection as string, field.name);
  }

  return `$${field.name}`;
};

const aggregateFieldPath = (field: { _id: string; name: string }) => {
  return {
    _id: `$${field._id}`,
    name: `$${field.name}`,
  };
};

/**
 * The first thing this function does is create an '$addFields' stage that will
 * add all summary function keys to a separate nested object in each document.
 * This will "cleanup" the values so that empty strings are null and this
 * will give us a more expected behavior for the summary functions.
 */
export const selectSummaryStages = async (
  db: Db,
  companyID: ObjectId,
  summarizeBy: ReviewReportSummarizeByInput[],
  aggregationOperations: ReviewReportAggregationOperationInput[],
  reviewReportMatches: MatchStage[] | null,
  questionGroupingSession: QuestionGroupingSession | null
) => {
  // values to group by in $group stage _id{...groupBy}
  const groupBy: { [x: string]: { $ifNull: string[] } } = {};
  const preCleanupStage: { [x: string]: any } = {};
  let binningStages: any = [];
  // performs summary functions (avg, sum, count, etc)
  const groupStage: { [x: string]: { [x: string]: string } | {} } = {};

  // temporary field to store the summary values
  type TCleanupStage =
    | string
    | {
        _id: string;
        name: string;
        $cond?: (string | { $eq: string[] } | null)[];
      }
    | {
        $cond: (string | { $eq: string[] } | null)[];
      };

  type TReduceStage = {
    $reduce: {
      input: {
        $filter: {
          input: string;
          as: string;
          cond: { [x: string]: string | (string | null)[] };
        };
      };
      initialValue: string[];
      in: {
        $cond: (
          | { $isArray: string }
          | { $concatArrays: (string | string[])[] }
        )[];
      };
    };
  };

  const cleanupStage: { [x: string]: TCleanupStage } = {};
  // puts values back into the correct path
  const postGroupCleanupStage: {
    [x: string]: string | TReduceStage;
  } = {};

  // add distinctCount data for questions and question groups
  // to be used by sort operations on those columns
  const distinctCountQuestionsStage: {
    [x: string]: { $size: { $setUnion: (string | string[])[] } };
  } = {};

  for (const summarizeByItem of summarizeBy) {
    const { type, name, selection } = summarizeByItem;

    const field = generateSummarizeBy(type, name);

    const aggregatedFieldPath = aggregateFieldPath(field);

    const cleanupLocation = `cleanup.${type}${name}`;

    if (selection) {
      const secondarySelectionAggregation = getSecondarySelectionAggregation(
        field,
        name,
        selection
      );

      preCleanupStage[cleanupLocation] = secondarySelectionAggregation;

      cleanupStage[`summarizeBy.${type}.${name}`] = {
        _id: aggregatedFieldPath._id,
        name: `$${cleanupLocation}`,
      };

      if (binningOptions.includes(selection)) {
        // if automatic, boundaries are automatic
        let boundaries: number[] = [];

        // if not automatic, set up boundaries
        if (typeof selection === "number") {
          const minMax = await getMinMaxForReviewReportField(
            db,
            companyID,
            reviewReportMatches,
            questionGroupingSession,
            name,
            field.name,
            type
          );
          boundaries = await getBucketBoundaries(minMax, selection);
        }
        const bucketAggregation = getBucketAggregation(
          cleanupLocation,
          boundaries,
          name,
          type,
          "reviewReports"
        );
        binningStages = [...binningStages, ...bucketAggregation];
      }
    } else {
      // add summarized by details to separate object
      cleanupStage[cleanupLocation] = aggregatedFieldPath._id;
      cleanupStage[`summarizeBy.${type}.${name}`] = aggregatedFieldPath;
    }

    // review form field is a special case where we want to group by name
    // instead of id, since review forms can have different form versions.
    if (type === "REVIEW_FORM_FIELD" && name === "name") {
      cleanupStage[cleanupLocation] = aggregatedFieldPath.name;
    }

    groupBy[`${type}_${name}`] = { $ifNull: [`$${cleanupLocation}`, ""] };
  }

  aggregationOperations.forEach((field) => {
    const name = `${field.type}_${field.name}`;
    const location = generateFieldPath(field.type, field.name);
    const operation = field.operation;
    let operationKey: string | null = null;

    // the count operation works a little differently
    if (operation === "count") {
      groupStage[name] = {
        $count: {},
      };

      // this places all the summarized fields into a separate nested object
      // in summarize view, we want to remove the "review." prefix so
      // after grouping, it doesn't conflict with the "review" field.
      if (field.type === "EMPLOYEE_FIELD") {
        const trimmedLocation = location.replace("review.", "");
        postGroupCleanupStage[trimmedLocation] = `$${name}`;
      } else {
        postGroupCleanupStage[location] = `$${name}`;
      }

      return;
    }

    // concatenate is a special case for multiple-select or multiple-choice questions
    // we push all the text answers into a single array from each review report
    // including duplicates as these will be counted on the frontend as distinct answers
    if (operation === "concatenate") {
      groupStage[name] = {
        $push: `$cleanup.${name}`,
      };

      const cleanupValue = {
        $reduce: {
          input: {
            // filter out null values (no answer given for the question)
            $filter: {
              input: `$${name}`,
              as: "this",
              cond: { $ne: ["$$this", null] },
            },
          },
          initialValue: [],
          in: {
            $cond: [
              { $isArray: "$$this" },
              // handle the case where the value is already an array (`multiple-select` question)
              { $concatArrays: ["$$value", "$$this"] },
              // handle the case where the value is a single string (`multiple-choice` question)
              { $concatArrays: ["$$value", ["$$this"]] },
            ],
          },
        },
      };

      postGroupCleanupStage[location] = cleanupValue;

      // removes `.answer` and adds `.distinctCount` from the location to add our sortable distinct count
      const distinctCountLocation = location.replace(
        ".answer",
        ".distinctCount"
      );
      distinctCountQuestionsStage[distinctCountLocation] = {
        $size: { $setUnion: [`$${location}`, []] },
      };
    }

    cleanupStage[`cleanup.${name}`] = {
      $cond: [{ $eq: [`$${location}`, ""] }, null, `$${location}`],
    };
    if (operation === "average") {
      operationKey = "$avg";
    } else if (operation === "maximum") {
      operationKey = "$max";
    } else if (operation === "minimum") {
      operationKey = "$min";
    } else if (operation === "sum") {
      operationKey = "$sum";
    }

    if (operationKey) {
      groupStage[name] = {
        [operationKey]: `$cleanup.${name}`,
      };

      // this places all the summarized fields into a separate nested object
      // in summarize view, we want to remove the "review." prefix so
      // after grouping, it doesn't conflict with the "review" field.
      if (field.type === "EMPLOYEE_FIELD") {
        const trimmedLocation = location.replace("review.", "");
        postGroupCleanupStage[trimmedLocation] = `$${name}`;
      } else {
        postGroupCleanupStage[location] = `$${name}`;
      }
    }
  });

  // for multiple-choice and multiple-select questions,
  // we need to add a stage that will count the number of distinct values

  const stages = [
    {
      $addFields: {
        ...preCleanupStage,
      },
    },
    {
      $addFields: {
        ...cleanupStage,
      },
    },
    // bucket stage for binning question groups and custom values
    ...binningStages,
    {
      $group: {
        // if summarizeBy fields exist, group by them
        // else, group by default review report id
        _id: summarizeBy.length > 0 ? groupBy : "$_id",
        ...groupStage,
        summarizeBy: { $first: "$summarizeBy" },
      },
    },
    {
      $addFields: {
        ...postGroupCleanupStage,
      },
    },
    {
      $addFields: {
        ...distinctCountQuestionsStage,
      },
    },
  ];

  return stages;
};

/**
 * Generates the match stage based on the filters provided.
 */
export const generateReviewReportMatches = (
  filters: IFieldFilter[][],
  allowedCustomFields: string[]
): MatchStage[] => {
  const matches = filters
    .map((filterGroup) => {
      const { field: fieldValue, type, category } = filterGroup[0];
      const filteredCustomFields = allowedCustomFields?.length > 0;
      let fieldPath = fieldValue;
      const allowedToQuery =
        !filteredCustomFields || allowedCustomFields.includes(fieldValue);

      // Process filters creating normalized field paths using the category and field.value (db name for the field)
      switch (category) {
        case "EMPLOYEE_FIELD":
          if (true) {
            if (["name", "primary_role", "_id"].includes(fieldValue)) {
              fieldPath = `review.subject.${fieldValue}`;
            } else if (["group", "department", "Group"].includes(fieldValue)) {
              fieldPath = "review.subject.group._id";
            } else if (fieldValue === "email") {
              fieldPath = "review.subject.email.normalized";
            } else if (["Manager", "manager"].includes(fieldValue)) {
              fieldPath = "review.subject.manager._id";
            } else if (fieldValue === "deactivated") {
              fieldPath = "review.subject.deactivated.state";
            } else if (fieldValue === "Manager's Email") {
              fieldPath = "review.subject.manager.email";
            } else if (["person", "people"].includes(type)) {
              fieldPath = `review.subject.custom_values.${fieldValue}._id`;
            } else {
              fieldPath = `review.subject.custom_values.${fieldValue}`;
            }
          }
          break;
        case "REVIEW_FIELD":
          if (fieldValue === "review") {
            fieldPath = "review.id";
          } else if (fieldValue === "subject") {
            fieldPath = "review.subject._id";
          } else if (fieldValue === "participants") {
            fieldPath = "review.participants._id";
          } else if (filteredCustomFields && allowedToQuery) {
            fieldPath = `review.subject.custom_values.${fieldValue}`;
          } else {
            fieldPath = `review.${fieldValue}`;
          }
          break;
        case "REVIEW_CYCLE_FIELD":
          if (fieldValue === "review_cycle") {
            fieldPath = "review_cycle._id";
          } else if (fieldValue === "group") {
            fieldPath = "review_cycle.group.id";
          } else {
            fieldPath = `review_cycle.${fieldValue}`;
          }
          break;
        case "SUBJECT":
          if (fieldValue === "subject") {
            fieldPath = "review.subject._id";
          } else if (allowedToQuery) {
            fieldPath = `review.subject.custom_values.${fieldValue}`;
          }
          break;
        case "REVIEW_FORM_FIELD":
        default:
          if (fieldValue === "name") {
            fieldPath = "review_form.name";
          } else {
            if (fieldValue === "review_template") {
              fieldPath = "review_template.id";
            } else if (fieldValue === "review_cycle") {
              fieldPath = "review_cycle._id";
            } else if (fieldValue === "signers" || fieldValue === "authors") {
              fieldPath = `${fieldValue}._id`;
            }
          }
      }

      const formattedFilterGroups = filterGroup
        .map((filter) => {
          // "$or"s are only allowed when they are for the same field (category, type, field.value)
          // for subsequent entries, we validate by comparison with first values derived above (filterGroup[0])
          if (
            filter.type !== type ||
            filter.field !== fieldValue ||
            filter.category !== category
          ) {
            return null;
          }
          const values = Array.isArray(filter.value) ? filter.value : [];
          const matchOperation = selectMatchOperation(
            fieldPath,
            filter.comparison,
            values,
            filter.value,
            type
          );
          return matchOperation;
        })
        .filter(removeNullMatches);

      // if filter group greater than 1, deal within "or" operations within the group
      if (formattedFilterGroups.length > 1) {
        return {
          $or: formattedFilterGroups,
        };
      } else {
        // handle and
        return formattedFilterGroups.length > 0
          ? formattedFilterGroups[0]
          : null;
      }
    })
    .filter(removeNullMatches);

  return matches;
};

export const selectAggregationOperations = (
  aggregationOperations: ReviewReportAggregationOperationInput[]
): ReviewReportAggregationOperationDefinition[] => {
  const operations = aggregationOperations.filter((operation) => {
    return AVAILABLE_AGGREGATION_OPERATIONS.includes(operation.operation);
  }) as ReviewReportAggregationOperationDefinition[];

  return operations;
};

/**
 * This is a private function used to select the expected "Column Type" from
 * a column name.
 *
 * The zustand store handles this on the front end. This function is meant to
 * match the logic in
 * assets/react/pages/ReportAnalytics/pages/Report/store/index.ts
 * fetchAvailableColumns method.
 */
export const selectColumnType = (columnName: string): string | null => {
  const columnType = columnName.split("_")[0];

  switch (columnType) {
    case "reviewcycle":
      return "REVIEW_CYCLE_FIELD";
    case "review":
      return "REVIEW_FIELD";
    case "reviewform":
      return "REVIEW_FORM_FIELD";
    case "groupedquestion":
      return "GROUPED_QUESTION";
    case "question":
      return "UNIQUE_QUESTION";
    case "employee":
      return "EMPLOYEE_FIELD";
    default:
      return null;
  }
};

export const getQuestionGroupingSessionByID = async (
  db: Db,
  sessionID: ObjectId
): Promise<QuestionGroupingSession> => {
  const session = (await db
    .collection("question_grouping_session")
    .findOne({ _id: sessionID })) as QuestionGroupingSession;
  return session;
};

export const getReviewReportPipeline = async (
  db: Db,
  props: ReviewReportDataProps,
  // need this because implementation in reporting webserver is different for apollo errors
  errorConstructor: ErrorConstructor = Error
): Promise<Record<string, unknown>[]> => {
  const {
    questionGroupingSessionID,
    companyID,
    filters,
    sorts,
    pageNumber = 1,
    pageSize = 50,
    summarizeBy,
    aggregationOperations,
    userPermissions,
    maximumReviewReportPageSize = 200,
    columns,
  } = props;
  const actualPageSize = Math.min(maximumReviewReportPageSize, pageSize);
  const skipParam = (pageNumber - 1) * actualPageSize;
  const limitParam = actualPageSize;
  const reviewFilters = formatFilters(filters || [], errorConstructor);

  let customValuesProjection: any = "$review.subject.custom_values";
  let customValuesProjectionSummary: any = "$subject.custom_values";
  let allowedCustomFields: string[] = [];
  let questionProjection: any = 1;
  let questionMapProjection: any = 1;

  // this whole section is to ensure we do not return extra question data for managers
  // managers can only see questions that match columns visible in report
  const permissionToCreateReport =
    userPermissions.includes(ReportAnalyticsRbacPermissions.createReport) ||
    userPermissions.includes(
      ReportAnalyticsRbacPermissions.createEmployeeReport
    );

  const permissionToCreateReportProjection = permissionToCreateReport
    ? 1
    : null;

  if (!permissionToCreateReport) {
    const allowedCustomFieldsResponse = await generateAllowedCustomFields(
      db,
      companyID,
      userPermissions,
      "reviewReport"
    );
    allowedCustomFields = allowedCustomFieldsResponse.allowedCustomFields;
    customValuesProjection = allowedCustomFieldsResponse.customValuesProjection;
    customValuesProjectionSummary =
      allowedCustomFieldsResponse.customValuesProjectionSummary;

    const allowedQuestionFields = await generateAllowedQuestionFields(columns);
    const nonAdminQuestionProjection = {
      $filter: {
        input: "$questions",
        as: "question",
        cond: { $in: ["$$question.hash", allowedQuestionFields] },
      },
    };

    const nonAdminQuestionMapProjection = {
      $arrayToObject: {
        $filter: {
          input: { $objectToArray: "$questions_map" },
          as: "question",
          cond: { $in: ["$$question.k", allowedQuestionFields] },
        },
      },
    };
    questionProjection = nonAdminQuestionProjection;
    questionMapProjection = nonAdminQuestionMapProjection;
  }

  const reviewReportMatches = generateReviewReportMatches(
    reviewFilters,
    allowedCustomFields
  );

  const questionGroupingSession = await getQuestionGroupingSessionByID(
    db,
    questionGroupingSessionID
  );

  if (!questionGroupingSession) {
    throw new errorConstructor("Question grouping session not found");
  }

  const isSummaryView =
    summarizeBy.length > 0 || aggregationOperations.length > 0;
  const sortStage = translateSorts(sorts, summarizeBy);
  const sortAndLimitStages: Record<string, unknown>[] = [
    // sorts will go here like this
    ...(Object.keys(sortStage).length > 0
      ? [{ $sort: sortStage }]
      : [{ $sort: { _id: 1 } }]),

    // pagination always comes after sorts.
    { $skip: skipParam },
    { $limit: limitParam },
  ];

  let summaryStages: any[] = [];
  if (isSummaryView) {
    summaryStages = await selectSummaryStages(
      db,
      companyID,
      summarizeBy,
      aggregationOperations,
      reviewReportMatches,
      questionGroupingSession
    );
  }

  const {
    questionGroupAddFields,
    questionGroupCleanup,
    questionGroupDistinctCount,
  } = getQuestionGroupingStages(questionGroupingSession.selectedQuestions);

  const pipeline = [
    {
      $match: {
        company_id: companyID,
        status: { $ne: "deleted" },
        ...(reviewReportMatches && reviewReportMatches.length > 0
          ? { $and: reviewReportMatches }
          : {}),
      },
    },

    // These next three stages are used to create the question group map
    // and then combine the answers into a single value. These stages are
    // generated above from the question grouping session data.
    {
      $addFields: {
        ...questionGroupAddFields,
      },
    },

    {
      $addFields: {
        ...questionGroupCleanup,
      },
    },

    {
      $addFields: {
        ...questionGroupDistinctCount,
      },
    },

    ...(isSummaryView
      ? []
      : [
          // add type check to ensure its an array before sizing it -> if its not, push string into array
          // add "count" field to any questions that are of multiple-select type
          // for sorting, which will provide a count of selected values for the question
          {
            $addFields: {
              questions: {
                $map: {
                  input: "$questions",
                  as: "question",
                  in: {
                    $cond: {
                      if: { $eq: ["$$question.type", "multiple-select"] },
                      then: {
                        _id: "$$question._id",
                        hash: "$$question.hash",
                        form_id: "$$question.form_id",
                        form_name: "$$question.form_name",
                        type: "$$question.type",
                        question: "$$question.question",
                        answer: "$$question.answer",
                        count: {
                          $size: {
                            $cond: {
                              if: {
                                $ne: [{ $type: "$$question.answer" }, "array"],
                              },
                              then: [],
                              else: "$$question.answer",
                            },
                          },
                        },
                      },
                      else: "$$question",
                    },
                  },
                },
              },
            },
          },
        ]),
    // create a map of the questions and question groups. This will allow
    // us to sort by value.
    {
      $addFields: {
        questions_map: {
          $arrayToObject: {
            $map: {
              input: "$questions",
              as: "el",
              in: {
                k: "$$el.hash",
                v: "$$el",
              },
            },
          },
        },
      },
    },

    {
      $addFields: {
        "review.subject.custom_values.Manager's Email":
          "$review.subject.manager.email",
        author_completion: {
          $multiply: [
            {
              $cond: {
                if: {
                  $eq: [
                    {
                      $size: "$authors",
                    },
                    0,
                  ],
                },
                // this should not happen with authors, but leaving here as a failsafe
                then: null,
                else: {
                  $divide: [
                    "$author_turn",
                    {
                      $size: "$authors",
                    },
                  ],
                },
              },
            },
            100,
          ],
        },
        signer_completion: {
          $multiply: [
            {
              $cond: {
                if: {
                  $eq: [
                    {
                      $size: "$signers",
                    },
                    0,
                  ],
                },
                // for the case when there are no signers, to avoid causing a division by zero error
                then: null,
                else: {
                  $divide: [
                    "$signer_turn",
                    {
                      $size: "$signers",
                    },
                  ],
                },
              },
            },
            100,
          ],
        },
      },
    },

    ...(isSummaryView ? summaryStages : []),
    isSummaryView
      ? {
          $project: {
            review_cycle: 1,
            review: {
              id: 1,
              name: 1,
              start_date: 1,
              subject: 1,
              completed: 1,
              completed_date: 1,
              easy_add_enabled: 1,
              forms_awaiting_approval: 1,
              status: 1,
              participants: permissionToCreateReportProjection,
            },
            questions: questionProjection,
            questions_map: questionMapProjection,
            question_group_map: 1,
            subject: customValuesProjectionSummary,
            review_form: 1,
            summarizeBy: 1,
            review_report: {
              id: "$_id",
              authors: "$authors",
              signers: "$signers",
              authors_due_date: "$authors_due_date",
              signers_due_date: "$signers_due_date",
              completed_date: "$completed_date",
              authoring_completed_at: "$authoring_completed_at",
              signing_completed_at: "$signing_completed_at",
              status: "$status",
              author_completion: "$author_completion",
              signer_completion: "$signer_completion",
              participants: "$participants",
              form_comment: "$form_comment",
            },
            // in summary view, we already performed the count operation, so the count will already be available
            forms_awaiting_approval_count: "$review.forms_awaiting_approval",
          },
        }
      : {
          $project: {
            review_cycle: 1,
            review: {
              id: 1,
              name: 1,
              start_date: 1,
              subject: {
                _id: 1,
                name: 1,
                email: 1,
                manager: 1,
                deactivated: 1,
                company: 1,
                chain_of_command: 1,
                group: 1,
                custom_values: permissionToCreateReportProjection,
                primary_role: 1,
                group_administrator: 1,
              },
              completed: 1,
              completed_date: 1,
              easy_add_enabled: 1,
              forms_awaiting_approval: 1,
              status: 1,
              participants: permissionToCreateReportProjection,
            },
            questions: questionProjection,
            questions_map: questionMapProjection,
            question_group_map: 1,
            subject: customValuesProjection,
            review_form: 1,
            review_report: {
              id: "$_id",
              authors: "$authors",
              signers: "$signers",
              authors_due_date: "$authors_due_date",
              signers_due_date: "$signers_due_date",
              completed_date: "$completed_date",
              authoring_completed_at: "$authoring_completed_at",
              signing_completed_at: "$signing_completed_at",
              status: "$status",
              redact_authors: "$redact_authors",
              author_completion: "$author_completion",
              signer_completion: "$signer_completion",
              participants: "$participants",
              form_comment: "$form_comment",
            },
            forms_awaiting_approval_count: {
              $size: { $ifNull: ["$review.forms_awaiting_approval", []] },
            },
          },
        },

    ...sortAndLimitStages,
  ];

  return pipeline.filter(removeNullMatches);
};

export async function generateAllowedQuestionFields(
  columns: { id: string; type: string }[] | null
): Promise<any> {
  let allowedQuestionFields: string[] = [];
  const uniqueQuestionColumns = columns?.filter(
    (column) => column.type === ColumnType.question
  );
  if (uniqueQuestionColumns && uniqueQuestionColumns.length > 0) {
    const questionColumnIds: Set<string> = new Set(
      uniqueQuestionColumns.map((column) => {
        return column.id.split("_")[1];
      })
    );
    allowedQuestionFields = Array.from(questionColumnIds);
  }
  return allowedQuestionFields;
}
