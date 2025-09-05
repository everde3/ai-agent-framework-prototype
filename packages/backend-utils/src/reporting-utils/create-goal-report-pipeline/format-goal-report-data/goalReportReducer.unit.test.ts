import { AggregationCursor } from "mongodb";
import { describe, it, expect } from "vitest";
import { SummaryFunction } from "@repo/models";
import { ReportAnalyticsRbacPermissions } from "../../format-review-report-data";
import {
  goalReportingSummaryViewReducer,
  goalReportingDetailedViewReducer,
} from "./reducer";

// Mock data
const mockSettings = {
  decimalPlaces: 2,
};

const mockUserPermissions = [ReportAnalyticsRbacPermissions.createReport];

const mockGoalData = [
  {
    assignee: {
      name: "John Doe",
      email: "john@example.com",
      manager: { email: "manager@example.com" },
    },
    name: "Goal 1",
    status: "active",
  },
  {
    assignee: {
      name: "Jane Smith",
      email: "jane@example.com",
      manager: { email: "manager@example.com" },
    },
    name: "Goal 2",
    status: "done",
  },
];

// Helper to create a mock cursor
const createMockCursor = (data: any[]) => {
  let index = 0;
  return {
    hasNext: async () => index < data.length,
    next: async () => data[index++],
  } as unknown as AggregationCursor<any[]>;
};

describe("Goal Report Reducers", () => {
  describe("goalReportingSummaryViewReducer", () => {
    it("should correctly reduce summary view data", async () => {
      const mockColumnMetadata = {
        goal_name: {
          // Changed from "name" to match the column identifier
          isColumnVisible: true,
          currentlySelectedSummaryFunction: SummaryFunction.Count,
          availableSummaryFunctions: [
            SummaryFunction.Count,
            SummaryFunction.MissingSummaryFunction,
          ],
        },
      };

      const selectedColumns = ["goalreport_goal_name"];
      const data = {
        reportData: createMockCursor([
          {
            name: "Goal 1",
            count: 1,
          },
        ]),
      };

      const result = await goalReportingSummaryViewReducer(
        mockColumnMetadata,
        selectedColumns,
        [],
        data,
        mockSettings,
        mockUserPermissions
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("Count of Name");
    });

    it("should handle empty data with columns", async () => {
      const mockColumnMetadata = {
        goal_name: {
          isColumnVisible: true,
          currentlySelectedSummaryFunction: SummaryFunction.Count,
          availableSummaryFunctions: [
            SummaryFunction.Count,
            SummaryFunction.MissingSummaryFunction,
          ],
        },
      };
      const selectedColumns = ["goalreport_goal_name"];
      const data = {
        reportData: createMockCursor([]),
      };

      const result = await goalReportingSummaryViewReducer(
        mockColumnMetadata,
        selectedColumns,
        [],
        data,
        mockSettings,
        mockUserPermissions
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("Count of Name", "");
    });

    it("should handle data with summarizeBy fields", async () => {
      const mockColumnMetadata = {
        goal_name: {
          isColumnVisible: true,
          currentlySelectedSummaryFunction: SummaryFunction.Count,
          availableSummaryFunctions: [
            SummaryFunction.Count,
            SummaryFunction.MissingSummaryFunction,
          ],
        },
      };

      const mockDataWithSummarize = [
        {
          summarizeBy: {
            EMPLOYEE_FIELD: {
              someId: { count: 5 },
            },
          },
          name: "Goal 1",
          count: 1,
        },
      ];

      const selectedColumns = ["goalreport_goal_name"];
      const data = {
        reportData: createMockCursor(mockDataWithSummarize),
      };

      const result = await goalReportingSummaryViewReducer(
        mockColumnMetadata,
        selectedColumns,
        ["employee_someId"],
        data,
        mockSettings,
        mockUserPermissions
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("Count of Name");
    });
  });

  describe("goalReportingDetailedViewReducer", () => {
    it("should correctly reduce detailed view data", async () => {
      const selectedColumns = [
        "goalreport_employee_name",
        "goalreport_goal_name",
      ];
      const data = {
        reportData: createMockCursor(mockGoalData),
      };

      const result = await goalReportingDetailedViewReducer(
        selectedColumns,
        data,
        mockSettings,
        mockUserPermissions
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("Assignee - Full Name");
      expect(result[0]).toHaveProperty("Name");
    });

    it("should handle empty data with columns", async () => {
      const selectedColumns = ["goalreport_employee_name"];
      const data = {
        reportData: createMockCursor([]),
      };

      const result = await goalReportingDetailedViewReducer(
        selectedColumns,
        data,
        mockSettings,
        mockUserPermissions
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("Assignee - Full Name", "");
    });
  });
});
