// Dependencies
import { addDays, addMonths, addYears } from "date-fns";
import { getDayOfYear } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { ObjectId } from "mongodb";
import type { z } from "zod";

// Project Dependencies
import type {
  FieldComparator,
  FieldValueModel,
  ICohortAnniversaryQueryValue,
  ICohortQueryModel,
  ICohortQueryValue,
  ICohortRelativeQueryValue,
} from "@repo/models";
import {
  addDaysInTimezone,
  addMonthsInTimezone,
  addYearsInTimezone,
} from "@repo/utils-isomorphic";

type MongoComparator =
  | "$eq"
  | "$ne"
  | "$gt"
  | "$lt"
  | "$gte"
  | "$lte"
  | "$in"
  | "$nin"
  | "$not"
  | "$regex"
  | "$options"
  | "$expr"
  | "$and"
  | "$or"
  | "$match"
  | "type"
  | "expression";

interface Query<T> {
  $and: {
    $or: T[];
  }[];
}

interface MongoClause {
  field: ObjectId | "is_manager";
  value: Record<string, z.infer<typeof FieldValueModel>>;
  type?: string;
}

/**
 * This schema defines the output of the cohort query. It is allows for ands
 * and ors to be nested.
 */
export type CohortMongoQuery = Query<MongoClause>;

/**
 * This will check if an object is a plain object.
 */
export const isPlainObject = (obj: any) => {
  return Object.prototype.toString.call(obj) === "[object Object]";
};

/**
 * This will get all of the field IDs that are used in the query. This is used
 * to reduce the number of documents that need to be processed.
 */
export const getAllFieldIdsFromCohortQuery = (query: CohortMongoQuery) => {
  const fieldIds = new Set<ObjectId>();

  const traverse = (obj: any) => {
    if (isPlainObject(obj)) {
      if (obj.field) {
        fieldIds.add(obj.field);
      }
      Object.values(obj).forEach(traverse);
    } else if (Array.isArray(obj)) {
      obj.forEach(traverse);
    }
  };

  traverse(query);

  return Array.from(fieldIds);
};

/**
 * Generate the expression to match relative dates
 *
 * Timezone may or may not be provided. If so we will use it to:
 * - Calculate the relative date (In case of DST changes)
 * - Determine what day is is "now" in the user's time
 */
export const toRelativeDateComparator = (
  value: ICohortRelativeQueryValue,
  operator: z.infer<typeof FieldComparator>,
  asOf?: Date
) => {
  if (!["eq", "ne", "gt", "lt", "gte", "lte"].includes(operator)) {
    throw new Error(`Invalid operator for relative date: ${operator}`);
  }

  // Timezone may or may not be provided
  const timezone = value.timezone;

  // Determine the date to compare relative to - init with asOf or "now"
  let queryDate = asOf || new Date();
  // Adjust the date by the offset from the relative_date query
  // If timezone is provided, adjust relative to the timezone
  if (timezone) {
    if (value.relative_date_unit === "years") {
      queryDate = addYearsInTimezone({
        date: queryDate,
        years: value.relative_date,
        timezone,
      });
    } else if (value.relative_date_unit === "months") {
      queryDate = addMonthsInTimezone({
        date: queryDate,
        months: value.relative_date,
        timezone,
      });
    } else {
      queryDate = addDaysInTimezone({
        date: queryDate,
        days: value.relative_date,
        timezone,
      });
    }
    // Normalize the UTC date to the timezone
    queryDate = utcToZonedTime(queryDate, timezone);
  } else {
    if (value.relative_date_unit === "years") {
      queryDate = addYears(queryDate, value.relative_date);
    } else if (value.relative_date_unit === "months") {
      queryDate = addMonths(queryDate, value.relative_date);
    } else {
      queryDate = addDays(queryDate, value.relative_date);
    }
  }
  // Remove the time from the date because that's how the values are stored in DB
  queryDate.setHours(0, 0, 0, 0);

  return { [`$${operator}`]: queryDate };
};

