// Dependencies
import { endOfDay } from "date-fns";
import { Db, MongoServerError, ObjectId } from "mongodb";

import { IFieldFilter } from "@repo/models";

import { MatchStage } from "../create-review-report-pipeline/types";
import {
  EmployeeReportAggregationOperationInput,
  EmployeeReportSort,
  EmployeeReportSummarizeByInput,
  FieldType,
  FilterComparison,
  maximumEmployeeReportPageSize,
} from "./types/index";

import {
  binningOptions,
  removeNullMatches,
} from "../create-review-report-pipeline/utils";
import { employeeSummarizeByFieldPathMap } from "./utils";

import { formatFilters } from "../create-review-report-pipeline/format-filter";
import { selectMatchOperation } from "../create-review-report-pipeline/select-match-operation";
import { translateSorts } from "../create-review-report-pipeline/translate-sort";
import { ReportAnalyticsRbacPermissions } from "../format-review-report-data";
import {
  createGroupByDateField,
  generateAllowedCustomFields,
  getBucketAggregation,
  getBucketBoundaries,
  getMinMaxForField,
} from "../shared-utils";

export interface EmployeeReportDataProps {
  companyID: ObjectId;
  columns: { id: string; type: string }[];
  filters: IFieldFilter[][] | null;
  pageNumber?: number;
  pageSize?: number;
  sorts: EmployeeReportSort[] | null;
  summarizeBy: EmployeeReportSummarizeByInput[];
  aggregationOperations: EmployeeReportAggregationOperationInput[];
  userPermissions: string[];
  maximumEmployeeReportPageSize?: number;
}

// formats the ID field path or object for summarizing
const generateSummarizeBy = (type: string, name: string) => {
  if (type === "EMPLOYEE_FIELD") {
    if (
      employeeSummarizeByFieldPathMap[type] &&
      employeeSummarizeByFieldPathMap[type][name]
    ) {
      return employeeSummarizeByFieldPathMap[type][name];
    }
    return {
      _id: `state.custom_values.${name}`,
      name: `state.custom_values.${name}`,
    };
  }
  if (
    employeeSummarizeByFieldPathMap[type] &&
    employeeSummarizeByFieldPathMap[type][name]
  ) {
    return employeeSummarizeByFieldPathMap[type][name];
  }

  return { _id: "", name: "" };
};

const aggregateFieldPath = (field: { _id: string; name: string }) => {
  return {
    _id: `$${field._id}`,
    name: `$${field.name}`,
  };
};

const getSecondarySelectionAggregation = (
  field: { _id: string; name: string },
  name: string,
  selection: string | number | null
) => {
  const dateFields = ["Hire Date", "Termination Date"];

  if (dateFields.includes(name)) {
    return createGroupByDateField(selection as string, field.name);
  }

  return `$${field.name}`;
};

// format the path string to for response object
// handles the case where some values are nested
export const generateFieldPathEmployeeReport = (
  rawType: string,
  rawName: string
): string => {
  if (rawType === "EMPLOYEE_FIELD") {
    return `state.custom_values.${rawName}`;
  }
  return "";
};

export const selectSummaryStagesEmployeeReport = async (
  db: Db,
  companyID: ObjectId,
  summarizeBy: EmployeeReportSummarizeByInput[],
  aggregationOperations: any[],
  employeeReportMatches: MatchStage[] | null
) => {
  // values to group by in $group stage _id{...groupBy}
  const groupBy: { [x: string]: { $ifNull: string[] } } = {};
  const preCleanupStage: { [x: string]: any } = {};
  let binningStages: any = [];
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

  const cleanupStage: { [x: string]: TCleanupStage } = {};

  // puts values back into the correct path
  const postGroupCleanupStage: { [x: string]: string } = {};

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
          const minMax = await getMinMaxForField(
            db,
            companyID,
            employeeReportMatches,
            field.name,
            "employee_history"
          );
          boundaries = await getBucketBoundaries(minMax, selection);
        }
        const bucketAggregation = getBucketAggregation(
          cleanupLocation,
          boundaries,
          name,
          type,
          "employeeReports"
        );
        binningStages = [...binningStages, ...bucketAggregation];
      }
    } else {
      // add summarized by details to separate object
      cleanupStage[cleanupLocation] = aggregatedFieldPath._id;
      cleanupStage[`summarizeBy.${type}.${name}`] = aggregatedFieldPath;
    }

    groupBy[`${type}_${name}`] = { $ifNull: [`$${cleanupLocation}`, ""] };
  }

  aggregationOperations.forEach((field) => {
    const name = `${field.type}_${field.name}`;
    const location = generateFieldPathEmployeeReport(field.type, field.name);
    const operation = field.operation;
    let operationKey: string | null = null;

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
        // else, group by default employee report id
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
  ];

  return stages;
};

