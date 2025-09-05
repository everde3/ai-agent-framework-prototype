import { Db, ObjectId } from "mongodb";

import { IReviewReportSort } from "@repo/models";

import { MongoSort, ReviewReportSummarizeByInput, Sort } from "./types";

/**
 * takes an array of sorts and generates a sort pipeline in the order of the
 * array. since order is not guaranteed in an object, a map is used here to
 * ensure the correct order.
 *
 * This is probably playing it too safe but Mongo should have made a good way
 * to do this. Shame on them.
 */
// reporting-webserver/src/utils
export const createOrderedSortStage = (sorts: Sort[]): MongoSort => {
  // first create the ordered map
  const sortMap = sorts.reduce((acc, sort) => {
    acc.set(sort.name, sort.direction);
    return acc;
  }, new Map<string, Sort["direction"]>());

  // convert map to an object
  return Object.fromEntries(sortMap);
};

//reporting-webserver/src/apollo/data
const generateSortPath = (
  sort: IReviewReportSort,
  summarizeBy?: ReviewReportSummarizeByInput[]
) => {
  const summarizeByInputs = summarizeBy || [];
  const fieldGroup = sort.fieldPath[0];
  const fieldName = sort.fieldPath[1];

  switch (fieldGroup) {
    case "questions": {
      const questionPath = sort.fieldPath.slice(1).join(".");
      return `questions_map.${questionPath}`;
    }

    case "groupedQuestions": {
      const questionGroupPath = sort.fieldPath.slice(1).join(".");
      return `question_group_map.${questionGroupPath}`;
    }

    case "review_form": {
      if (fieldName !== "name") {
        const reviewFormPath = sort.fieldPath.slice(1).join(".");
        return `review_report.${reviewFormPath}`;
      }
      break;
    }
    case "review": {
      if (fieldName === "subject") {
        // we want to sort on the name property not the subject
        // object
        const reviewPath = sort.fieldPath.join(".");
        return `${reviewPath}.name`;
      }
      if (fieldName === "forms_awaiting_approval") {
        return "forms_awaiting_approval_count";
      }
      break;
    }
    case "review_cycle": {
      if (fieldName === "name") {
        return "review_cycle.name";
      }
      if (fieldName === "template") {
        return "review_cycle.template.name";
      }
      if (fieldName === "group") {
        return "review_cycle.group.name";
      }
      break;
    }
    case "subject": {
      if (fieldName === "Group") {
        return "subject.Group.name";
      }
      if (fieldName === "Manager") {
        return "subject.Manager.name";
      }
      if (fieldName === "Employee") {
        return "subject.Employee.name";
      }
      break;
    }
    case "summarizeBy": {
      if (summarizeByInputs.length > 0) {
        const fieldGroup = sort.fieldPath[1];
        const fieldName = sort.fieldPath[2];
        const summarizeByObject = summarizeByInputs.find(
          (field) => field.type === fieldGroup && field.name === fieldName
        );

        if (summarizeByObject?.fieldType === "date") {
          return `summarizeBy.${fieldGroup}.${fieldName}._id`;
        }
      }
      break;
    }
  }

  return sort.fieldPath.join(".");
};

//reporting-webserver/src/apollo/data
export const translateSorts = (
  sorts: IReviewReportSort[] | null,
  summarizeBy?: ReviewReportSummarizeByInput[]
): Record<string, 1 | -1> => {
  if (sorts === null || sorts.length === 0) {
    return {
      _id: -1,
    };
  }

  if (sorts?.length) {
    const translatedSorts: { name: string; direction: 1 | -1 }[] = sorts.map(
      (sort) => {
        const fieldPath = generateSortPath(sort, summarizeBy);
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

const reviewFormPeopleFields = ["signers", "authors"];
const fieldTypesRequireChecking = ["REVIEW_FORM_FIELD", "EMPLOYEE_FIELD"];
/**
 * If we have more than one sort, we need to confirm none of them
 * are "people" type fields (array fields in mongodb), because mongodb
 * does not support parallel array fields as sort keys.
 * @param sorts sorts to validate
 * @returns true if sorts are valid
 */
export const validateSorts = async (
  db: Db,
  company_id: ObjectId,
  sorts: IReviewReportSort[] | null
): Promise<boolean> => {
  if (sorts === null || sorts.length <= 1) {
    return true;
  }

  if (sorts.every((sort) => !fieldTypesRequireChecking.includes(sort.type))) {
    return true;
  }

  const reviewFormPeopleFieldCount = sorts.filter(
    (sort) =>
      sort.type === "REVIEW_FORM_FIELD" &&
      reviewFormPeopleFields.includes(sort.fieldPath[sort.fieldPath.length - 1])
  ).length;

  const hasEmployeeField = sorts.some((sort) => sort.type === "EMPLOYEE_FIELD");

  if (!hasEmployeeField) {
    if (reviewFormPeopleFieldCount > 1) {
      return false;
    }
    return true;
  }

  // at this point we need to look up the custom fields to know which sorts are for people fields
  const customFieldNames = sorts
    .filter((sort) => sort.type === "EMPLOYEE_FIELD")
    .map((sort) => sort.fieldPath[sort.fieldPath.length - 1]);
  const customFieldPeopleFieldCount = await db
    .collection("custom_fields")
    .count({
      name: { $in: customFieldNames },
      company_id,
      type: "people",
    });

  const totalPeopleFieldCount =
    reviewFormPeopleFieldCount + customFieldPeopleFieldCount;

  if (totalPeopleFieldCount > 1) {
    return false;
  }

  return true;
};
