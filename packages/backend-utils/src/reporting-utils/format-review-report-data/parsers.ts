import { format } from "date-fns";

import { type ISummaryColumnMetadata, SummarizeByRowTypes } from "@repo/models";
import {
  type NamedReference,
  type SummarizeByReference,
  type UserReference,
  isArray,
  isNamedReference,
  isSummarizeByReference,
  isUserReference,
} from "@repo/utils-isomorphic";

import { COLUMN_NAME_DELIMITER, splitNameByDelimiter } from "./utils";

import type { CSVCompanySettings } from "./reducers";

const OUTPUT_ARRAY_SEPARATOR = ";";
const DATE_FORMAT = "yyyy/MM/dd";
const NULL_RETURN_VALUE = "";

export const parseArrayElementForCSV = (
  item: unknown[],
  settings: CSVCompanySettings
): string => {
  const parsedItems = item.map((element) =>
    parseValueForCSV(element, settings)
  );
  return parsedItems.join(OUTPUT_ARRAY_SEPARATOR);
};

export const parseDateElementForCSV = (item: Date): string => {
  return format(item, DATE_FORMAT);
};

export const parseNullElementForCSV = (): string => {
  return NULL_RETURN_VALUE;
};

export const parseBooleanElementForCSV = (item: boolean): string => {
  return item ? "True" : "False";
};

export const parseNumberElementForCSV = (
  item: number,
  decimalPlaces: number
): string => {
  // apply company decimal places setting
  const formattedValue = parseFloat(item.toFixed(decimalPlaces));
  return formattedValue.toString();
};

export const parseUserReferenceForCSV = (item: UserReference): string => {
  if (item.name) {
    return item.name;
  } else if (item.email) {
    return item.email;
  } else if (item._id) {
    return "repo User";
  } else {
    return "repo User";
  }
};

export const parseNamedReferenceForCSV = (item: NamedReference): string => {
  if (item.name) {
    return item.name;
  } else if (item._id) {
    return item._id.toString();
  } else {
    return "";
  }
};

export const parseValueForCSV = (
  item: unknown,
  settings: CSVCompanySettings
): string => {
  if (isUserReference(item)) {
    return parseUserReferenceForCSV(item);
  } else if (typeof item === "string") {
    return item;
  } else if (isArray(item)) {
    return parseArrayElementForCSV(item, settings);
  } else if (item instanceof Date) {
    return parseDateElementForCSV(item);
  } else if (item === null) {
    return parseNullElementForCSV();
  } else if (typeof item === "boolean") {
    return parseBooleanElementForCSV(item);
  } else if (typeof item === "number") {
    return parseNumberElementForCSV(item, settings.decimalPlaces);
  } else if (isNamedReference(item)) {
    return parseNamedReferenceForCSV(item);
  } else {
    return "";
  }
};

/**
 * select the value of for a "summarize by" row.
 * E.g. if we are summarizing by manager, this will be the manager's name.
 */

export const selectSummarizeByValue = (value: SummarizeByReference): string => {
  if (value.name) {
    return value.name;
  } else {
    return "";
  }
};

/**
 *  From the summarize by type and name, select the column names for a
 * "summarize by" columns.
 * E.g. if we are summarizing by review cycle name, the inputs will be
 * "REVIEW_CYCLE_FIELD" and "name". The output will be "Review Cycle Name".
 */