/**
 * Generate the expression to match anniversary dates
 *
 * Timezone may or may not be provided. If so we will use it to:
 * - Calculate the anniversary date offset (days before/after anniversary) (In case of DST changes)
 * - Determine what day is is "now" in the user's time for leap year checks
 * - Pass to the query when determining the day and month of "now" in user's time
 */
export const toAnniversaryDateComparator = (
  value: ICohortAnniversaryQueryValue,
  operator: z.infer<typeof FieldComparator>,
  field: ObjectId | "is_manager",
  asOf?: Date
) => {
  if (
    ![
      "eq_anniversary",
      "before_anniversary",
      "after_anniversary",
      "gte_anniversary",
      "lte_anniversary",
    ].includes(operator)
  ) {
    throw new Error(`Invalid operator for anniversary date: ${operator}`);
  }

  // Determine if offset is positive or negative
  let offset = value.anniversary_date;
  if (operator === "eq_anniversary") {
    offset = 0;
  } else if (operator === "before_anniversary") {
    // Negative offset to go back in time
    offset *= -1;
  }

  // Timezone may or may not be provided
  const timezone = value.timezone;

  // Determine the date to calculate the anniversary of - init with asOf or "now"
  let queryDate = asOf || new Date();
  // Adjust the date by the offset from the anniversary_date query
  // If timezone is provided, adjust relative to the timezone
  if (timezone) {
    if (value.anniversary_date_unit === "months") {
      queryDate = addMonthsInTimezone({
        date: queryDate,
        months: offset,
        timezone,
      });
    } else {
      queryDate = addDaysInTimezone({
        date: queryDate,
        days: offset,
        timezone,
      });
    }
  } else {
    if (value.anniversary_date_unit === "months") {
      queryDate = addMonths(queryDate, offset);
    } else {
      queryDate = addDays(queryDate, offset);
    }
  }

  // Check if the calculated date is Feb 28 and/or a leap year
  let isFeb28: boolean;
  if (timezone) {
    // If timezone is provided, convert the calculated date to the timezone to check if it's Feb 28
    const localDate = utcToZonedTime(queryDate, timezone);
    isFeb28 = localDate.getMonth() === 1 && localDate.getDate() === 28;
  } else {
    isFeb28 = queryDate.getMonth() === 1 && queryDate.getDate() === 28;
  }
  const isLeapYear =
    getDayOfYear(new Date(queryDate.getFullYear(), 11, 31)) === 366; // Only relevant in February so we don't care about timezone

  // Expression to match the day of the month
  let matchDay: any;
  // If the calculatedValue is Feb 28 and not a leap year, we need to check for Feb 29 too
  if (!isLeapYear && isFeb28) {
    matchDay = {
      $or: [
        {
          $eq: [
            { $dayOfMonth: { $arrayElemAt: [`$objects.${field}`, 0] } },
            28,
          ],
        },
        {
          $eq: [
            { $dayOfMonth: { $arrayElemAt: [`$objects.${field}`, 0] } },
            29,
          ],
        },
      ],
    };
  } else {
    const dayOfMonth: { date: Date; timezone?: string } = { date: queryDate };
    if (timezone) {
      dayOfMonth.timezone = timezone;
    }
    matchDay = {
      $eq: [
        { $dayOfMonth: { $arrayElemAt: [`$objects.${field}`, 0] } },
        { $dayOfMonth: dayOfMonth },
      ],
    };
  }

  // Expression to match the month
  const month: { date: Date; timezone?: string } = { date: queryDate };
  if (timezone) {
    month.timezone = timezone;
  }
  const matchMonth = {
    $eq: [
      { $month: { $arrayElemAt: [`$objects.${field}`, 0] } },
      { $month: month },
    ],
  };

  // Return an object that will be used to generate the MongoDB query
  return {
    type: "date-expression",
    expression: {
      $and: [matchMonth, matchDay],
    },
  };
};

/**
 * Converts the json comparator to a MongoDB comparator.
 *
 * Optional asOf date can be provided to calculate date queries relative to a specific date.
 */
