import { ObjectId } from "mongodb";
import { Db } from "mongodb";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { IReviewReportSort } from "@repo/models";

import { Sort } from "./types";

import {
  createOrderedSortStage,
  translateSorts,
  validateSorts,
} from "./translate-sort";

describe("createOrderedSortStage", () => {
  it("should create an ordered sort stage", () => {
    const sorts: Sort[] = [
      { name: "field1", direction: 1 },
      { name: "field2", direction: -1 },
    ];
    const result = createOrderedSortStage(sorts);
    expect(result).toEqual({ field1: 1, field2: -1 });
  });

  it("should return an empty object if no sorts are provided", () => {
    const sorts: Sort[] = [];
    const result = createOrderedSortStage(sorts);
    expect(result).toEqual({});
  });
});

describe("translateSorts", () => {
  it("should translate sorts", () => {
    const sorts: IReviewReportSort[] = [
      {
        fieldPath: ["questions", "field1"],
        direction: "asc",
        type: "UNIQUE_QUESTION",
        name: "field1",
      },
      {
        fieldPath: ["review", "subject"],
        direction: "desc",
        type: "REVIEW_FORM_FIELD",
        name: "subject",
      },
    ];
    const result = translateSorts(sorts);
    expect(result).toEqual({
      "questions_map.field1": 1,
      "review.subject.name": -1,
    });
  });

  it("should return default if no sorts are provided", () => {
    const sorts = null;
    const result = translateSorts(sorts);
    expect(result).toEqual({ _id: -1 });
  });
});

describe("validateSorts", () => {
  let db: Db;
  const company_id = new ObjectId();

  beforeAll(() => {
    db = {} as Db;
  });

  it("should return true if no sorts are provided", async () => {
    const sorts: IReviewReportSort[] | null = null;
    const result = await validateSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return true if only one sort is provided", async () => {
    const sorts: IReviewReportSort[] = [
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["field1"],
        direction: "asc",
        name: "field1",
      },
    ];
    const result = await validateSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return true if all sorts are not people type fields", async () => {
    const sorts: IReviewReportSort[] = [
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["field1"],
        direction: "asc",
        name: "field1",
      },
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["field2"],
        direction: "desc",
        name: "field2",
      },
    ];
    const result = await validateSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return false if there are multiple people type fields and no employee field", async () => {
    const sorts: IReviewReportSort[] = [
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["field1"],
        direction: "asc",
        name: "field1",
      },
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["signers"],
        direction: "desc",
        name: "signers",
      },
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["authors"],
        direction: "asc",
        name: "authors",
      },
    ];
    const result = await validateSorts(db, company_id, sorts);
    expect(result).toBe(false);
  });

  it("should return true if there is one people review form field and no employee people type fields", async () => {
    db.collection = vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(0), // 0 people type fields
    });

    const sorts: IReviewReportSort[] = [
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["field1"],
        direction: "asc",
        name: "field1",
      },
      {
        type: "EMPLOYEE_FIELD",
        fieldPath: ["field2"],
        direction: "desc",
        name: "field2",
      },
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["signers"],
        direction: "asc",
        name: "signers",
      },
    ];
    const result = await validateSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return false if there are multiple people type fields across review form and employee fields", async () => {
    db.collection = vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(1), // 1 people type field
    });

    const sorts: IReviewReportSort[] = [
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["field1"],
        direction: "asc",
        name: "field1",
      },
      {
        type: "EMPLOYEE_FIELD",
        fieldPath: ["field2"],
        direction: "desc",
        name: "field2",
      },
      {
        type: "REVIEW_FORM_FIELD",
        fieldPath: ["signers"],
        direction: "asc",
        name: "signers",
      },
      {
        type: "EMPLOYEE_FIELD",
        fieldPath: ["field3"],
        direction: "asc",
        name: "field3",
      },
    ];
    const result = await validateSorts(db, company_id, sorts);
    expect(result).toBe(false);
  });
});
