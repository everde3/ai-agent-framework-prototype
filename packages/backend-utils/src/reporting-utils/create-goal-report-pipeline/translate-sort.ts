import { Db, ObjectId } from "mongodb";

import { GoalReportSort, GoalReportSummarizeByInput } from "@repo/models";

import { createOrderedSortStage } from "../create-review-report-pipeline";

const generateSortPath = (
  sort: GoalReportSort,
  isSummaryView: boolean
): string => {
  const appendName = isSummaryView ? "" : ".name";
  const fieldPath = sort.fieldPath.join(".");

  if (sort.type === "GOAL_FIELD") {
    const [fieldPathEntry, fieldName] = sort.fieldPath;

    switch (fieldPathEntry) {
      case "assignee":
      case "alignment":
        return fieldName
          ? `${fieldPathEntry}.${fieldName}${appendName}`
          : `${fieldPathEntry}${appendName}`;
      case "categories":
      case "outlook":
        return `${fieldPathEntry}${appendName}`;
      case "summarizeBy": {
        if (sort.fieldPath.length > 2) {
          const [summaryFieldPathEntry, group, summaryFieldName] =
            sort.fieldPath;
          if (summaryFieldName === "end_date") {
            return `${summaryFieldPathEntry}.${group}.${summaryFieldName}._id`;
          }
        }
        return fieldPath;
      }
      default:
        return fieldPath;
    }
  }

  if (sort.type === "EMPLOYEE_FIELD") {
    if (sort.name === "Manager") return `assignee.manager${appendName}`;
    if (sort.name === "Group") return `assignee.group${appendName}`;
    if (sort.fieldPath.length > 2) {
      const [summaryFieldPathEntry, group, summaryFieldName] = sort.fieldPath;
      if (summaryFieldPathEntry === "summarizeBy") {
        if (summaryFieldName === "hire_date") {
          return `${summaryFieldPathEntry}.${group}.${summaryFieldName}._id`;
        }
      }
    }
    return fieldPath;
  }

  return fieldPath;
};

export const translateGoalReportSorts = (
  sorts: GoalReportSort[] | null,
  isSummaryView: boolean
): Record<string, 1 | -1> => {
  if (sorts === null || sorts.length === 0) {
    return {
      _id: -1,
    };
  }

  if (sorts?.length) {
    const translatedSorts: { name: string; direction: 1 | -1 }[] = sorts.map(
      (sort) => {
        const fieldPath = generateSortPath(sort, isSummaryView);
        return {
          name: fieldPath,
          direction: sort.direction.toLowerCase() === "asc" ? 1 : -1,
        };
      }
    );

    return createOrderedSortStage(translatedSorts);
  }
  return {};
};

const goalFieldsThatRequireChecking = ["categories"];
/**
 * If we have more than one sort, we need to confirm none of them
 * are array fields, because mongodb
 * does not support parallel array fields as sort keys.
 * @param sorts sorts to validate
 * @returns true if sorts are valid
 */
export const validateGoalReportSorts = async (
  db: Db,
  company_id: ObjectId,
  sorts: GoalReportSort[] | null
): Promise<boolean> => {
  if (sorts === null || sorts.length <= 1) {
    return true;
  }

  // count the number of sorts that are goal type array fields
  const goalFieldCount = sorts.filter(
    (sort) =>
      sort.type === "GOAL_FIELD" &&
      goalFieldsThatRequireChecking.includes(sort.fieldPath[0])
  ).length;

  const hasEmployeeField = sorts.some((sort) => sort.type === "EMPLOYEE_FIELD");

  let customFieldPeopleFieldCount = 0;

  if (hasEmployeeField) {
    // Filter out built-in employee fields (Manager, Group) and only consider custom fields
    const customFieldNames = sorts
      .filter(
        (sort) =>
          sort.type === "EMPLOYEE_FIELD" &&
          !["Manager", "Group"].includes(sort.name) &&
          sort.name // Ensure we have a name
      )
      .map((sort) => sort.name);

    if (customFieldNames.length + goalFieldCount <= 1) {
      return true;
    }

    customFieldPeopleFieldCount = await db.collection("custom_fields").count({
      name: { $in: customFieldNames },
      company_id,
      type: "people",
    });
  }

  return customFieldPeopleFieldCount + goalFieldCount <= 1;
};
