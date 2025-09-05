import type { ObjectId } from "mongodb";

import type {
  IReportingReviewQuestionDocument,
  ISummaryColumnMetadata,
} from "@repo/models";
import { get } from "@repo/utils-isomorphic";

import { ColumnsConfig } from "./ColumnsConfig";

import {
  getGoalReportCSVValue,
  getGoalReportDisplayColumn,
  getGoalReportSummaryCSVValue,
} from "../create-goal-report-pipeline/utils";

import {
  parseSummarizeByRowElement,
  parseValueForCSV,
  selectColumnSummaryOperation,
  selectGroupedQuestionSummaryOperation,
  selectSingleQuestionSummaryOperation,
  selectSummarizeByColumnDisplayName,
} from "./parsers";
import {
  type CSVCompanySettings,
  type IAnalyticsCSVData,
  ReportAnalyticsRbacPermissions,
} from "./reducers";

export const COLUMN_NAME_DELIMITER = "_";

/**
 * Add any desired formatting to the csv column header.
 * This formatting is "optional", meaning we'll attempt the formatting, but
 * if it fails, we'll just return the original name.
 *
 * Any "required" should be done outside of this function.
 */
export const formatCSVDisplayName = (name: string): string => {
  let formattedName = name;
  // capitalize
  try {
    formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  } catch (e) {
    return formattedName;
  }

  return formattedName;
};

export const splitNameByDelimiter = (
  name: string,
  delimiter: string
): string[] => {
  // drop the "domain" part of the name
  const [domain, ...rest] = name.split(delimiter);

  // join the rest, this accounts for cases where name is of the form
  // "review_name1_name2"
  const columnIdentifier = rest.join(delimiter);

  return [domain, columnIdentifier];
};

export const getReviewDisplayColumn = (
  column: string,
  delimiter: "_"
): string => {
  const [, columnIdentifier] = splitNameByDelimiter(column, delimiter);
  return get<string, string>(
    ["reviewFields", columnIdentifier, "headerName"],
    ColumnsConfig,
    columnIdentifier
  );
};

export const getReviewFormDisplayColumn = (
  column: string,
  delimiter: "_"
): string => {
  const [, columnIdentifier] = splitNameByDelimiter(column, delimiter);
  return get<string, string>(
    ["reviewFormFields", columnIdentifier, "headerName"],
    ColumnsConfig,
    columnIdentifier
  );
};

export const getReviewCycleDisplayColumn = (
  column: string,
  delimiter: "_"
): string => {
  const [, columnIdentifier] = splitNameByDelimiter(column, delimiter);
  return get<string, string>(
    ["reviewCycleFields", columnIdentifier, "headerName"],
    ColumnsConfig,
    columnIdentifier
  );
};

export const getEmployeeDisplayColumn = (
  column: string,
  delimiter: "_"
): string => {
  const [, columnIdentifier] = splitNameByDelimiter(column, delimiter);
  return columnIdentifier;
};

/**
 * Add an aggregation prefix to a column name.
 *
 * In general the return format is : "aggregationOperation of columnName"
 * e.g. "Average of my column name"
 */
export const addAggregationPrefix = (
  aggregationOperation: string,
  columnName: string
): string => {
  const aggregationPrefix = `${aggregationOperation} of `;
  return aggregationPrefix + columnName;
};

/**
 * Given an array of denormalized questions, array of aggregation operations,
 * and a selected question, returns the display name for the question.
 *
 * We first select the question name, then find the matching
 * aggregationOperation entry. From this, we create a new display name, which
 * will follow the general pattern of "aggregationOperation of questionName"
 */
