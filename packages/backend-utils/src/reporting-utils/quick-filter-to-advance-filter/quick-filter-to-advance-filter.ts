/**
 * Functions were copied from react side
 *  webserver/assets/react/pages/ReportAnalytics/pages/Report/store/filters.ts
 */
import {
  FieldType,
  FilterComparison,
  IFieldFilter,
  IGoalCategoriesObject,
  IGoalOutlookObject,
  IQuickFilter,
} from "@repo/models";

/**
 * handles translating the date filters to advanced filters.
 */
export const quickDateFilterToAdvancedDateFilter = (
  startDate: Date,
  endDate: Date,
  dateField:
    | "startDate"
    | "completedDate"
    | "hiredBetweenDate"
    | "goalCreatedBetweenDate"
    | "goalStartBetweenDate"
    | "goalDueBetweenDate",
  category: "REVIEW_FIELD" | "EMPLOYEE_FIELD" | "GOAL_FIELD"
) => {
  // TODO - the field shouldn't require a label to filter the data
  const field = {
    startDate: "start_date",
    completedDate: "completed_date",
    hiredBetweenDate: "Hire Date",
    goalCreatedBetweenDate: "creation_date",
    goalStartBetweenDate: "start_date",
    goalDueBetweenDate: "end_date",
  };

  return [
    [
      {
        comparison: FilterComparison.GreaterThanOrEqual,
        type: FieldType.Date,
        field: field[dateField],
        category,
        value: startDate,
      } satisfies IFieldFilter,
    ],
    [
      {
        comparison: FilterComparison.LessThanOrEqual,
        type: FieldType.Date,
        field: field[dateField],
        category,
        value: endDate,
      } satisfies IFieldFilter,
    ],
  ] satisfies IFieldFilter[][];
};

/**
 * Translates the quick filter into an advanced filter that can be sent to
 * the server.
 */
