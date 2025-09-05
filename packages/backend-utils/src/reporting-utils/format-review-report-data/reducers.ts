import type { AggregationCursor } from "mongodb";

import {
  type IReportingQuestionGroupingSessionDocument,
  type IReportingReviewQuestionDocument,
  type IReportingReviewReportDocument,
  type ISummaryColumnMetadata,
  SummaryFunction,
} from "@repo/models";

import {
  COLUMN_NAME_DELIMITER,
  getCSVFieldValue,
  getColumnDisplayName,
  getGroupedQuestionAnswer,
  getGroupedQuestionDisplayName,
  getGroupedQuestionSummaryDisplayName,
  getSingleQuestionAnswer,
  getSingleQuestionDisplayName,
  getSingleQuestionSummaryDisplayName,
  getSummarizedByColumns,
  getSummaryCSVFieldValue,
  getSummaryColumnDisplayName,
  splitNameByDelimiter,
} from "./utils";

export interface IAnalyticsCSVData {
  reportData: AggregationCursor<IReportingReviewReportDocument[]>;
  questionData?: IReportingReviewQuestionDocument[];
  groupedQuestions?: IReportingQuestionGroupingSessionDocument[];
}

export interface CSVCompanySettings {
  decimalPlaces: number;
}

export enum ReportAnalyticsRbacPermissions {
  createReport = "report_analytics:createReport",
  createGoalReport = "report_analytics:createGoalReport",
  viewReportsListSharedWithManagers = "report_analytics:viewReportsListSharedWithManagers",
  viewReportSharedWithManagers = "report_analytics:viewReportSharedWithManagers",
  createEmployeeReport = "report_analytics:createEmployeeReport",
  viewReportsListSharedWithContributors = "report_analytics:viewReportsListSharedWithContributors",
  viewReportSharedWithContributors = "report_analytics:viewReportSharedWithContributors",
  viewGoalReportSharedWithManagers = "report_analytics:viewGoalReportSharedWithManagers",
  viewGoalReportSharedWithContributors = "report_analytics:viewGoalReportSharedWithContributors",
  viewEmployeeReportSharedWithManagers = "report_analytics:viewEmployeeReportSharedWithManagers",
  viewEmployeeReportSharedWithContributors = "report_analytics:viewEmployeeReportSharedWithContributors",
}

const DEFAULT_SUMMARY_COLUMN_METADATA = {
  isColumnVisible: true,
  currentlySelectedSummaryFunction: SummaryFunction.MissingSummaryFunction,
  availableSummaryFunctions: [SummaryFunction.MissingSummaryFunction],
};
/**
 * The reducers here are used to convert the incoming data and metadata into
 * an an array of objects.
 *
 * Each element of the array is a csv "row".
 * Within each element, each key is a column name and the value is the cell
 * value of that column/row.
 *
 * The logic is similar for both the summary and detailed view reducers. They
 * were split into separate function because their logic may diverge further
 * in the future.
 */

const setSummaryData = (
  selectedColumns: string[],
  dataElement: any,
  settings: CSVCompanySettings,
  data: IAnalyticsCSVData,
  allSummaryColumnMetadata: Record<string, ISummaryColumnMetadata>,
  userPermissions: ReportAnalyticsRbacPermissions[]
): Record<string, unknown> => {
  let currentRow = {} as Record<string, unknown>;
  if (dataElement !== null) {
    if (Object.keys(dataElement).includes("summarizeBy")) {
      // get the summarized by columns. These always come first.
      const summaryItems = dataElement.summarizeBy as Record<
        string,
        Record<string, Record<string, unknown>>
      >;
      const summarizedByColumns = getSummarizedByColumns(summaryItems, data);
      currentRow = { ...currentRow, ...summarizedByColumns };
    }
  }

  selectedColumns.forEach((column) => {
    const [domain, columnName] = splitNameByDelimiter(
      column,
      COLUMN_NAME_DELIMITER
    );
    let selectedColumnSummaryOptions = allSummaryColumnMetadata[column];
    if (!selectedColumnSummaryOptions) {
      selectedColumnSummaryOptions = DEFAULT_SUMMARY_COLUMN_METADATA;
    }

    if (dataElement !== null && !selectedColumnSummaryOptions.isColumnVisible) {
      return;
    }

    const addSuffix =
      selectedColumnSummaryOptions.currentlySelectedSummaryFunction ===
      SummaryFunction.Count
        ? "form"
        : "";

    if (domain === "question") {
      // ID for the question will be question_<questionHash>_<questionName>
      const questionName = getSingleQuestionSummaryDisplayName(
        data.questionData,
        selectedColumnSummaryOptions,
        columnName
      );

      currentRow[column + "_" + questionName] =
        dataElement === null
          ? ""
          : getSingleQuestionAnswer(
              dataElement,
              columnName,
              addSuffix,
              settings,
              true
            );
    } else if (domain === "groupedquestion") {
      currentRow[
        getGroupedQuestionSummaryDisplayName(
          data.groupedQuestions,
          selectedColumnSummaryOptions,
          columnName
        )
      ] =
        dataElement === null
          ? ""
          : getGroupedQuestionAnswer(
              dataElement,
              columnName,
              addSuffix,
              settings,
              true
            );
    } else {
      currentRow[
        getSummaryColumnDisplayName(selectedColumnSummaryOptions, column)
      ] =
        dataElement === null
          ? ""
          : getSummaryCSVFieldValue(
              dataElement,
              column,
              addSuffix,
              settings,
              userPermissions
            );
    }
  });

  return currentRow;
};