export const getSingleQuestionSummaryDisplayName = (
  questionData: IReportingReviewQuestionDocument[] | undefined,
  selectedColumnSummaryOptions: ISummaryColumnMetadata,
  selectedQuestion: string
): string => {
  if (!questionData) {
    return "";
  }
  const rawQuestionDisplayName = getSingleQuestionDisplayName(
    questionData,
    selectedQuestion
  );

  try {
    const aggregationOperation = selectSingleQuestionSummaryOperation(
      selectedColumnSummaryOptions
    );

    let summarizedQuestionDisplayName = rawQuestionDisplayName;
    if (selectedColumnSummaryOptions.availableSummaryFunctions.length > 1) {
      summarizedQuestionDisplayName = addAggregationPrefix(
        aggregationOperation,
        rawQuestionDisplayName
      );
    }

    return formatCSVDisplayName(summarizedQuestionDisplayName);
  } catch (err) {
    return formatCSVDisplayName(rawQuestionDisplayName);
  }
};

/**
 * Given an array of grouped questions, array of aggregation operations,
 * and a selected question group, returns the display name for the question.
 *
 * We first select the question name, then find the matching
 * aggregationOperation entry. From this, we create a new display name, which
 * will follow the general pattern of "aggregationOperation of
 * question group name"
 */
export const getGroupedQuestionSummaryDisplayName = (
  groupedQuestions: Record<string, unknown>[] | undefined,
  selectedColumnSummaryOptions: ISummaryColumnMetadata,
  selectedQuestion: string
): string => {
  if (!groupedQuestions) {
    return "";
  }
  const rawQuestionDisplayName = getGroupedQuestionDisplayName(
    groupedQuestions,
    selectedQuestion
  );

  try {
    const aggregationOperation = selectGroupedQuestionSummaryOperation(
      selectedColumnSummaryOptions
    );

    let summarizedQuestionDisplayName = rawQuestionDisplayName;
    if (selectedColumnSummaryOptions.availableSummaryFunctions.length > 1) {
      summarizedQuestionDisplayName = addAggregationPrefix(
        aggregationOperation,
        rawQuestionDisplayName
      );
    }

    return formatCSVDisplayName(summarizedQuestionDisplayName);
  } catch (err) {
    return formatCSVDisplayName(rawQuestionDisplayName);
  }
};

export const getSingleQuestionDisplayName = (
  questionData: IReportingReviewQuestionDocument[] | undefined,
  selectedQuestion: string
): string => {
  let questionName: string;

  if (!questionData) {
    return "";
  }

  try {
    const matchingQuestion = questionData.filter((question) => {
      return (
        get<ObjectId, null>(["hash"], question, null)?.toString() ===
        selectedQuestion
      );
    });

    if (matchingQuestion[0]) {
      questionName = matchingQuestion[0].question;
    } else {
      questionName = "";
    }
  } catch {
    questionName = "";
  }

  return questionName;
};

export const getGroupedQuestionDisplayName = (
  groupedQuestions: Record<string, unknown>[] | undefined,
  selectedQuestion: string
): string => {
  let questionName: string;

  if (!groupedQuestions) {
    return "";
  }

  try {
    const matchingQuestion = groupedQuestions.filter((groupedQuestion) => {
      return (
        get<ObjectId, null>(["_id"], groupedQuestion, null)?.toHexString() ===
        selectedQuestion
      );
    });

    if (matchingQuestion[0]) {
      questionName = matchingQuestion[0].name as string;
    } else {
      questionName = "";
    }
  } catch {
    questionName = "";
  }

  return formatCSVDisplayName(questionName);
};

/**
 * Given an array of array of aggregation operations, and a selected column,
 * returns the display name for the column.
 *
 * We first select the column name, then find the matching
 * aggregationOperation entry. From this, we create a new display name, which
 * will follow the general pattern of "aggregationOperation of
 * column name"
 */
export const getSummaryColumnDisplayName = (
  selectedColumnSummaryOptions: ISummaryColumnMetadata,
  column: string
): string => {
  const rawColumnDisplayName = getColumnDisplayName(column);

  try {
    const aggregationOperation = selectColumnSummaryOperation(
      selectedColumnSummaryOptions
    );

    let summarizedQuestionDisplayName = rawColumnDisplayName;
    if (selectedColumnSummaryOptions.availableSummaryFunctions.length > 0) {
      summarizedQuestionDisplayName = addAggregationPrefix(
        aggregationOperation,
        rawColumnDisplayName
      );
    }

    return formatCSVDisplayName(summarizedQuestionDisplayName);
  } catch (err) {
    return formatCSVDisplayName(rawColumnDisplayName);
  }
};

