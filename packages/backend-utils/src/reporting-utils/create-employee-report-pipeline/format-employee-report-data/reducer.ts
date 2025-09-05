import { AggregationCursor } from "mongodb";

import {
  IReportingEmployeeReportDocument,
  ISummaryColumnMetadata,
  SummaryFunction,
} from "@repo/models";

import {
  ReportAnalyticsRbacPermissions,
  getCSVFieldValue,
  getColumnDisplayName,
  getSummaryCSVFieldValue,
  getSummaryColumnDisplayName,
  parseSummarizeByRowElement,
  selectSummarizeByColumnDisplayName,
} from "../../format-review-report-data";

export interface EmployeeCSVCompanySettings {
  decimalPlaces: number;
}

export interface IEmployeeReportCSVData {
  reportData: AggregationCursor<IReportingEmployeeReportDocument[]>;
}

export const EmployeeGetSummarizedByColumns = (
  summaryItems: Record<string, Record<string, Record<string, unknown>>>,
  data: IEmployeeReportCSVData
): Record<string, unknown> => {
  const columnData = {} as Record<string, unknown>;
  Object.keys(summaryItems).map((fieldType) => {
    Object.keys(summaryItems[fieldType]).map((item) => {
      const displayName = selectSummarizeByColumnDisplayName(fieldType, item);
      columnData[displayName] = parseSummarizeByRowElement(
        summaryItems[fieldType][item]
      );
    });
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
  settings: EmployeeCSVCompanySettings,
  data: IEmployeeReportCSVData,
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
      const summarizedByColumns = EmployeeGetSummarizedByColumns(
        summaryItems,
        data
      );
      currentRow = { ...currentRow, ...summarizedByColumns };
    }
  }

  selectedColumns.forEach((column) => {
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
        ? "employee"
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
export const employeeReportingSummaryViewReducer = async (
  allSummaryColumnMetadata: Record<string, ISummaryColumnMetadata>,
  selectedColumns: string[],
  data: IEmployeeReportCSVData,
  settings: EmployeeCSVCompanySettings,
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

const employeeSetData = (
  selectedColumns: string[],
  data: IEmployeeReportCSVData,
  dataElement: any,
  settings: EmployeeCSVCompanySettings,
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
export const employeeReportingDetailedViewReducer = async (
  selectedColumns: string[],
  data: IEmployeeReportCSVData,
  settings: EmployeeCSVCompanySettings,
  userPermissions: ReportAnalyticsRbacPermissions[]
): Promise<Record<string, unknown>[]> => {
  const reducedData: Record<string, unknown>[] = [];

  while (await data.reportData.hasNext()) {
    const dataElement = (await data.reportData.next()) as unknown as Record<
      string,
      unknown
    >;
    const rowData = employeeSetData(
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
    const emptyRow = employeeSetData(
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
