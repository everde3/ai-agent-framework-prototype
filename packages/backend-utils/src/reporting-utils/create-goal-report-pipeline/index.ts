import { Db, MongoServerError, ObjectId } from "mongodb";

import {
  GetGoalReportProps,
  GoalReportSort,
  IFieldFilter,
  SummaryFunction,
} from "@repo/models";

import { maximumGoalReportPageSize } from "./types";

import { removeNullMatches } from "../create-review-report-pipeline/utils";
import { binningOptions } from "../create-review-report-pipeline/utils";

import {
  MatchStage,
  formatFilters,
  selectMatchOperation,
  translateSorts,
} from "../create-review-report-pipeline";
import { ReportAnalyticsRbacPermissions } from "../format-review-report-data";
import {
  createGroupByDateField,
  generateAllowedCustomFields,
  getBucketAggregation,
  getBucketBoundaries,
  getMinMaxForField,
} from "../shared-utils";
import { assigneeSummarizeByFieldPathMap, goalDateFields } from "./config";
import { translateGoalReportSorts } from "./translate-sort";

export const generateGoalReportMatches = (
  filters: IFieldFilter[][],
  allowedCustomFields: string[]
): [MatchStage[], MatchStage[]] => {
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
          if (["name", "primary_role", "_id"].includes(fieldValue)) {
            fieldPath = `assignee.${fieldValue}`;
          } else if (["group", "Group", "department"].includes(fieldValue)) {
            fieldPath = "assignee.group._id";
          } else if (fieldValue === "email") {
            fieldPath = "assignee.custom_values.email.normalized";
          } else if (["Manager", "manager"].includes(fieldValue)) {
            fieldPath = "assignee.custom_values.Manager._id";
          } else if (fieldValue === "Manager's Email") {
            fieldPath = "assignee.custom_values.Manager.email";
          } else if (fieldValue === "Activation Status") {
            fieldPath = `assignee.custom_values.${fieldValue}.0`;
          } else if (["people", "person"].includes(type)) {
            fieldPath = `assignee.custom_values.${fieldValue}._id`;
          } else {
            fieldPath = `assignee.custom_values.${fieldValue}`;
          }
          break;
        case "GOAL_FIELD":
          if (
            [
              "assignee",
              "outlook",
              "categories",
              "alignment",
              "alignment.assignee",
              "assignee.group",
            ].includes(fieldValue)
          ) {
            fieldPath = `${fieldValue}._id`;
          } else {
            fieldPath = fieldValue;
          }
          break;
        case "SUBJECT":
          if (fieldValue === "subject") {
            fieldPath = "assignee._id";
          } else if (allowedToQuery) {
            fieldPath = `assignee.custom_values.${fieldValue}`;
          }
          break;
        default:
          fieldPath = fieldValue;
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
        return { $or: formattedFilterGroups };
      } else {
        // handle and
        return formattedFilterGroups.length > 0
          ? formattedFilterGroups[0]
          : null;
      }
    })
    .filter(removeNullMatches);
  const initialMatches = matches.filter((match) => {
    let matchValue = Object.keys(match)[0];
    if (matchValue === "$or") {
      matchValue = Object.keys(match["$or"][0])[0];
    }
    return matchValue !== "current_progress";
  });
  const calculatedMatches = matches.filter((match) => {
    let matchValue = Object.keys(match)[0];
    if (matchValue === "$or") {
      matchValue = Object.keys(match["$or"][0])[0];
    }
    return matchValue === "current_progress";
  });
  return [initialMatches, calculatedMatches];
};

const getSecondarySelectionAggregation = (
  field: { _id: string; name: string },
  name: string,
  selection: string | number | null
) => {
  if (goalDateFields.includes(name)) {
    return createGroupByDateField(selection as string, field.name);
  }

  return `$${field.name}`;
};

const generateSummarizeBy = (type: string, name: string) => {
  if (type === "EMPLOYEE_FIELD") {
    if (
      assigneeSummarizeByFieldPathMap[type] &&
      assigneeSummarizeByFieldPathMap[type][name]
    ) {
      return assigneeSummarizeByFieldPathMap[type][name];
    }
    return {
      _id: `assignee.custom_values.${name}`,
      name: `assignee.custom_values.${name}`,
    };
  }
  if (type === "GOAL_FIELD") {
    if (["assignee", "outlook", "categories", "alignment"].includes(name)) {
      return { _id: `${name}._id`, name: `${name}.name` };
    }
    return { _id: name, name: name };
  }
  return { _id: "", name: "" };
};