export const getColumnDisplayName = (column: string): string => {
  // gets the leading value, which is the type of column
  const [type, columnName] = splitNameByDelimiter(
    column,
    COLUMN_NAME_DELIMITER
  );
  switch (type) {
    case "employee":
      return getEmployeeDisplayColumn(column, COLUMN_NAME_DELIMITER);
    case "reviewcycle":
      return getReviewCycleDisplayColumn(column, COLUMN_NAME_DELIMITER);
    case "review":
      return getReviewDisplayColumn(column, COLUMN_NAME_DELIMITER);
    case "reviewform":
      return getReviewFormDisplayColumn(column, COLUMN_NAME_DELIMITER);
    case "goalreport":
      return getGoalReportDisplayColumn(columnName, COLUMN_NAME_DELIMITER);
    default:
      return column;
  }
};

type Counts = {
  [key: string]: number;
};

const countMultipleChoiceAnswers = (valueToParse: any) => {
  let updatedValueToParse: any[] = [];
  if (Array.isArray(valueToParse)) {
    const counts: Counts = valueToParse?.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    updatedValueToParse = Object?.entries(counts)
      ?.sort((a, b) => b?.[1] - a?.[1])
      ?.map(([val, count]) => `${val}(${count})`);
  }

  return updatedValueToParse;
};

/**
 * The purpose of this function is to extract question values from the raw
 * data, pass the value to the parser, and return in a format that can be
 * used to generate a csv (i.e. a string)
 */
export const getSingleQuestionAnswer = (
  dataElement: Record<string, unknown>,
  selectedQuestion: string,
  addSuffix = "",
  settings: CSVCompanySettings,
  isSummarized: Boolean
): string => {
  let valueToParse;

  const questionsMap = get(["questions_map"], dataElement, {});

  const matchingQuestion = get([selectedQuestion], questionsMap, null);

  if (matchingQuestion) {
    valueToParse = get(["answer"], matchingQuestion, "");
    if (isSummarized && Array.isArray(valueToParse)) {
      valueToParse = countMultipleChoiceAnswers(valueToParse);
    }
  } else {
    valueToParse = "";
  }

  const parsedValue = parseValueForCSV(valueToParse, settings);

  if (addSuffix) {
    return addSuffixToValue(parsedValue, addSuffix);
  }
  return parsedValue;
};

/**
 * The purpose of this function is to extract grouped question values from the raw
 * data, pass the value to the parser, and return in a format that can be
 * used to generate a csv (i.e. a string)
 */
export const getGroupedQuestionAnswer = (
  dataElement: Record<string, unknown>,
  selectedQuestion: string,
  addSuffix = "",
  settings: CSVCompanySettings,
  isSummarized: Boolean
): string => {
  let valueToParse;

  const questionGroupMap = get(["question_group_map"], dataElement, {});

  const matchingQuestion = get([selectedQuestion], questionGroupMap, null);

  if (matchingQuestion) {
    valueToParse = get(["answer"], matchingQuestion, "");
    if (isSummarized && Array.isArray(valueToParse)) {
      valueToParse = countMultipleChoiceAnswers(valueToParse);
    }
  } else {
    valueToParse = "";
  }

  const parsedValue = parseValueForCSV(valueToParse, settings);

  if (addSuffix) {
    return addSuffixToValue(parsedValue, addSuffix);
  }
  return parsedValue;
};