export const generateEmployeeReportMatches = (
  filters: IFieldFilter[][],
  allowedCustomFields: string[]
): MatchStage[] => {
  const matches = filters
    .map((filterGroup) => {
      const { field: fieldValue, type, category } = filterGroup[0];
      let fieldPath = fieldValue;
      const filteredCustomFields = allowedCustomFields?.length > 0;
      const allowedToQuery =
        !filteredCustomFields || allowedCustomFields.includes(fieldValue);

      // Process filters creating normalized field paths using the category and field.value (db name for the field)
      switch (category) {
        case "EMPLOYEE_FIELD":
          if (["name", "primary_role", "_id"].includes(fieldValue)) {
            fieldPath = `state.custom_values.${fieldValue}`;
          } else if (["group", "Group", "department"].includes(fieldValue)) {
            fieldPath = "state.custom_values.Group._id";
          } else if (fieldValue === "email") {
            fieldPath = "state.custom_values.email.normalized";
          } else if (["Manager", "manager"].includes(fieldValue)) {
            fieldPath = "state.custom_values.Manager._id";
          } else if (fieldValue === "deactivated") {
            fieldPath = "state.custom_values.[Activation Status].value";
          } else if (fieldValue === "Manager's Email") {
            fieldPath = "state.custom_values.Manager.email";
          } else if (fieldValue === "Activation Status") {
            break;
          } else if (fieldValue === "as_of") {
            fieldPath = "as_of";
          } else if (["people", "person"].includes(type)) {
            fieldPath = `_id`;
          } else if (allowedToQuery) {
            fieldPath = `state.custom_values.${fieldValue}`;
          } else {
            // if not allowed to query employee field, ignore
            return null;
          }
          break;
        case "SUBJECT":
          if (fieldValue === "subject") {
            fieldPath = "_id";
          }
          break;
        default:
          fieldPath = `state.custom_values.${fieldValue}`;
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

enum FieldCategory {
  EMPLOYEE_FIELD = "EMPLOYEE_FIELD",
}

// This stage is used to see if the user has direct reports
// and applies the "Has Direct Reports" additional filter
// the additional stages is required since "Has Direct Reports"/"Direct Reports" is not a custom field
const createDirectReportsStages = (
  filterValue: boolean,
  asOfDate?: Date,
  activationStatusFilter?: IFieldFilter[]
) => [
  {
    $lookup: {
      from: "employee_history",
      let: {
        localUserId: "$_id",
        localCompanyId: "$company_id",
      },
      pipeline: [
        // Filter by company_id and asOfDate first to reduce dataset
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$company_id", "$$localCompanyId"] },
                { $lte: ["$as_of", asOfDate || new Date()] },
              ],
            },
          },
        },
        // Sort and group to get the most recent state for each employee
        { $sort: { user_id: 1, as_of: -1, last_updated: -1 } },
        {
          $group: {
            _id: "$user_id",
            as_of: { $first: "$as_of" },
            document_id: { $first: "$_id" },
            company_id: { $first: "$company_id" },
            state: { $first: "$state" },
          },
        },
        // find documents where the manager is the current user and the activation status is active
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$state.custom_values.Manager._id", "$$localUserId"] },
                { $eq: ["$state.custom_values.Activation Status", ["Active"]] },
              ],
            },
          },
        },
      ],
      as: "direct_reports",
    },
  },
  {
    $addFields: {
      "state.custom_values.hasDirectReports": {
        $cond: {
          if: {
            $and: [
              {
                $isArray: "$direct_reports",
              },
              {
                $gt: [
                  {
                    $size: "$direct_reports",
                  },
                  0,
                ],
              },
            ],
          },
          then: true,
          else: false,
        },
      },
    },
  },
  {
    $match: {
      "state.custom_values.hasDirectReports": filterValue,
    },
  },
];

