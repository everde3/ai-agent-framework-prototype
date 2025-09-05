import { parseISO } from "date-fns";
import { ObjectId } from "mongodb";

import { FieldType, IFieldFilter, IFieldValue } from "@repo/models";

const validateMongoObjectId = (
  filterValue: string | ObjectId | Date | boolean | null
): ObjectId => {
  if (typeof filterValue === "string") {
    return new ObjectId(filterValue);
  } else if (filterValue instanceof ObjectId) {
    return filterValue;
  } else {
    throw new Error(`Invalid value for ${filterValue}`);
  }
};

/**
 * Verifies the given string is of the form '2013-02-17T00:00:00.000Z'. This is
 * the only acceptable date format for this server ( as of now ).
 */
export const isValidIsoDateString = (str: string | number | Date): boolean => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(String(str)))
    return false;
  const d = new Date(str);
  return d.toISOString() === str;
};

const tryToConvertToDate = (dateString: string, field: string): string => {
  return new Date(dateString).toISOString();
};

export const formatFilters = (
  filters: IFieldFilter[][],
  errorConstructor: ErrorConstructor
): IFieldFilter[][] => {
  const formattedFilters = filters.map((filterGroup) =>
    filterGroup.map((filter) => {
      const filterType: FieldType = filter.type;
      let filterValue = filter.value;

      if (filterType === FieldType.Date) {
        // handle dates as an array or just one date

        let formattedDates: IFieldValue;

        if (Array.isArray(filterValue)) {
          const dateValue = filterValue as Date[];
          dateValue.forEach((date: Date) => {
            if (!isValidIsoDateString(date)) {
              tryToConvertToDate(date.toString(), filter.field);
            }
          });
          formattedDates = dateValue.map((value) => parseISO(String(value)));
        } else {
          if (
            !filterValue ||
            filterValue instanceof ObjectId ||
            typeof filterValue == "boolean"
          ) {
            throw new errorConstructor(
              `Invalid date value for filter ${filter.field}`
            );
          }
          if (!isValidIsoDateString(filterValue)) {
            tryToConvertToDate(filterValue.toString(), filter.field);
          }
          formattedDates = parseISO(String(filterValue));
        }

        filterValue = formattedDates;
      }

      if (
        filterType === FieldType.Person ||
        filterType === FieldType.Cycle ||
        filterType === FieldType.Template ||
        filterType === FieldType.Subject ||
        filterType === FieldType.GoalOutlook ||
        filterType === FieldType.GoalAlignment
      ) {
        if (Array.isArray(filterValue)) {
          filterValue = filterValue.map((value: string | ObjectId | Date) => {
            if (value) {
              return validateMongoObjectId(value);
            }
            return value;
          });
        } else {
          if (filterValue) {
            filterValue = validateMongoObjectId(filterValue);
          }
        }
      }

      if (
        filterType === FieldType.People ||
        filterType === FieldType.Department ||
        filterType === FieldType.GoalCategories
      ) {
        if (Array.isArray(filterValue)) {
          filterValue = filterValue.map((value: string | ObjectId | Date) => {
            if (typeof value === "string") {
              return new ObjectId(value);
            } else if (value instanceof ObjectId) {
              return value;
            } else {
              throw new errorConstructor(
                `Invalid value for filter ${filter.field}`
              );
            }
          });
        } else {
          if (typeof filterValue === "string") {
            filterValue = new ObjectId(filterValue);
          } else if (!(filterValue instanceof ObjectId)) {
            throw new errorConstructor(
              `Invalid value for filter ${filter.field}`
            );
          }
        }
      }

      if (filterType === FieldType.Boolean) {
        filterValue = filterValue === "true" ? true : false;
      }

      return {
        value: filterValue,
        field: filter.field,
        comparison: filter.comparison,
        category: filter.category,
        type: filter.type,
      };
    })
  );

  return formattedFilters;
};