export const handleAnonymousAuthorParticipants = (
  valueToParse: any,
  anonymousAuthors: any[]
): any => {
  const anonymousAuthorIds = anonymousAuthors?.map((author) =>
    author._id.toString()
  );
  let processedIds = new Set();

  if (Array.isArray(valueToParse)) {
    valueToParse = valueToParse?.map((value) => {
      if (
        anonymousAuthorIds?.includes(value._id.toString()) &&
        !processedIds.has(value._id.toString())
      ) {
        processedIds.add(value._id.toString());
        return {
          ...value,
          name: "Anonymous",
        };
      } else if (!processedIds.has(value._id.toString())) {
        processedIds.add(value._id.toString());
        return value;
      }
    });
  } else if (anonymousAuthors?.includes(valueToParse)) {
    return "Anonymous";
  }
  return valueToParse;
};

/**
 * The purpose of this function is to extract csv field values from the raw
 * data, pass them to the parser, and return in a format that can be
 * used to generate a csv (i.e. a string)
 */
export const getCSVFieldValue = (
  element: Record<string, unknown>,
  selectedColumn: string,
  settings: CSVCompanySettings,
  userPermissions: ReportAnalyticsRbacPermissions[]
): string => {
  let valueToParse;
  const [columnType, columnIdentifier] = splitNameByDelimiter(
    selectedColumn,
    COLUMN_NAME_DELIMITER
  );
  let anonymousAuthors: any[] | null;
  switch (columnType) {
    case "reviewcycle":
      if (columnIdentifier === "template") {
        valueToParse = get(["template", "name"], element.review_cycle, null);
      } else {
        valueToParse = get([columnIdentifier], element.review_cycle, null);
      }

      break;
    case "employee":
      if (columnIdentifier === "Group") {
        valueToParse = get(["Group", "name"], element.subject, null);
      } else if (columnIdentifier === "Manager's Email") {
        valueToParse = get(["Manager", "email"], element.subject, null);
      } else if (
        columnIdentifier === "Termination Date" ||
        columnIdentifier === "Hire Date"
      ) {
        valueToParse = get([columnIdentifier], element.subject, null);
        if (valueToParse && typeof valueToParse === "string") {
          const date = new Date(valueToParse);
          valueToParse = date;
        }
      } else {
        valueToParse = get([columnIdentifier], element.subject, null);
      }
      break;
    case "review":
      if (columnIdentifier === "forms_awaiting_approval") {
        // This requires some special processing (we want the count but
        // the pipeline returns the array of items)
        const arrayOfForms = get<unknown[], unknown[]>(
          ["forms_awaiting_approval"],
          element.review,
          []
        );
        valueToParse = arrayOfForms.length;
      } else {
        valueToParse = get([columnIdentifier], element.review, null);
      }

      break;
    case "reviewform":
      if (
        columnIdentifier === "authors" &&
        !userPermissions.includes(ReportAnalyticsRbacPermissions.createReport)
      ) {
        valueToParse = get([columnIdentifier], element.review_report, null);
        if (get(["redact_authors"], element.review_report, false)) {
          valueToParse = "Anonymous";
        }
        break;
      } else if (
        columnIdentifier === "participants" &&
        !userPermissions.includes(ReportAnalyticsRbacPermissions.createReport)
      ) {
        valueToParse = get([columnIdentifier], element.review_report, null);

        // handle redacted authors in participants field
        if (get(["redact_authors"], element.review_report, false)) {
          anonymousAuthors = get("authors", element.review_report, null);
          if (anonymousAuthors && anonymousAuthors?.length > 0) {
            valueToParse = handleAnonymousAuthorParticipants(
              valueToParse,
              anonymousAuthors
            );
          }
        }
      } else if (
        [
          "status",
          "authors_due_date",
          "signers_due_date",
          "completed_date",
          "authors",
          "signers",
          "signing_completed_at",
          "authoring_completed_at",
          "participants",
          "form_comment",
        ].includes(columnIdentifier)
      ) {
        // these fields are of "reviewform" type but actually appear
        // in the review_report object in the data.
        valueToParse = get([columnIdentifier], element.review_report, null);
        if (
          columnIdentifier === "participants" &&
          Array.isArray(valueToParse)
        ) {
          valueToParse = valueToParse?.filter(
            (participantObject, index, participants) =>
              index ===
              participants.findIndex(
                (participant) =>
                  participant._id.toString() ===
                  participantObject._id.toString()
              )
          );
        }
      } else if (
        ["author_completion", "signer_completion"].includes(columnIdentifier)
      ) {
        const completionValue = get(
          [columnIdentifier],
          element.review_report,
          null
        );
        valueToParse = completionValue ? `${completionValue}%` : null;
      } else {
        valueToParse = get([columnIdentifier], element.review_form, null);
      }
      break;
    case "goalreport":
      valueToParse = getGoalReportCSVValue(columnIdentifier, element);
      break;
    default:
      valueToParse = null;
      break;
  }
  let value = parseValueForCSV(valueToParse, settings);

  if (value === "Anonymous;Anonymous") {
    value = "Anonymous";
  }

  return value;
};