// reduce summary view data into an array of objects for each column
export const reportingSummaryViewReducer = async (
  allSummaryColumnMetadata: Record<string, ISummaryColumnMetadata>,
  selectedColumns: string[],
  data: IAnalyticsCSVData,
  settings: CSVCompanySettings,
  userPermissions: ReportAnalyticsRbacPermissions[]
): Promise<Record<string, unknown>[]> => {
  const reducedData = [] as Record<string, unknown>[];

  while (await data.reportData.hasNext()) {
    const dataElement = (await data.reportData.next()) as unknown as Record<
      string,
      unknown
    >;
    const rowData = setSummaryData(
      selectedColumns,
      dataElement,
      settings,
      data,
      allSummaryColumnMetadata,
      userPermissions
    );
    reducedData.push(rowData);
  }

  // if no rowData, we just need to set the column headers
  if (selectedColumns.length > 0 && reducedData.length === 0) {
    const emptyRow = setSummaryData(
      selectedColumns,
      null,
      settings,
      data,
      allSummaryColumnMetadata,
      userPermissions
    );
    reducedData.push(emptyRow);
  }

  return reducedData;
};

const setData = (
  selectedColumns: string[],
  data: IAnalyticsCSVData,
  dataElement: any,
  settings: CSVCompanySettings,
  userPermissions: ReportAnalyticsRbacPermissions[]
): Record<string, unknown> => {
  const currentRow = {} as Record<string, unknown>;

  selectedColumns.forEach((column) => {
    const [domain, columnName] = splitNameByDelimiter(
      column,
      COLUMN_NAME_DELIMITER
    );
    if (domain === "question") {
      // ID for the question will be question_<questionHash>_<questionName>
      const questionName = getSingleQuestionDisplayName(
        data.questionData,
        columnName
      );
      currentRow[column + "_" + questionName] =
        dataElement === null
          ? ""
          : getSingleQuestionAnswer(
              dataElement,
              columnName,
              "",
              settings,
              false
            );
    } else if (domain === "groupedquestion") {
      currentRow[
        getGroupedQuestionDisplayName(data.groupedQuestions, columnName)
      ] =
        dataElement === null
          ? ""
          : getGroupedQuestionAnswer(
              dataElement,
              columnName,
              "",
              settings,
              false
            );
    } else {
      currentRow[getColumnDisplayName(column)] =
        dataElement === null
          ? ""
          : getCSVFieldValue(dataElement, column, settings, userPermissions);
    }
  });

  return currentRow;
};

// reduce detailed view data into an array of objects for each column
export const reportingDetailedViewReducer = async (
  selectedColumns: string[],
  data: IAnalyticsCSVData,
  settings: CSVCompanySettings,
  userPermissions: ReportAnalyticsRbacPermissions[]
): Promise<Record<string, unknown>[]> => {
  const reducedData: Record<string, unknown>[] = [];

  while (await data.reportData.hasNext()) {
    const dataElement = (await data.reportData.next()) as unknown as Record<
      string,
      unknown
    >;
    const rowData = setData(
      selectedColumns,
      data,
      dataElement,
      settings,
      userPermissions
    );
    reducedData.push(rowData);
  }

  // if no rowData, we just need to set the column headers
  if (selectedColumns.length > 0 && reducedData.length === 0) {
    const emptyRow = setData(
      selectedColumns,
      data,
      null,
      settings,
      userPermissions
    );
    reducedData.push(emptyRow);
  }

  return reducedData;
};
