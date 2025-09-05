import { ObjectId } from "mongodb";

import { FilterComparison } from "@repo/models";

import { MatchStage } from "./types";

/**
 * Determines boolean properties of a filter comparison to help in building a mongo query
 */
const getStartsAndEndsComparisonProperties = (
  comparison: FilterComparison
): { [key: string]: boolean } => {
  return {
    isStartsWithComparison: [
      FilterComparison.StartsWith,
      FilterComparison.NotStartsWith,
    ].includes(comparison),
    isNotComparison: [
      FilterComparison.NotStartsWith,
      FilterComparison.NotEndsWith,
    ].includes(comparison),
  };
};

/**
 * Gets mongo comparisons for starts and ends of strings
 *
 * if caseSensitive is False, the $options flag is set to "i" to make
 * the search case insensitive.
 */
const makeStartsAndEndsComparisons = (
  comparison:
    | FilterComparison.StartsWith
    | FilterComparison.NotStartsWith
    | FilterComparison.EndsWith
    | FilterComparison.NotEndsWith,
  value: string,
  caseSensitive: boolean
): { [key: string]: any } | null => {
  const { isStartsWithComparison, isNotComparison } =
    getStartsAndEndsComparisonProperties(comparison);
  const regexString = isStartsWithComparison
    ? `^${escapeRegex(value)}`
    : `${escapeRegex(value)}$`;
  const regexMongoObject = {
    $regex: regexString,
    ...(!caseSensitive && { $options: "i" }),
  };
  return isNotComparison ? { $not: regexMongoObject } : regexMongoObject;
};

/**
 * Prepares a String value for escape from regex characters
 */
