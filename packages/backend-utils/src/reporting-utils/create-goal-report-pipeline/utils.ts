import { get } from "@repo/utils-isomorphic";

import {
  COLUMN_NAME_DELIMITER,
  splitNameByDelimiter,
} from "../format-review-report-data";
import { ColumnsConfig } from "../format-review-report-data/ColumnsConfig";

export const getGoalReportCSVValue = (
  columnIdentifier: string,
  element: Record<string, unknown>
) => {
  let valueToParse: null | Date | string = null;
  const [goalReportColumnType, goalReportColumnIdentifier] =
    splitNameByDelimiter(columnIdentifier, COLUMN_NAME_DELIMITER);
  if (goalReportColumnType === "employee") {
    if (goalReportColumnIdentifier === "name") {
      valueToParse = get(["name"], element.assignee, null);
    } else if (goalReportColumnIdentifier === "Group") {
      valueToParse = get(["group", "name"], element.assignee, null);
    } else if (goalReportColumnIdentifier === "manager_email") {
      valueToParse = get(["manager", "email"], element.assignee, null);
    } else if (
      goalReportColumnIdentifier === "Termination Date" ||
      goalReportColumnIdentifier === "Hire Date"
    ) {
      valueToParse = get(
        ["custom_values", goalReportColumnIdentifier],
        element.assignee,
        null
      );
      if (valueToParse && typeof valueToParse === "string") {
        const date = new Date(valueToParse);
        valueToParse = date;
      }
    } else {
      valueToParse = get(
        ["custom_values", goalReportColumnIdentifier],
        element.assignee,
        null
      );
    }
  } else if (goalReportColumnType === "goal") {
    if (goalReportColumnIdentifier === "assignee_group") {
      valueToParse = get(["group", "name"], element.assignee, null);
    } else if (goalReportColumnIdentifier === "alignment_assignee") {
      valueToParse = get(["alignment", "assignee", "name"], element, null);
    } else if (goalReportColumnIdentifier === "last_status_update") {
      valueToParse = get(["last_goal_status_update"], element, null);
    } else if (goalReportColumnIdentifier === "due_date") {
      valueToParse = get(["end_date"], element, null);
    } else if (goalReportColumnIdentifier === "alignment") {
      const goalStatusMap = {
        done: "Completed",
        active: "Active",
        archived: "Archived",
      };
      const status: keyof typeof goalStatusMap | null = get(
        ["status"],
        element,
        null
      );
      const alignmentName = get(["alignment", "name"], element, null);
      if (status && alignmentName) {
        valueToParse = `(${goalStatusMap[status]}) ${alignmentName}`;
      } else {
        valueToParse = null;
      }
    } else {
      valueToParse = get([goalReportColumnIdentifier], element, null);
    }
  } else {
    valueToParse = null;
  }
  return valueToParse;
};

export const getGoalReportSummaryCSVValue = (
  columnIdentifier: string,
  element: Record<string, unknown>
) => {
  const [goalReportColumnType, goalReportColumnIdentifier] =
    splitNameByDelimiter(columnIdentifier, COLUMN_NAME_DELIMITER);
  let valueToParse: null | Date | string = null;
  if (goalReportColumnType === "employee") {
    if (goalReportColumnIdentifier === "name") {
      valueToParse = get(["name"], element.assignee, null);
    } else if (goalReportColumnIdentifier === "Group") {
      valueToParse = get(["group", "name"], element.assignee, null);
    } else if (goalReportColumnIdentifier === "manager_email") {
      valueToParse = get(["manager", "email"], element.assignee, null);
    } else {
      valueToParse = get(
        ["custom_values", goalReportColumnIdentifier],
        element.assignee,
        null
      );
    }
  } else if (goalReportColumnType === "goal") {
    if (goalReportColumnIdentifier === "assignee_group") {
      valueToParse = get(["group", "name"], element.assignee, null);
    } else if (goalReportColumnIdentifier === "alignment_assignee") {
      valueToParse = get(["alignment", "assignee", "name"], element, null);
    } else if (goalReportColumnIdentifier === "last_status_update") {
      valueToParse = get(["last_goal_status_update"], element, null);
    } else if (goalReportColumnIdentifier === "due_date") {
      valueToParse = get(["end_date"], element, null);
    } else {
      valueToParse = get([goalReportColumnIdentifier], element, null);
    }
  } else {
    valueToParse = null;
  }
  return valueToParse;
};

export const getGoalReportDisplayColumn = (
  column: string,
  delimiter: "_"
): string => {
  const [domain, columnIdentifier] = splitNameByDelimiter(column, delimiter);
  if (domain === "employee") {
    if (columnIdentifier === "name") {
      return "Assignee - Full Name";
    } else if (columnIdentifier === "manager_email") {
      return "Assignee - Manager's Email";
    }
    return `Assignee - ${columnIdentifier}`;
  } else if (domain === "goal") {
    return get<string, string>(
      ["goalFields", columnIdentifier, "headerName"],
      ColumnsConfig,
      columnIdentifier
    );
  }
  return columnIdentifier;
};