const generateFieldPathGoalReport = (type: string, name: string) => {
  if (type === "EMPLOYEE_FIELD") {
    if (name === "name") {
      return "assignee.name";
    }
    if (name === "manager_email") {
      return "assignee.manager.email";
    }
    return `assignee.custom_values.${name}`;
  }
  if (type === "GOAL_FIELD") {
    if (name === "assignee") {
      return "assignee._id";
    }
    if (name === "alignment") {
      return "alignment._id";
    }
    if (["alignment_assignee", "assignee_group"].includes(name)) {
      return name.replace("_", ".");
    }
    if (name === "due_date") {
      return "end_date";
    }
    if (name === "last_status_update") {
      return "last_goal_status_update";
    }
    return name;
  }
  return name;
};

export const selectSummaryStagesGoalReport = async ({
  db,
  companyID,
  summarizeBy,
  aggregationOperations,
  goalReportMatches,
}: {
  db: Db;
  companyID: ObjectId;
  summarizeBy: any[];
  aggregationOperations: any[];
  goalReportMatches: MatchStage[] | null;
}) => {
  // values to group by in $group stage _id{...groupBy}
  const groupBy: { [x: string]: { $ifNull: string[] } } = {};
  const preCleanupStage: { [x: string]: any } = {};
  let binningStages: any = [];
  const groupStage: { [x: string]: { [x: string]: string } | {} } = {};

  const cleanupStage: { [x: string]: any } = {};
  const postGroupCleanupStage: { [x: string]: string } = {};

  for (const summarizeByItem of summarizeBy) {
    const { type, name, selection } = summarizeByItem;
    const field = generateSummarizeBy(type, name);
    const cleanupLocation = `cleanup.${type}${name}`;

    if (selection) {
      const secondarySelectionAggregation = getSecondarySelectionAggregation(
        field,
        name,
        selection
      );
      preCleanupStage[cleanupLocation] = secondarySelectionAggregation;

      cleanupStage[`summarizeBy.${type}.${name}`] = {
        _id: `$${field._id}`,
        name: `$${cleanupLocation}`,
      };

      if (binningOptions.includes(selection)) {
        let boundaries: number[] = [];
        if (typeof selection === "number") {
          const minMax = await getMinMaxForField(
            db,
            companyID,
            goalReportMatches,
            field._id,
            "goals"
          );
          boundaries = await getBucketBoundaries(minMax, selection);
        }
        const bucketAggregation = getBucketAggregation(
          cleanupLocation,
          boundaries,
          name,
          type,
          "goalReports"
        );
        binningStages = [...binningStages, ...bucketAggregation];
      }
    } else {
      cleanupStage[cleanupLocation] = `$${field._id}`;
      cleanupStage[`summarizeBy.${type}.${name}`] = {
        _id: `$${field._id}`,
        name: `$${field.name}`,
      };
    }

    groupBy[`${type}_${name}`] = { $ifNull: [`$${cleanupLocation}`, ""] };
  }

  aggregationOperations.forEach((field) => {
    if (field.type === "GOAL_FIELD") {
      if (field.name === "due_date") {
        field.name = "end_date";
      }
    }
    const name = `${field.type}_${field.name}`;
    const location = generateFieldPathGoalReport(field.type, field.name);
    const operation = field.operation;
    let operationKey: string | null = null;

    if (operation === SummaryFunction.Count) {
      groupStage[name] = { $count: {} };
      postGroupCleanupStage[location] = `$${name}`;
      return;
    }

    cleanupStage[`cleanup.${name}`] = {
      $cond: [{ $eq: [`$${location}`, ""] }, null, `$${location}`],
    };

    switch (operation) {
      case SummaryFunction.Average:
        operationKey = "$avg";
        break;
      case SummaryFunction.Maximum:
        operationKey = "$max";
        break;
      case SummaryFunction.Minimum:
        operationKey = "$min";
        break;
      case SummaryFunction.Sum:
        operationKey = "$sum";
        break;
    }

    if (operationKey) {
      groupStage[name] = { [operationKey]: `$cleanup.${name}` };
      postGroupCleanupStage[location] = `$${name}`;
    }
  });

  const stages = [
    { $addFields: { ...preCleanupStage } },
    { $addFields: { ...cleanupStage } },
    ...binningStages,
    {
      $group: {
        _id: summarizeBy.length > 0 ? groupBy : "$_id",
        ...groupStage,
        summarizeBy: { $first: "$summarizeBy" },
      },
    },
    { $addFields: { ...postGroupCleanupStage } },
  ];

  return stages;
};

