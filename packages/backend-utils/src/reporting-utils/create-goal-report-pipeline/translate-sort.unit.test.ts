import { ObjectId } from "mongodb";
import { Db } from "mongodb";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { GoalReportSort, GoalReportSummarizeByInput } from "@repo/models";

import {
  translateGoalReportSorts,
  validateGoalReportSorts,
} from "./translate-sort";

describe("translateGoalReportSorts", () => {
  describe("with default behavior", () => {
    it("should return default sort if no sorts are provided", () => {
      const sorts = null;
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ _id: -1 });
    });

    it("should return default sort if empty array is provided", () => {
      const sorts: GoalReportSort[] = [];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ _id: -1 });
    });
  });

  describe("with GOAL_FIELD type", () => {
    it("should translate assignee field without sub-field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["assignee"],
          direction: "asc",
          type: "GOAL_FIELD",
          name: "assignee",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "assignee.name": 1 });
    });

    it("should translate assignee field with sub-field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["assignee", "department"],
          direction: "desc",
          type: "GOAL_FIELD",
          name: "department",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "assignee.department.name": -1 });
    });

    it("should translate categories field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["categories"],
          direction: "asc",
          type: "GOAL_FIELD",
          name: "categories",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "categories.name": 1 });
    });

    it("should translate outlook field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["outlook"],
          direction: "desc",
          type: "GOAL_FIELD",
          name: "outlook",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "outlook.name": -1 });
    });

    it("should translate alignment field without sub-field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["alignment"],
          direction: "asc",
          type: "GOAL_FIELD",
          name: "alignment",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "alignment.name": 1 });
    });

    it("should translate alignment field with sub-field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["alignment", "strategic"],
          direction: "desc",
          type: "GOAL_FIELD",
          name: "strategic",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "alignment.strategic.name": -1 });
    });

    it("should translate summarizeBy field with date type for goal field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["summarizeBy", "GOAL_FIELD", "end_date", "name"],
          direction: "asc",
          type: "GOAL_FIELD",
          name: "end_date",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "summarizeBy.GOAL_FIELD.end_date._id": 1 });
    });

    it("should translate summarizeBy field with date type for employee field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["summarizeBy", "EMPLOYEE_FIELD", "hire_date", "name"],
          direction: "asc",
          type: "EMPLOYEE_FIELD",
          name: "hire_date",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "summarizeBy.EMPLOYEE_FIELD.hire_date._id": 1 });
    });

    it("should translate summarizeBy field with non-date type", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["summarizeBy", "GOAL_FIELD", "status"],
          direction: "desc",
          type: "GOAL_FIELD",
          name: "status",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "summarizeBy.GOAL_FIELD.status": -1 });
    });

    it("should translate default goal field path", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["custom", "field"],
          direction: "asc",
          type: "GOAL_FIELD",
          name: "custom_field",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "custom.field": 1 });
    });
  });

  describe("with EMPLOYEE_FIELD type", () => {
    it("should translate Manager field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["manager"],
          direction: "asc",
          type: "EMPLOYEE_FIELD",
          name: "Manager",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "assignee.manager.name": 1 });
    });

    it("should translate Group field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["group"],
          direction: "desc",
          type: "EMPLOYEE_FIELD",
          name: "Group",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "assignee.group.name": -1 });
    });

    it("should translate custom employee field", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["custom", "employee", "field"],
          direction: "asc",
          type: "EMPLOYEE_FIELD",
          name: "custom_employee_field",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "custom.employee.field": 1 });
    });
  });

  describe("with isSummaryView", () => {
    it("should omit .name suffix in summary view for assignee", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["assignee"],
          direction: "asc",
          type: "GOAL_FIELD",
          name: "assignee",
        },
      ];
      const result = translateGoalReportSorts(sorts, true);
      expect(result).toEqual({ assignee: 1 });
    });

    it("should omit .name suffix in summary view for categories", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["categories"],
          direction: "desc",
          type: "GOAL_FIELD",
          name: "categories",
        },
      ];
      const result = translateGoalReportSorts(sorts, true);
      expect(result).toEqual({ categories: -1 });
    });

    it("should omit .name suffix in summary view for Manager", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["manager"],
          direction: "asc",
          type: "EMPLOYEE_FIELD",
          name: "Manager",
        },
      ];
      const result = translateGoalReportSorts(sorts, true);
      expect(result).toEqual({ "assignee.manager": 1 });
    });
  });

  describe("with multiple sorts", () => {
    it("should translate multiple sorts in correct order", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["assignee"],
          direction: "asc",
          type: "GOAL_FIELD",
          name: "assignee",
        },
        {
          fieldPath: ["categories"],
          direction: "desc",
          type: "GOAL_FIELD",
          name: "categories",
        },
        {
          fieldPath: ["manager"],
          direction: "asc",
          type: "EMPLOYEE_FIELD",
          name: "Manager",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({
        "assignee.name": 1,
        "categories.name": -1,
        "assignee.manager.name": 1,
      });
    });
  });

  describe("with case-insensitive direction", () => {
    it("should handle uppercase ASC direction", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["assignee"],
          direction: "ASC" as any,
          type: "GOAL_FIELD",
          name: "assignee",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "assignee.name": 1 });
    });

    it("should handle uppercase DESC direction", () => {
      const sorts: GoalReportSort[] = [
        {
          fieldPath: ["assignee"],
          direction: "DESC" as any,
          type: "GOAL_FIELD",
          name: "assignee",
        },
      ];
      const result = translateGoalReportSorts(sorts, false);
      expect(result).toEqual({ "assignee.name": -1 });
    });
  });
});