const escapeRegex = (value: string): string => {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Builds a mongodb search for a substring.
 *
 * Escapes any regex characters in the value and wraps it in .* to
 * match any substring.
 *
 * if caseSensitive is False, the $options flag is set to "i" to make
 * the search case insensitive.
 */
const buildSubstringSearch = (
  value: string,
  caseSensitive: boolean
): { $regex: string; $options?: string } => {
  return {
    $regex: `.*${escapeRegex(String(value))}.*`,
    ...(!caseSensitive && { $options: "i" }),
  };
};

/**
 * Translates a single value that is not a date into a mongodb operation.
 */
const makeMongoValueComparison = (
  fieldPath: string,
  comparison: FilterComparison,
  value: unknown
): MatchStage | null => {
  const matchStage = {} as MatchStage;

  // if value is date we have a mismatch between the type and the value
  if (value instanceof Date) {
    throw new Error("Invalid filter");
  }

  switch (comparison) {
    case FilterComparison.Equals:
      matchStage[fieldPath] = value;
      break;
    case FilterComparison.NotEqual:
      matchStage[fieldPath] = { $ne: value };
      break;
    case FilterComparison.GreaterThan:
      matchStage[fieldPath] = { $gt: value };
      break;
    case FilterComparison.GreaterThanOrEqual:
      matchStage[fieldPath] = { $gte: value };
      break;
    case FilterComparison.LessThan:
      matchStage[fieldPath] = { $lt: value };
      break;
    case FilterComparison.LessThanOrEqual:
      matchStage[fieldPath] = { $lte: value };
      break;
    case FilterComparison.Contains:
      matchStage[fieldPath] = buildSubstringSearch(String(value), false);
      break;
    case FilterComparison.NotContains:
      matchStage[fieldPath] = {
        $not: buildSubstringSearch(String(value), false),
      };
      break;
    case FilterComparison.StartsWith:
    case FilterComparison.NotStartsWith:
    case FilterComparison.EndsWith:
    case FilterComparison.NotEndsWith:
      matchStage[fieldPath] = makeStartsAndEndsComparisons(
        comparison,
        String(value),
        false
      );
      break;
    default:
      return null;
  }

  return matchStage;
};

/**
 * Translates a date, path, comparison, and type to a mongodb operation.
 */
const makeMongoDateComparison = (
  fieldPath: string,
  comparison: FilterComparison,
  dates: Date[]
): MatchStage | null => {
  const [startDate, endDate] = dates;
  const matchStage: MatchStage | null = {};
  switch (comparison) {
    case FilterComparison.Before:
    case FilterComparison.LessThan:
      // if less than, check that the date is less than the start date.
      matchStage[fieldPath] = { $lt: startDate };
      break;
    case FilterComparison.After:
    case FilterComparison.GreaterThan:
      // if greater than, check the date is greater than the end date
      matchStage[fieldPath] = { $gt: endDate };
      break;
    case FilterComparison.Equals:
    case FilterComparison.Between:
      // if equal, check the date is within the start and end date
      matchStage[fieldPath] = { $gte: startDate, $lte: endDate };
      break;
    case FilterComparison.LessThanOrEqual:
      // if less than or equal, check the date is less than or equal to the start date
      matchStage[fieldPath] = { $lte: endDate };
      break;
    case FilterComparison.GreaterThanOrEqual:
      // if greater than or equal, check the date is greater than or equal to the end date
      matchStage[fieldPath] = { $gte: startDate };
      break;
    default:
      return null;
  }
  return matchStage;
};

/**
 * Creates mongo comparison for array of people, multi-select values, or departments
 */
const compareManySubjectFields = (
  fieldPath: string,
  comparison: FilterComparison,
  values: (string | ObjectId | Date)[]
): MatchStage | null => {
  const filteredValues = values.filter((item) => {
    // this rules out if we have a date
    if (!item || item instanceof Date) {
      return false;
    }
    // otherwise the value is a string or ObjectId
    return true;
  }) as (string | ObjectId)[];
  switch (comparison) {
    case FilterComparison.Equals:
      // if no multi-select value
      if (filteredValues.length === 0) {
        return { [fieldPath]: "" };
      } else {
        return {
          [fieldPath]: { $size: filteredValues.length, $all: filteredValues },
        };
      }
    case FilterComparison.NotEqual:
      return { [fieldPath]: { $not: { $all: filteredValues } } };
    case FilterComparison.Contains:
      return { [fieldPath]: { $in: filteredValues } };
    case FilterComparison.NotContains:
      return { [fieldPath]: { $nin: filteredValues } };
    default: {
      return null;
    }
  }
};

/**
 * Translates an array of values with a path, comparison and type to a mongodb operation.
 */
const makeMongoArrayComparison = (
  fieldPath: string,
  comparison: FilterComparison,
  values: (string | ObjectId | Date)[],
  type: string
): MatchStage | null => {
  if (["people", "multi-select", "department", "subject"].includes(type)) {
    return compareManySubjectFields(fieldPath, comparison, values);
  } else if (type === "numeric" && comparison === FilterComparison.Between) {
    const [start, end] = values;
    return { [fieldPath]: { $gte: Number(start), $lte: Number(end) } };
  } else if (["person", "cycle", "template"].includes(type)) {
    switch (comparison) {
      case FilterComparison.Contains:
        return { [fieldPath]: { $in: values } };
      case FilterComparison.NotContains:
        return { [fieldPath]: { $nin: values } };
    }
  }
  return null;
};

/**
 * Translates a comparison, type, path, value and optional values to a mongodb operation.
 *
 * @param fieldPath
 * @param comparison
 * @param value
 * @param type
 * @returns
 */
export const selectMatchOperation = (
  fieldPath: string,
  comparison: FilterComparison,
  values: (string | ObjectId | Date)[],
  value: unknown,
  type: string
): MatchStage | null => {
  let matchStageOrNull = null as MatchStage | null;
  const arrayFieldAsCount = ["review.forms_awaiting_approval"].includes(
    fieldPath
  );
  if (arrayFieldAsCount) {
    if (value) {
      const matchCompare = {} as MatchStage;
      switch (comparison) {
        case FilterComparison.Equals:
          matchCompare[fieldPath] = { $size: Number(value) };
          break;
        case FilterComparison.NotEqual:
          matchCompare[fieldPath] = { $not: { $size: Number(value) } };
          break;
        case FilterComparison.GreaterThan:
          matchCompare.$expr = {
            $gt: [
              { $size: { $ifNull: ["$review.forms_awaiting_approval", []] } },
              Number(value),
            ],
          };
          break;
        case FilterComparison.GreaterThanOrEqual:
          matchCompare.$expr = {
            $gte: [
              { $size: { $ifNull: ["$review.forms_awaiting_approval", []] } },
              Number(value),
            ],
          };
          break;
        case FilterComparison.LessThan:
          matchCompare.$expr = {
            $lt: [
              { $size: { $ifNull: ["$review.forms_awaiting_approval", []] } },
              Number(value),
            ],
          };
          break;
        case FilterComparison.LessThanOrEqual:
          matchCompare.$expr = {
            $lte: [
              { $size: { $ifNull: ["$review.forms_awaiting_approval", []] } },
              Number(value),
            ],
          };
          break;
      }
      matchStageOrNull = matchCompare as MatchStage;
    } else {
      matchStageOrNull = {
        [`${fieldPath}.0`]: { $exists: false },
      } as MatchStage;
    }
  } else if (type === "date") {
    const dates = {} as { [key: string]: Date };
    if (Array.isArray(value)) {
      const dateValues = value.map((date) => {
        if (!(date instanceof Date)) {
          throw new Error("Invalid date");
        }
        return date;
      });
      dates.startDate = dateValues[0];
      if (dateValues.length === 1) {
        dates.endDate = dateValues[0];
      } else {
        dates.endDate = dateValues[1];
      }
    } else {
      if (!(value instanceof Date)) {
        throw new Error("Invalid date");
      }
      // for single date values we set low and high to the start and end of the day.
      const dateTime = new Date(value).getTime();
      dates.startDate = new Date(dateTime - (dateTime % 86400000));
      dates.endDate = new Date(dates.startDate.getTime() + 86400000);
    }
    matchStageOrNull = makeMongoDateComparison(fieldPath, comparison, [
      dates.startDate,
      dates.endDate,
    ]);
  } else if (values.length) {
    matchStageOrNull = makeMongoArrayComparison(
      fieldPath,
      comparison,
      values,
      type
    );
  } else {
    if (["monetary", "numeric"].includes(type)) {
      // value would be a string at this point
      value = Number(value);
    }
    matchStageOrNull = makeMongoValueComparison(fieldPath, comparison, value);
  }
  return matchStageOrNull;
};