export const getEmployeeReportPipeline = async (
  db: Db,
  props: EmployeeReportDataProps
): Promise<Record<string, unknown>[]> => {
  const {
    companyID,
    filters,
    sorts,
    pageNumber = 1,
    pageSize = 50,
    summarizeBy,
    aggregationOperations,
    userPermissions,
  } = props;

  const maxPageSize = maximumEmployeeReportPageSize;
  const actualPageSize = Math.min(maxPageSize, pageSize);
  const skipParam = (pageNumber - 1) * actualPageSize;
  const limitParam = actualPageSize;

  let allowedCustomFields: string[] = [];

  if (
    !userPermissions?.includes(
      ReportAnalyticsRbacPermissions.createEmployeeReport
    ) &&
    !userPermissions?.includes(ReportAnalyticsRbacPermissions.createReport)
  ) {
    const allowedCustomFieldsResponse = await generateAllowedCustomFields(
      db,
      companyID,
      userPermissions,
      "employeeReport"
    );
    allowedCustomFields = allowedCustomFieldsResponse.allowedCustomFields;
  }

  // if as_of filter is not provided, use LTE current date for as_of
  const asOfFilter = {
    field: "as_of",
    value: new Date().toISOString(),
    comparison: FilterComparison.LessThanOrEqual,
    type: FieldType.Date,
    category: FieldCategory.EMPLOYEE_FIELD,
  };

  // Check if any sub-array contains an as_of filter
  const hasAsOfFilter = filters?.some((filterArray) =>
    filterArray?.some((filter) => filter.field === "as_of")
  );
  const filtersToHandleSeparately = ["Activation Status", "Has Direct Reports"];

  const filtersProp = filters?.length
    ? filters
        .map((filterArray: IFieldFilter[]) => {
          // Remove "Activation Status" filters bc handled separately in getFilteredEmployeeIds
          const filteredArray = filterArray.filter(
            (filter) => !filtersToHandleSeparately.includes(filter.field)
          );

          // Add asOfFilter if not present in any sub-array
          if (!hasAsOfFilter) {
            filteredArray.push(asOfFilter);
          }
          return filteredArray;
        })
        .filter((filterArray) => filterArray.length > 0) // Remove empty arrays
    : [[asOfFilter]];

  const employeeFilters = formatFilters(filtersProp || [], Error);
  const employeeReportMatches = generateEmployeeReportMatches(
    employeeFilters,
    allowedCustomFields
  );
  const isSummaryView =
    summarizeBy.length > 0 || aggregationOperations.length > 0;

  // Check if "Has Direct Reports" filter is present
  const hasDirectReportsFilter = filters
    ?.flat()
    .find((filter) => filter.field === "Has Direct Reports");

  // Check if "Activation Status" filter is present
  const activationStatusFilter = filters?.filter(
    (filter) => filter?.[0].field === "Activation Status"
  )?.[0];
  const deactivatedState = activationStatusFilter?.[0]?.value === "Deactivated";
  const includeDeactivated = !activationStatusFilter || deactivatedState;

  // Get as_of date from filters or use current date
  const asOfValue = filters
    ?.flat()
    .find((filter) => filter.field === "as_of")?.value;
  // Get as_of date from filters or use current date, set to end of day
  const asOfDate = endOfDay(
    new Date(
      asOfValue instanceof Date
        ? asOfValue.getTime()
        : typeof asOfValue === "string"
        ? asOfValue
        : Date.now()
    )
  );

  const filteredEmployeeIds = await getFilteredEmployeeIds(
    db,
    companyID,
    asOfDate,
    activationStatusFilter
  );

  // Validate that asOfDate is a valid date
  if (isNaN(asOfDate.getTime())) {
    throw new Error("Invalid as_of date value provided in filters");
  }

  const defaultSorts: EmployeeReportSort[] = [
    {
      name: "Employee",
      direction: "asc",
      fieldPath: ["subject", "Employee"],
      type: "EMPLOYEE_FIELD",
    },
  ];

  const sortsToUse = sorts?.length ? sorts : defaultSorts;
  const sortStage = translateSorts(sortsToUse);
  const filteredUserIds = filteredEmployeeIds?.map((employee) => employee._id);

  const sortAndLimitStages: Record<string, unknown>[] = [
    { $sort: { ...sortStage } },
    // pagination always comes after sorts.
    { $skip: skipParam },
    { $limit: limitParam },
  ];

  const summaryStages = await selectSummaryStagesEmployeeReport(
    db,
    companyID,
    summarizeBy,
    aggregationOperations,
    employeeReportMatches
  );

  // Only include direct reports stages if the filter is present
  const directReportsStages = hasDirectReportsFilter
    ? createDirectReportsStages(
        hasDirectReportsFilter.value === true ||
          hasDirectReportsFilter.value === "true",
        asOfDate,
        activationStatusFilter
      )
    : [];

  // Separate as_of filters from other employee report matches
  const separateAsOfFilters = (
    matches: MatchStage[]
  ): { asOfFilters: MatchStage[]; otherFilters: MatchStage[] } => {
    const asOfFilters: MatchStage[] = [];
    const otherFilters: MatchStage[] = [];

    matches.forEach((match) => {
      if (match && typeof match === "object") {
        const hasAsOfFilter = Object.keys(match).some((key) => key === "as_of");
        if (hasAsOfFilter) {
          asOfFilters.push(match);
        } else {
          otherFilters.push(match);
        }
      }
    });

    return { asOfFilters, otherFilters };
  };

  const { asOfFilters, otherFilters } = employeeReportMatches
    ? separateAsOfFilters(employeeReportMatches)
    : { asOfFilters: [], otherFilters: [] };

  const detailedViewPipeline = [
    {
      $addFields: {
        as_of: {
          $cond: {
            if: { $eq: [{ $type: "$as_of" }, "string"] },
            then: { $toDate: "$as_of" },
            else: "$as_of",
          },
        },
      },
    },
    {
      $match: {
        company_id: companyID,
        user_id: { $in: filteredUserIds },
        ...(asOfFilters.length > 0 ? { $and: asOfFilters } : {}),
      },
    },
    // as_of and last_updated are both required in the sort to ensure
    // the proper user state is returned.
    { $sort: { user_id: 1, as_of: -1, last_updated: -1 } },
    {
      $addFields: {
        //add employee id and name to the state object
        "state.custom_values.Employee": {
          //make _id a string
          _id: { $toString: "$user_id" },
          name: "$name",
          email: "$email",
        },
      },
    },
    {
      $group: {
        _id: "$user_id",
        user_id: { $first: "$user_id" },
        as_of: { $first: "$as_of" },
        document_id: { $first: "$_id" },
        company_id: { $first: "$company_id" },
        subject: { $first: "$state.custom_values" },
        summarizeBy: { $first: "$summarizeBy" },
      },
    },
    // Apply other filters if they exist
    ...(otherFilters.length > 0
      ? [
          {
            $addFields: {
              "state.custom_values": "$subject",
            },
          },
          {
            $match: {
              $and: otherFilters,
            },
          },
        ]
      : []),
    ...directReportsStages,
    ...sortAndLimitStages,
  ];

  const summaryViewPipeline = [
    {
      $addFields: {
        as_of: {
          $cond: {
            if: { $eq: [{ $type: "$as_of" }, "string"] },
            then: { $toDate: "$as_of" },
            else: "$as_of",
          },
        },
      },
    },
    {
      $match: {
        company_id: companyID,
        user_id: { $in: filteredUserIds },
        ...(asOfFilters.length > 0 ? { $and: asOfFilters } : {}),
      },
    },
    // as_of and last_updated are both required in the sort to ensure
    // the proper user state is returned.
    { $sort: { user_id: 1, as_of: -1, last_updated: -1 } },
    {
      $group: {
        _id: "$user_id",
        as_of: { $first: "$as_of" },
        company_id: { $first: "$company_id" },
        state: { $first: "$state.custom_values" },
        summarizeBy: { $first: "$summarizeBy" },
      },
    },
    {
      $addFields: {
        "state.custom_values": "$state",
      },
    },
    // Apply transformed other employee report matches after getting the most recent document
    ...(otherFilters.length > 0
      ? [
          {
            $match: {
              $and: otherFilters,
            },
          },
        ]
      : []),
    ...directReportsStages,
    ...summaryStages,
    {
      $project: {
        _id: 1,
        company_id: 1,
        subject: "$state.custom_values",
        summarizeBy: 1,
        as_of: 1,
      },
    },
    ...sortAndLimitStages,
  ];

  const pipeline = isSummaryView ? summaryViewPipeline : detailedViewPipeline;
  return pipeline.filter(removeNullMatches);
};