describe("validateGoalReportSorts", () => {
  let db: Db;
  const company_id = new ObjectId();

  beforeAll(() => {
    db = {} as Db;
  });

  it("should return true if no sorts are provided", async () => {
    const sorts: GoalReportSort[] | null = null;
    const result = await validateGoalReportSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return true if only one sort is provided", async () => {
    const sorts: GoalReportSort[] = [
      {
        type: "GOAL_FIELD",
        fieldPath: ["assignee"],
        direction: "asc",
        name: "assignee",
      },
    ];
    const result = await validateGoalReportSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return true if all sorts are not employee type fields", async () => {
    const sorts: GoalReportSort[] = [
      {
        type: "GOAL_FIELD",
        fieldPath: ["assignee"],
        direction: "asc",
        name: "assignee",
      },
      {
        type: "GOAL_FIELD",
        fieldPath: ["categories"],
        direction: "desc",
        name: "categories",
      },
    ];
    const result = await validateGoalReportSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return true if there are no employee fields", async () => {
    const sorts: GoalReportSort[] = [
      {
        type: "GOAL_FIELD",
        fieldPath: ["assignee"],
        direction: "asc",
        name: "assignee",
      },
      {
        type: "GOAL_FIELD",
        fieldPath: ["categories"],
        direction: "desc",
        name: "categories",
      },
      {
        type: "GOAL_FIELD",
        fieldPath: ["outlook"],
        direction: "asc",
        name: "outlook",
      },
    ];
    const result = await validateGoalReportSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return true if there is one employee field and no people type custom fields", async () => {
    db.collection = vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(0), // 0 people type fields
    });

    const sorts: GoalReportSort[] = [
      {
        type: "GOAL_FIELD",
        fieldPath: ["assignee"],
        direction: "asc",
        name: "assignee",
      },
      {
        type: "EMPLOYEE_FIELD",
        fieldPath: ["department"],
        direction: "desc",
        name: "department",
      },
    ];
    const result = await validateGoalReportSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return true if there is one employee field that is a people type but no other people fields", async () => {
    db.collection = vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(1), // 1 people type field
    });

    const sorts: GoalReportSort[] = [
      {
        type: "GOAL_FIELD",
        fieldPath: ["assignee"],
        direction: "asc",
        name: "assignee",
      },
      {
        type: "EMPLOYEE_FIELD",
        fieldPath: ["team_members"],
        direction: "desc",
        name: "team_members",
      },
    ];
    const result = await validateGoalReportSorts(db, company_id, sorts);
    expect(result).toBe(true);
  });

  it("should return false if there are multiple array fields", async () => {
    db.collection = vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(1), // 1 people type fields
    });

    const sorts: GoalReportSort[] = [
      {
        type: "GOAL_FIELD",
        fieldPath: ["categories"],
        direction: "asc",
        name: "categories",
      },
      {
        type: "EMPLOYEE_FIELD",
        fieldPath: ["team_members"],
        direction: "desc",
        name: "team_members",
      },
    ];
    const result = await validateGoalReportSorts(db, company_id, sorts);
    expect(result).toBe(false);
  });

  it("should check only employee field custom field names in database", async () => {
    const mockCollection = {
      count: vi.fn().mockResolvedValue(0),
    };
    db.collection = vi.fn().mockReturnValue(mockCollection);

    const sorts: GoalReportSort[] = [
      {
        type: "GOAL_FIELD",
        fieldPath: ["assignee"],
        direction: "asc",
        name: "assignee",
      },
      {
        type: "EMPLOYEE_FIELD",
        fieldPath: ["custom", "field1"],
        direction: "desc",
        name: "field1",
      },
      {
        type: "EMPLOYEE_FIELD",
        fieldPath: ["custom", "field2"],
        direction: "asc",
        name: "field2",
      },
    ];

    await validateGoalReportSorts(db, company_id, sorts);

    expect(db.collection).toHaveBeenCalledWith("custom_fields");
    expect(mockCollection.count).toHaveBeenCalledWith({
      name: { $in: ["field1", "field2"] },
      company_id,
      type: "people",
    });
  });
});