export const getGoalReportPipeline = async (
  db: Db,
  props: GetGoalReportProps
): Promise<Record<string, unknown>[]> => {
  const {
    companyID,
    filters,
    sorts,
    pageNumber = 1,
    pageSize = 50,
    summarizeBy = [],
    aggregationOperations = [],
    userPermissions,
  } = props;

  const maxPageSize = maximumGoalReportPageSize;
  const actualPageSize = Math.min(maxPageSize, pageSize);
  const skipParam = (pageNumber - 1) * actualPageSize;
  const limitParam = actualPageSize;

  const goalFilters = formatFilters(filters || [], Error);
  let allowedCustomFields: string[] = [];

  if (
    !(
      userPermissions?.includes(
        ReportAnalyticsRbacPermissions.createGoalReport
      ) ||
      userPermissions?.includes(ReportAnalyticsRbacPermissions.createReport)
    )
  ) {
    const allowedCustomFieldsResponse = await generateAllowedCustomFields(
      db,
      companyID,
      userPermissions,
      "goalReport"
    );
    allowedCustomFields = allowedCustomFieldsResponse.allowedCustomFields;
  }
  const [goalReportMatches, calculatedGoalReportMatches] =
    generateGoalReportMatches(goalFilters, allowedCustomFields);

  const isSummaryView =
    (summarizeBy && summarizeBy.length > 0) ||
    (aggregationOperations && aggregationOperations.length > 0);

  const summaryStages = isSummaryView
    ? await selectSummaryStagesGoalReport({
        db,
        companyID,
        summarizeBy,
        aggregationOperations,
        goalReportMatches,
      })
    : [];

  const defaultSorts: GoalReportSort[] = [
    { name: "Name", direction: "asc", fieldPath: ["name"], type: "GOAL_FIELD" },
    {
      name: "Last Status Update",
      direction: "asc",
      fieldPath: ["last_goal_status_update"],
      type: "GOAL_FIELD",
    },
  ];

  const sortsToUse = sorts?.length ? sorts : defaultSorts;
  const sortStage = translateGoalReportSorts(sortsToUse, isSummaryView);

  const sortAndLimitStages: Record<string, unknown>[] = [
    { $sort: { ...sortStage } },
    // pagination always comes after sorts.
    { $skip: skipParam },
    { $limit: limitParam },
  ];

  const detailedViewPipeline = [
    {
      $match: {
        company_id: companyID,
        status: { $ne: "deleted" },
        ...(goalReportMatches && goalReportMatches.length > 0
          ? { $and: goalReportMatches }
          : {}),
      },
    },
    {
      $addFields: {
        current_progress: {
          // should v simply be the value divided by the target times 100
          $cond: {
            if: { $eq: ["$target", 0] },
            then: null,
            else: { $multiply: [{ $divide: ["$value", "$target"] }, 100] },
          },
        },
      },
    },
    ...(calculatedGoalReportMatches && calculatedGoalReportMatches.length > 0
      ? [{ $match: { $and: calculatedGoalReportMatches } }]
      : []),
    ...sortAndLimitStages,
  ];

  const summaryViewPipeline = [
    {
      $match: {
        company_id: companyID,
        status: { $ne: "deleted" },
        ...(goalReportMatches && goalReportMatches.length > 0
          ? { $and: goalReportMatches }
          : {}),
      },
    },
    {
      $addFields: {
        current_progress: {
          $cond: {
            if: { $eq: ["$target", 0] },
            then: null,
            else: { $multiply: [{ $divide: ["$value", "$target"] }, 100] },
          },
        },
      },
    },
    ...(calculatedGoalReportMatches && calculatedGoalReportMatches.length > 0
      ? [{ $match: { $and: calculatedGoalReportMatches } }]
      : []),
    ...summaryStages,
    ...sortAndLimitStages,
  ];

  const pipeline = isSummaryView ? summaryViewPipeline : detailedViewPipeline;

  return pipeline.filter(removeNullMatches);
};

/**
 * The purpose of this function is to get a pipeline which will return
 * the count of goal report matching the current query.
 * We strip off all pagination parameters and add a count stage to the
 * result of getGoalReportPipeline.
 */
export const getGoalReportsCountPipeline = async (
  db: Db,
  props: GetGoalReportProps
): Promise<Record<string, unknown>[]> => {
  const rawPipeline = await getGoalReportPipeline(db, props);

  const pipeline = rawPipeline.filter((stage) => {
    return (
      // remove all pagination stages
      !Object.keys(stage).includes("$skip") &&
      !Object.keys(stage).includes("$limit")
    );
  });

  pipeline.push({ $count: "count" });

  return pipeline;
};

/**
 * Gets a count of employee reports matching the current query.
 */
export const getGoalReportTotalCount = async (
  db: Db,
  props: GetGoalReportProps
): Promise<number> => {
  try {
    // pipeline
    const pipeline = await getGoalReportsCountPipeline(db, props);
    // run pipeline
    const results = await db
      .collection("goals")
      .aggregate<{ count: number }>(pipeline, { allowDiskUse: true })
      .toArray();

    // handle case where if no documents, an empty array is returned
    const count = results[0] ? results[0].count : 0;

    return count;
  } catch (err) {
    // if timed out, return -1
    if (err instanceof MongoServerError) {
      if (err.codeName === "MaxTimeMSExpired") {
        return -1;
      }
    }
    // else it's not a timeout error, so return 0
    return 0;
  }
};