export const addSuffixToValue = (value: string, suffix: string): string => {
  if (value === "") {
    return value;
  }
  // if value is more than one, make suffix plural
  if (parseInt(value) > 1) {
    suffix = suffix + "s";
  }
  return `${value} ${suffix}`;
};

export const getSummaryCSVFieldValue = (
  element: Record<string, unknown>,
  selectedColumn: string,
  addSuffix = "",
  settings: CSVCompanySettings,
  userPermissions: ReportAnalyticsRbacPermissions[]
): string => {
  let valueToParse;
  const [columnType, columnIdentifier] = splitNameByDelimiter(
    selectedColumn,
    COLUMN_NAME_DELIMITER
  );

  switch (columnType) {
    case "reviewcycle":
      valueToParse = get([columnIdentifier], element.review_cycle, null);
      break;
    case "employee":
      valueToParse = get([columnIdentifier], element.subject, null);
      break;
    case "review":
      valueToParse = get([columnIdentifier], element.review, null);
      break;
    case "reviewform":
      if (
        columnIdentifier === "authors" &&
        !userPermissions.includes(ReportAnalyticsRbacPermissions.createReport)
      ) {
        valueToParse = get([columnIdentifier], element.review_report, null);
        if (get(["redact_authors"], element.review_report, false)) {
          valueToParse = "Anonymous";
        }
        break;
      }
      if (
        [
          "status",
          "authors_due_date",
          "signers_due_date",
          "completed_date",
          "authors",
          "signers",
        ].includes(columnIdentifier)
      ) {
        // these fields are of "reviewform" type but actually appear
        // in the review_report object in the data.
        valueToParse = get([columnIdentifier], element.review_report, null);
      } else {
        valueToParse = get([columnIdentifier], element.review_form, null);
      }
      break;
    case "goalreport":
      valueToParse = getGoalReportSummaryCSVValue(columnIdentifier, element);
      break;
    default:
      valueToParse = null;
      break;
  }
  let value = parseValueForCSV(valueToParse, settings);

  if (value === "Anonymous;Anonymous") {
    value = "Anonymous";
  }

  if (addSuffix !== "") {
    return addSuffixToValue(value, addSuffix);
  }
  return value;
};

/**
 * given the summarizeBy input data, this function will return an object
 * that contains all the necessary data to display the summarizeBy columns
 */
export const getSummarizedByColumns = (
  summaryItems: Record<string, Record<string, Record<string, unknown>>>,
  data: IAnalyticsCSVData
): Record<string, unknown> => {
  const columnData = {} as Record<string, unknown>;
  Object.keys(summaryItems).map((fieldType) => {
    Object.keys(summaryItems[fieldType]).map((item) => {
      let displayName = "";

      // for grouped question columns, we will need to do a lookup for the question name
      if (fieldType === "GROUPED_QUESTION") {
        displayName = getGroupedQuestionDisplayName(
          data.groupedQuestions,
          item
        );
      } else {
        displayName = selectSummarizeByColumnDisplayName(fieldType, item);
      }
      columnData[displayName] = parseSummarizeByRowElement(
        summaryItems[fieldType][item]
      );
    });
  });

  return columnData;
};