export const translateQuickFilterToAdvancedFilter = (
  quickFilters: IQuickFilter[]
): IFieldFilter[][] => {
  const allFilters: IFieldFilter[][] = [];
  quickFilters.forEach((quickFilter) => {
    const filterValue = quickFilter.value?.value || quickFilter.value;
    /**
     * Employee Fields
     */

    if (quickFilter.type === "asOf") {
      const formattedValue = {
        comparison: FilterComparison.LessThanOrEqual,
        type: FieldType.Date,
        value: filterValue,
        field: "as_of",
        category: "EMPLOYEE_FIELD",
      } satisfies IFieldFilter;
      allFilters.push([formattedValue]);
    }

    if (quickFilter.type === "employeeStatus") {
      const formattedValues = filterValue.map((val: string) => {
        return {
          comparison: FilterComparison.Equals,
          type: FieldType.EmployeeStatus,
          value: val,
          field: "Activation Status",
          category: "EMPLOYEE_FIELD",
        } satisfies IFieldFilter;
      });
      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }
    if (quickFilter.type === "department") {
      const groupFilterValue = filterValue;

      const formattedValues = groupFilterValue.map(
        (val: { value: string; label: string }) => {
          return {
            comparison: FilterComparison.Equals,
            type: FieldType.Department,
            value: val.value,
            field: "department",
            category: "EMPLOYEE_FIELD",
          } satisfies IFieldFilter;
        }
      );

      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }

    /**
     * Review fields
     */

    if (quickFilter.type === "reviewStatus") {
      const reviewStatusFilterValue = filterValue;
      const formattedValues = reviewStatusFilterValue.map((val: string) => {
        return {
          comparison: FilterComparison.Equals,
          type: FieldType.Text,
          value: val,
          field: "status",
          category: "REVIEW_FIELD",
        } satisfies IFieldFilter;
      });

      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }

    if (quickFilter.type === "reviewReportStatus") {
      const reviewReportStatusValue = filterValue;
      const formattedValues = reviewReportStatusValue.map((val: string) => {
        return {
          comparison: FilterComparison.Equals,
          type: FieldType.reviewReportStatus,
          value: val,
          field: "status",
          category: "REVIEW_REPORT_FIELD",
        } satisfies IFieldFilter;
      });

      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }

    if (quickFilter.type === "reviewCycleNames") {
      const reviewCycleFilter = filterValue;

      const formattedValues = reviewCycleFilter.map(
        (val: { value: string; label: string }) => {
          return {
            value: val.value,
            comparison: FilterComparison.Equals,
            field: "review_cycle",
            category: "REVIEW_CYCLE_FIELD",
            type: FieldType.Cycle,
          } satisfies IFieldFilter;
        }
      );

      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }

    if (quickFilter.type === "reviewFormNames") {
      const reviewFormFilter = filterValue;
      const formattedValues = reviewFormFilter.map(
        (val: { value: string; label: string }) => {
          return {
            value: val.value,
            comparison: FilterComparison.Equals,
            field: "name",
            category: "REVIEW_FORM_FIELD",
            type: FieldType.Text,
          } satisfies IFieldFilter;
        }
      );

      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }

    if (quickFilter.type === "subjectId") {
      const subjectIdFilterValues = filterValue;
      const formattedValues = subjectIdFilterValues.map(
        (val: { value: string; label: string }) => {
          return {
            value: val.value,
            comparison: FilterComparison.Equals,
            field: "subject",
            category: "SUBJECT",
            type: FieldType.Subject,
          } satisfies IFieldFilter;
        }
      );
      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }

    /**
     * Goal Fields
     */

    if (["goalStatus", "goalTransparency"].includes(quickFilter.type)) {
      const goalAssigneeFilterValues = filterValue;
      const formattedValues = goalAssigneeFilterValues.map((val: string) => {
        return {
          value: val,
          comparison: FilterComparison.Equals,
          field: quickFilter.type === "goalStatus" ? "status" : "transparency",
          category: "GOAL_FIELD",
          type: quickFilter.type as FieldType,
        } satisfies IFieldFilter;
      });

      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }
    if (quickFilter.type === "goalOutlook") {
      const goalOutlookFilterValues = filterValue;
      const formattedValues = goalOutlookFilterValues.map(
        (outlookObject: IGoalOutlookObject) => {
          return {
            value: outlookObject?.id,
            comparison: FilterComparison.Equals,
            field: "outlook",
            category: "GOAL_FIELD",
            type: FieldType.GoalOutlook,
          } satisfies IFieldFilter;
        }
      );

      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }
    if (quickFilter.type === "goalAssignee") {
      const goalAssigneeFilterValues = filterValue;
      const formattedValues = goalAssigneeFilterValues.map(
        (val: { value: string; label: string }) => {
          return {
            value: val.value,
            comparison: FilterComparison.Equals,
            field: "assignee",
            category: "GOAL_FIELD",
            type: FieldType.Person,
          } satisfies IFieldFilter;
        }
      );

      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }
    if (quickFilter.type === "goalCategories") {
      const goalCategoryFilterValues = filterValue;
      const formattedValues = goalCategoryFilterValues.map(
        (categoryObject: IGoalCategoriesObject) => {
          return {
            value: categoryObject?.value,
            comparison: FilterComparison.Equals,
            field: "categories",
            category: "GOAL_FIELD",
            type: FieldType.GoalCategories,
          } satisfies IFieldFilter;
        }
      );

      if (formattedValues.length > 0) {
        allFilters.push(formattedValues);
      }
    }

    /**
     * Date fields:
     */

    if (
      [
        "startedBetween",
        "completedBetween",
        "hiredBetween",
        "goalCreatedBetweenDate",
        "goalStartBetweenDate",
        "goalDueBetweenDate",
      ].includes(quickFilter.type)
    ) {
      const filterValue = quickFilter.value;

      // confirm quick filter value start and end are of date types
      if (
        !(filterValue.start instanceof Date) ||
        !(filterValue.end instanceof Date)
      ) {
        // throw new Error('Quick filter value start and end must be of date types');
        return [];
      }

      if (quickFilter.type === "startedBetween") {
        const startedBetweenFilters = quickDateFilterToAdvancedDateFilter(
          filterValue.start,
          filterValue.end,
          "startDate",
          "REVIEW_FIELD"
        );
        allFilters.push(...startedBetweenFilters);
      } else if (quickFilter.type === "completedBetween") {
        const completedBetweenFilters = quickDateFilterToAdvancedDateFilter(
          filterValue.start,
          filterValue.end,
          "completedDate",
          "REVIEW_FIELD"
        );
        allFilters.push(...completedBetweenFilters);
      } else if (quickFilter.type === "hiredBetween") {
        const hiredBetweenFilters = quickDateFilterToAdvancedDateFilter(
          filterValue.start,
          filterValue.end,
          "hiredBetweenDate",
          "EMPLOYEE_FIELD"
        );
        allFilters.push(...hiredBetweenFilters);
      } else if (
        [
          "goalCreatedBetweenDate",
          "goalStartBetweenDate",
          "goalDueBetweenDate",
        ].includes(quickFilter.type)
      ) {
        const goalDateFilters = quickDateFilterToAdvancedDateFilter(
          filterValue.start,
          filterValue.end,
          quickFilter.type as
            | "goalCreatedBetweenDate"
            | "goalStartBetweenDate"
            | "goalDueBetweenDate",
          "GOAL_FIELD"
        );
        allFilters.push(...goalDateFilters);
      }
    }
  });

  return allFilters;
};