/**
 * The purpose of this function is to get a pipeline which will return
 * the count of employee report matching the current query.
 * We strip off all pagination parameters and add a count stage to the
 * result of getEmployeeReportPipeline.
 */
export const getEmployeeReportsCountPipeline = async (
  db: Db,
  props: EmployeeReportDataProps
): Promise<Record<string, unknown>[]> => {
  const rawPipeline = await getEmployeeReportPipeline(db, props);

  const pipeline = rawPipeline.filter((stage) => {
    return (
      // remove all pagination stages
      !Object.keys(stage).includes("$skip") &&
      !Object.keys(stage).includes("$limit")
    );
  });

  pipeline.push({
    $count: "count",
  });

  return pipeline;
};

/**
 * Gets a count of employee reports matching the current query.
 */
export const getEmployeeReportTotalCount = async (
  db: Db,
  props: EmployeeReportDataProps
): Promise<number> => {
  try {
    // pipeline
    const pipeline = await getEmployeeReportsCountPipeline(db, props);
    // run pipeline
    const results = await db
      .collection("employee_history")
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

/**
 * Gets a list of employee IDs that match the given filters at a specific point in time.
 * This function queries the employee_history collection to find the most recent activation state
 * of each employee before or at the as_of date, and filters based on activation status.
 */
export const getFilteredEmployeeIds = async (
  db: Db,
  companyId: ObjectId,
  asOfDate: Date,
  activationStatusFilter?: IFieldFilter[]
): Promise<Array<{ _id: ObjectId }>> => {
  const deactivatedState = activationStatusFilter?.[0]?.value === "Deactivated";

  // Base pipeline to get the most recent state for each user before or at asOfDate
  const pipeline: Record<string, unknown>[] = [
    {
      $match: {
        company_id: companyId,
        as_of: { $lte: asOfDate },
      },
    },
    // Sort by as_of and last_updated to get the most recent state
    {
      $sort: {
        user_id: 1,
        as_of: -1,
        last_updated: -1,
      },
    },
    // Group by user_id to get the most recent state
    {
      $group: {
        _id: "$user_id",
        as_of: { $first: "$as_of" },
        document_id: { $first: "$_id" },
        state: { $first: "$state" },
      },
    },
  ];

  // If we have an activation status filter, add it to the pipeline
  if (activationStatusFilter?.length === 1) {
    pipeline.push({
      $match: {
        "state.custom_values.Activation Status": deactivatedState
          ? "Deactivated"
          : "Active",
      },
    });
  }

  // Project only the _id field
  pipeline.push({
    $project: {
      _id: 1,
    },
  });

  const filteredEmployeeIds = await db
    .collection("employee_history")
    .aggregate<{ _id: ObjectId }>(pipeline, { allowDiskUse: true })
    .toArray();

  return filteredEmployeeIds;
};
