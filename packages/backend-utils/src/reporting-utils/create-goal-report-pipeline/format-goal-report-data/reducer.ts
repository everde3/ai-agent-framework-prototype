import { AggregationCursor } from "mongodb";

import {
  IReportingGoalReportDocument,
  ISummaryColumnMetadata,
  SummaryFunction,
} from "@repo/models";

import {
  COLUMN_NAME_DELIMITER,
  ReportAnalyticsRbacPermissions,
  getCSVFieldValue,
  getColumnDisplayName,
  getSummaryCSVFieldValue,
  getSummaryColumnDisplayName,
  parseSummarizeByRowElement,
  selectSummarizeByColumnDisplayName,
  splitNameByDelimiter,
} from "../../format-review-report-data";

export interface GoalCSVCompanySettings {
  decimalPlaces: number;
}

export interface IGoalReportCSVData {
  reportData: AggregationCursor<IReportingGoalReportDocument[]>;
}

export const goalGetSummarizedByColumns = (
  summaryItems: Record<string, Record<string, Record<string, unknown>>>,
  summarizeByOrder: string[]
): Record<string, unknown> => {
  const typeMap = {
    goal: "GOAL_FIELD",
    employee: "EMPLOYEE_FIELD",
  };
  const columnData = {} as Record<string, unknown>;
  summarizeByOrder.forEach((summaryField) => {
    const [fieldCategory, item] = splitNameByDelimiter(
      summaryField,
      COLUMN_NAME_DELIMITER
    );
    const fieldType = typeMap[fieldCategory as keyof typeof typeMap];
    const displayName = selectSummarizeByColumnDisplayName(fieldType, item);
    columnData[displayName] = parseSummarizeByRowElement(
      summaryItems[fieldType][item]
    );
  });

  return columnData;
};

const DEFAULT_SUMMARY_COLUMN_METADATA = {
  isColumnVisible: true,
  currentlySelectedSummaryFunction: SummaryFunction.MissingSummaryFunction,
  availableSummaryFunctions: [SummaryFunction.MissingSummaryFunction],
};

const setSummaryData = (
  selectedColumns: string[],
  dataElement: any,
  settings: GoalCSVCompanySettings,
  allSummaryColumnMetadata: Record<string, ISummaryColumnMetadata>,
  summarizeByOrder: string[],
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
      const summarizedByColumns = goalGetSummarizedByColumns(
        summaryItems,
        summarizeByOrder
      );
      currentRow = { ...currentRow, ...summarizedByColumns };
    }
  }

  selectedColumns.forEach((column) => {
    const columnName = splitNameByDelimiter(column, COLUMN_NAME_DELIMITER)[1];
    let selectedColumnSummaryOptions = allSummaryColumnMetadata[columnName];
    if (!selectedColumnSummaryOptions) {
      selectedColumnSummaryOptions = DEFAULT_SUMMARY_COLUMN_METADATA;
    }

    if (dataElement !== null && !selectedColumnSummaryOptions.isColumnVisible) {
      return;
    }

    const addSuffix =
      selectedColumnSummaryOptions.currentlySelectedSummaryFunction ===
      SummaryFunction.Count
        ? "goal"
        : "";

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
  });

  return currentRow;
};

// reduce summary view data into an array of objects for each column
export const goalReportingSummaryViewReducer = async (
  allSummaryColumnMetadata: Record<string, ISummaryColumnMetadata>,
  selectedColumns: string[],
  summarizeByOrder: string[],
  data: IGoalReportCSVData,
  settings: GoalCSVCompanySettings,
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
      allSummaryColumnMetadata,
      summarizeByOrder,
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
      allSummaryColumnMetadata,
      summarizeByOrder,
      userPermissions
    );
    reducedData.push(emptyRow);
  }

  return reducedData;
};

const goalSetData = (
  selectedColumns: string[],
  data: IGoalReportCSVData,
  dataElement: any,
  settings: GoalCSVCompanySettings,
  userPermissions: ReportAnalyticsRbacPermissions[]
): Record<string, unknown> => {
  const currentRow = {} as Record<string, unknown>;

  selectedColumns.forEach((column) => {
    currentRow[getColumnDisplayName(column)] =
      dataElement === null
        ? ""
        : getCSVFieldValue(dataElement, column, settings, userPermissions);
  });

  return currentRow;
};

// reduce detailed view data into an array of objects for each column
export const goalReportingDetailedViewReducer = async (
  selectedColumns: string[],
  data: IGoalReportCSVData,
  settings: GoalCSVCompanySettings,
  userPermissions: ReportAnalyticsRbacPermissions[]
): Promise<Record<string, unknown>[]> => {
  const reducedData: Record<string, unknown>[] = [];

  while (await data.reportData.hasNext()) {
    const dataElement = (await data.reportData.next()) as unknown as Record<
      string,
      unknown
    >;
    const rowData = goalSetData(
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
    const emptyRow = goalSetData(
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