export const selectSummarizeByColumnDisplayName = (
  type: string,
  summaryColumnName: string
): string => {
  switch (type) {
    case SummarizeByRowTypes.GOAL:
      if (summaryColumnName === "assignee") {
        return "Assignee";
      }
      if (summaryColumnName === "end_date") {
        return "Due Date";
      }
      if (summaryColumnName === "status") {
        return "Status";
      }
    case SummarizeByRowTypes.EMPLOYEE:
      if (summaryColumnName === "manager") {
        return "Manager";
      }
      if (summaryColumnName === "group") {
        return "Group";
      }
      if (summaryColumnName === "hire_date") {
        return "Hire Date";
      }
      if (summaryColumnName === "termination_date") {
        return "Termination Date";
      } else {
        return summaryColumnName;
      }
    case SummarizeByRowTypes.REVIEW_CYCLE:
      if (summaryColumnName === "name") {
        return "Review Cycle Name";
      }
      if (summaryColumnName === "status") {
        return "Review Cycle Status";
      }
      if (summaryColumnName === "start_date") {
        return "Review Cycle Start Date";
      } else {
        return summaryColumnName;
      }
    case SummarizeByRowTypes.REVIEW_FIELD:
      if (summaryColumnName === "name") {
        return "Review Name";
      }
      if (summaryColumnName === "status") {
        return "Review Status";
      }
      if (summaryColumnName === "subject") {
        return "Review Subject";
      }
      if (summaryColumnName === "start_date") {
        return "Review Start Date";
      }
      if (summaryColumnName === "completed_date") {
        return "Review Completed Date";
      } else {
        return summaryColumnName;
      }
    case SummarizeByRowTypes.REVIEW_FORM_FIELD:
      if (summaryColumnName === "name") {
        return "Review Form Name";
      }
      if (summaryColumnName === "status") {
        return "Review Form Status";
      }
      if (summaryColumnName === "signers_due_date") {
        return "Review Form Signer Due Date";
      }
      if (summaryColumnName === "authors_due_date") {
        return "Review Form Author Due Date";
      }
      if (summaryColumnName === "completed_date") {
        return "Review Form Completed Date";
      } else {
        return summaryColumnName;
      }
    default:
      return summaryColumnName;
  }
};

/**
 * takes in a potential summarize by item and returns the parsed value
 */
export const parseSummarizeByRowElement = (item: {
  [key: string]: unknown;
}): string => {
  try {
    if (isSummarizeByReference(item)) {
      const parsedValue = selectSummarizeByValue(item);
      return parsedValue;
    }
    return "";
  } catch (e) {
    return "";
  }
};

/**
 * using the array of aggregation operations and a question "name", which is
 * actually the stringified question id, selects which summary operation
 * that has been applied to this question.
 */
export const selectSingleQuestionSummaryOperation = (
  summaryColumnMetadata: ISummaryColumnMetadata
): string => {
  return summaryColumnMetadata.currentlySelectedSummaryFunction;
};

/**
 *
 * using the array of aggregation operations and a question "name", which is
 * actually the stringified question group id, selects which summary operation
 * that has been applied to this question group.
 */
export const selectGroupedQuestionSummaryOperation = (
  selectedColumnSummaryOptions: ISummaryColumnMetadata
): string => {
  return selectedColumnSummaryOptions.currentlySelectedSummaryFunction;
};

/**
 * using the array of aggregation operations and a column "name",
 * selects which summary operation that has been applied to this field.
 */
export const selectColumnSummaryOperation = (
  selectedColumnSummaryOptions: ISummaryColumnMetadata
): string => {
  return selectedColumnSummaryOptions.currentlySelectedSummaryFunction;
};

/**
 * The purpose of this function is to accept a list of selected columns, look
 * for the columns that refer to questions and return the hashes of those
 * questions.
 */
export const selectQuestionHashesFromColumns = (
  selectedColumns: string[]
): string[] => {
  const questionHashes = selectedColumns
    .filter((column) => {
      const [domain, columnName] = splitNameByDelimiter(
        column,
        COLUMN_NAME_DELIMITER
      );
      if (domain === "question") {
        return columnName;
      }
    })
    .map((questions) => {
      const [, columnName] = splitNameByDelimiter(
        questions,
        COLUMN_NAME_DELIMITER
      );
      return columnName;
    });

  return questionHashes;
};

/**
 * The purpose of this function is to accept a list of selected columns, look
 * for the columns that refer to grouped questions and return the Ids of those
 * grouped questions.
 */
export const selectQuestionGroupsFromColumns = (
  selectedColumns: string[]
): string[] => {
  const questionGroupIDs = selectedColumns
    .filter((column) => {
      const [domain, columnName] = splitNameByDelimiter(
        column,
        COLUMN_NAME_DELIMITER
      );
      if (domain === "groupedquestion") {
        return columnName;
      }
    })
    .map((questions) => {
      const [, columnName] = splitNameByDelimiter(
        questions,
        COLUMN_NAME_DELIMITER
      );
      return columnName;
    });

  return questionGroupIDs;
};