export const toMongoComparator = (
  operator: z.infer<typeof FieldComparator>,
  value: ICohortQueryValue,
  field: ObjectId | "is_manager",
  asOf?: Date
): Partial<Record<MongoComparator, any>> => {
  // Handle relative date queries
  if (value && typeof value === "object" && "relative_date" in value) {
    return toRelativeDateComparator(value, operator, asOf);
  }
  if (value && typeof value === "object" && "anniversary_date" in value) {
    return toAnniversaryDateComparator(value, operator, field, asOf);
  }

  // All other queries
  const calculatedValue = toFieldValue(value, operator);
  switch (operator) {
    case "eq":
      return {
        $eq: calculatedValue,
      };
    case "ne":
      return {
        $ne: calculatedValue,
      };
    case "gt":
      return {
        $gt: calculatedValue,
      };
    case "lt":
      return {
        $lt: calculatedValue,
      };
    case "gte":
      return {
        $gte: calculatedValue,
      };
    case "lte":
      return {
        $lte: calculatedValue,
      };
    case "in":
      if (Array.isArray(value)) {
        return {
          $in: value?.map((value) => toFieldValue(value)),
        };
      }

      throw new Error(`Invalid value for "in": ${value}`);
    case "nin":
      if (Array.isArray(value)) {
        return {
          $nin: value.map((value) => toFieldValue(value)),
        };
      }

      throw new Error(`Invalid value for "nin": ${value}`);
    case "regex":
      return {
        $regex: calculatedValue,
        $options: "i",
      };
    case "not_regex":
      return {
        $not: {
          $regex: calculatedValue,
          $options: "i",
        },
      };
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
};

/**
 * Converts the json field value to a MongoDB field value.
 */
export const toFieldValue = (
  value: ICohortQueryValue,
  operator?: z.infer<typeof FieldComparator>
) => {
  if (value === null) {
    return null;
  }
  if (typeof value === "object") {
    if ("date" in value) {
      return new Date(value.date);
    }
    if ("oid" in value) {
      return new ObjectId(value.oid);
    }
  }
  return value;
};

/**
 * Finds all nested objects with specific shapes and will convert them to a
 * format that can be used in a MongoDB query. For example, an object that
 * looks like: { $date: '2020-01-01T00:00:00.000Z' } will be converted to a
 * Date object.
 *
 * This does not mutate the original object.
 */
export const translateCohortQueryToMongoQuery = (
  query: ICohortQueryModel,
  asOf?: Date
): CohortMongoQuery => {
  // First copy the query so that we don't mutate the original object
  const copiedQuery: ICohortQueryModel = JSON.parse(JSON.stringify(query));

  // translate the query to a format that can be used in a MongoDB query,
  // mainly convert or to $or and and to $and. The traverse function will
  // convert this into the correct CohortMongoQuery type.
  const mongoQuery: CohortMongoQuery = {
    $and: [],
  };

  for (const andClause of copiedQuery.and) {
    const orClauses = andClause.or.map((orClause) => {
      const field =
        typeof orClause.field === "object"
          ? new ObjectId(orClause.field.oid)
          : orClause.field;
      const value = toMongoComparator(
        orClause.comparator,
        orClause.value,
        field,
        asOf
      );

      return {
        field,
        value,
      };
    });

    mongoQuery.$and.push({
      $or: orClauses,
    });
  }

  return mongoQuery;
};

/*
	This function ensures that we sort all of the users returned (regardless of pagination)
	by alphabetical order.
*/
export const sortMatchingEmployeeIDsByName = (
  usersWithNames: { _id: ObjectId; name: string }[],
  matchingEmployeeIDs: ObjectId[]
): ObjectId[] | null => {
  try {
    // Create a map of user IDs to names for quick lookup
    const userIdToNameMap = new Map(
      usersWithNames.map((user) => [user._id.toString(), user.name])
    );

    // Sort the matchingEmployeeIDs based on the alphabetical order of names
    return matchingEmployeeIDs.sort((a, b) => {
      const nameA = userIdToNameMap.get(a.toString()) || "";
      const nameB = userIdToNameMap.get(b.toString()) || "";
      // If either name is missing, sort it to the end
      if (!nameA || !nameB) {
        return !nameA ? 1 : -1;
      }

      return nameA.localeCompare(nameB);
    });
  } catch (err) {
    return null;
  }
};
