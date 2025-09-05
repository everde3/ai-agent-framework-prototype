// Dependencies
import { addDays, addMonths, addYears, getDayOfYear } from "date-fns";
import { ObjectId } from "mongodb";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { ICohortQueryModel, ICohortQueryValue } from "@repo/models";

import {
  translateCohortQueryToMongoQuery,
  toMongoComparator,
  toFieldValue,
  isPlainObject,
} from "..";

describe.concurrent("translateCohortQueryToMongoQuery()", () => {
  it("can translate 'or' conditions", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "eq",
              value: "foo",
            },
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "eq",
              value: "bar",
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $eq: "foo",
              },
            },
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $eq: "bar",
              },
            },
          ],
        },
      ],
    });
  });

  it("can translate multiple sets of 'or' conditions", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "eq",
              value: "foo",
            },
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "eq",
              value: "bar",
            },
          ],
        },
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "eq",
              value: "foo",
            },
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "eq",
              value: "bar",
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $eq: "foo",
              },
            },
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $eq: "bar",
              },
            },
          ],
        },
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $eq: "foo",
              },
            },
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $eq: "bar",
              },
            },
          ],
        },
      ],
    });
  });

  it("can translate relative past dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());

    const DAYS = -180;

    const queryDate = new Date();
    queryDate.setHours(0, 0, 0, 0);

    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "gte",
              value: {
                relative_date: DAYS,
                relative_date_unit: "days",
              },
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $gte: addDays(queryDate, DAYS),
              },
            },
          ],
        },
      ],
    });

    vi.useRealTimers();
  });

  it("can translate relative future dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());

    const DAYS = 180;

    const queryDate = new Date();
    queryDate.setHours(0, 0, 0, 0);

    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "gte",
              value: {
                relative_date: DAYS,
                relative_date_unit: "days",
              },
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $gte: addDays(queryDate, DAYS),
              },
            },
          ],
        },
      ],
    });

    vi.useRealTimers();
  });

  it("can translate relative dates using months as the unit", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());

    const MONTHS = 2;

    const queryDate = new Date();
    queryDate.setHours(0, 0, 0, 0);

    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "gte",
              value: {
                relative_date: MONTHS,
                relative_date_unit: "months",
              },
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $gte: addMonths(queryDate, MONTHS),
              },
            },
          ],
        },
      ],
    });

    vi.useRealTimers();
  });

  it("can translate relative dates using years as the unit", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());

    const YEARS = 2;

    const queryDate = new Date();
    queryDate.setHours(0, 0, 0, 0);

    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "gte",
              value: {
                relative_date: YEARS,
                relative_date_unit: "years",
              },
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $gte: addYears(queryDate, YEARS),
              },
            },
          ],
        },
      ],
    });

    vi.useRealTimers();
  });

  it("can translate relative dates using days if the unit is undefined for whatever reason", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date());

    const DAYS = 2;

    const queryDate = new Date();
    queryDate.setHours(0, 0, 0, 0);

    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "gte",
              value: {
                relative_date: DAYS,
              },
            },
          ],
        },
      ],
    } as ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $gte: addDays(queryDate, DAYS),
              },
            },
          ],
        },
      ],
    });

    vi.useRealTimers();
  });

  it("can handle static dates", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "eq",
              value: {
                date: "2021-01-01",
              },
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $eq: new Date("2021-01-01"),
              },
            },
          ],
        },
      ],
    });
  });

  it("can handle object ids (managers, contributors, etc.)", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "eq",
              value: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $eq: new ObjectId("530fbba4dfbd9b96fcc03947"),
              },
            },
          ],
        },
      ],
    });
  });

  it("can handle null values", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03947",
              },
              comparator: "eq",
              value: null,
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03947"),
              value: {
                $eq: null,
              },
            },
          ],
        },
      ],
    });
  });

  it("can translate regex contains values", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03942",
              },
              comparator: "regex",
              value: "ane",
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03942"),
              value: {
                $regex: "ane",
                $options: "i",
              },
            },
          ],
        },
      ],
    });
  });

  it("can translate regex does not contain", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03942",
              },
              comparator: "not_regex",
              value: "ane",
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03942"),
              value: {
                $not: {
                  $regex: "ane",
                  $options: "i",
                },
              },
            },
          ],
        },
      ],
    });
  });

  it("can translate regex starts with", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03942",
              },
              comparator: "regex",
              value: "^ane",
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03942"),
              value: {
                $regex: "^ane",
                $options: "i",
              },
            },
          ],
        },
      ],
    });
  });

  it("can translate regex ends with", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03942",
              },
              comparator: "regex",
              value: "ane$",
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03942"),
              value: {
                $regex: "ane$",
                $options: "i",
              },
            },
          ],
        },
      ],
    });
  });

  it("can translate regex does not start with", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03942",
              },
              comparator: "not_regex",
              value: "^ane",
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03942"),
              value: {
                $not: {
                  $regex: "^ane",
                  $options: "i",
                },
              },
            },
          ],
        },
      ],
    });
  });

  it("can translate regex does not end with", () => {
    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03942",
              },
              comparator: "not_regex",
              value: "ane$",
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03942"),
              value: {
                $not: {
                  $regex: "ane$",
                  $options: "i",
                },
              },
            },
          ],
        },
      ],
    });
  });

  it("can translate equal to anniversary dates", () => {
    const now = new Date("2024-01-01");
    vi.useFakeTimers({ now });

    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03942",
              },
              comparator: "eq_anniversary",
              value: {
                anniversary_date: 53, // Value should get ignored
                anniversary_date_unit: "months",
              },
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03942"),
              value: {
                type: "date-expression",
                expression: {
                  $and: [
                    {
                      $eq: [
                        {
                          $month: {
                            $arrayElemAt: [
                              "$objects.530fbba4dfbd9b96fcc03942",
                              0,
                            ],
                          },
                        },
                        {
                          $month: {
                            date: now,
                          },
                        },
                      ],
                    },
                    {
                      $eq: [
                        {
                          $dayOfMonth: {
                            $arrayElemAt: [
                              "$objects.530fbba4dfbd9b96fcc03942",
                              0,
                            ],
                          },
                        },
                        {
                          $dayOfMonth: {
                            date: now,
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    });

    vi.useRealTimers();
  });

  it("can translate after anniversary dates", () => {
    const now = new Date("2024-01-01");
    vi.useFakeTimers({ now });

    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03942",
              },
              comparator: "after_anniversary",
              value: {
                anniversary_date: 1,
                anniversary_date_unit: "months",
              },
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    // Get current date and add 1 month to it
    const calculatedValue = addMonths(new Date(), 1);

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03942"),
              value: {
                type: "date-expression",
                expression: {
                  $and: [
                    {
                      $eq: [
                        {
                          $month: {
                            $arrayElemAt: [
                              "$objects.530fbba4dfbd9b96fcc03942",
                              0,
                            ],
                          },
                        },
                        {
                          $month: {
                            date: calculatedValue,
                          },
                        },
                      ],
                    },
                    {
                      $eq: [
                        {
                          $dayOfMonth: {
                            $arrayElemAt: [
                              "$objects.530fbba4dfbd9b96fcc03942",
                              0,
                            ],
                          },
                        },
                        {
                          $dayOfMonth: {
                            date: calculatedValue,
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    });

    vi.useRealTimers();
  });

  it("can translate before anniversary dates", () => {
    const now = new Date("2024-01-01");
    vi.useFakeTimers({ now });

    const query = {
      and: [
        {
          or: [
            {
              field: {
                oid: "530fbba4dfbd9b96fcc03942",
              },
              comparator: "before_anniversary",
              value: {
                anniversary_date: 1,
                anniversary_date_unit: "months",
              },
            },
          ],
        },
      ],
    } satisfies ICohortQueryModel;

    // Get current date and subtract 1 month from it
    const calculatedValue = addMonths(new Date(), -1);

    const response = translateCohortQueryToMongoQuery(query);

    expect(response).toStrictEqual({
      $and: [
        {
          $or: [
            {
              field: new ObjectId("530fbba4dfbd9b96fcc03942"),
              value: {
                type: "date-expression",
                expression: {
                  $and: [
                    {
                      $eq: [
                        {
                          $month: {
                            $arrayElemAt: [
                              "$objects.530fbba4dfbd9b96fcc03942",
                              0,
                            ],
                          },
                        },
                        {
                          $month: {
                            date: calculatedValue,
                          },
                        },
                      ],
                    },
                    {
                      $eq: [
                        {
                          $dayOfMonth: {
                            $arrayElemAt: [
                              "$objects.530fbba4dfbd9b96fcc03942",
                              0,
                            ],
                          },
                        },
                        {
                          $dayOfMonth: {
                            date: calculatedValue,
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    });

    vi.useRealTimers();
  });
});

describe("toMongoComparator function", () => {
  const referenceDate = new Date("2024-12-03T20:18:16.565Z");

  it("handles 'eq' operator correctly", () => {
    const result = toMongoComparator("eq", 5, new ObjectId());
    expect(result).toEqual({ $eq: 5 });
  });

  it("handles 'eq' operator for relative_date correctly", () => {
    vi.useFakeTimers();

    const queryDate = new Date();
    queryDate.setHours(0, 0, 0, 0);

    const fieldId = new ObjectId();
    const result = toMongoComparator(
      "eq",
      { relative_date: 5, relative_date_unit: "days" },
      fieldId
    );
    expect(result).toEqual({
      $eq: addDays(queryDate, 5),
    });

    vi.useRealTimers();
  });

  it("handles 'ne' operator correctly", () => {
    const result = toMongoComparator("ne", "test", new ObjectId());
    expect(result).toEqual({ $ne: "test" });
  });

  it("handles 'gt' operator correctly", () => {
    const result = toMongoComparator("gt", 10, new ObjectId());
    expect(result).toEqual({ $gt: 10 });
  });

  it("handles 'lt' operator correctly", () => {
    const result = toMongoComparator(
      "lt",
      { date: referenceDate.toISOString() },
      new ObjectId()
    );
    expect(result).toEqual({ $lt: referenceDate });
  });

  it("handles 'gte' operator correctly", () => {
    const result = toMongoComparator("gte", true, new ObjectId());
    expect(result).toEqual({ $gte: true });
  });

  it("handles 'lte' operator correctly", () => {
    const result = toMongoComparator("lte", null, new ObjectId());
    expect(result).toEqual({ $lte: null });
  });

  it("handles 'in' operator correctly", () => {
    const result = toMongoComparator(
      "in",
      [1, 2, 3] as unknown as ICohortQueryValue,
      new ObjectId()
    );
    expect(result).toEqual({ $in: [1, 2, 3] });
  });

  it("handles 'nin' operator correctly", () => {
    const result = toMongoComparator(
      "nin",
      ["a", "b", "c"] as unknown as ICohortQueryValue,
      new ObjectId()
    );
    expect(result).toEqual({ $nin: ["a", "b", "c"] });
  });

  it("handles 'regex' operator correctly", () => {
    const result = toMongoComparator("regex", "pattern", new ObjectId());
    expect(result).toEqual({ $regex: "pattern", $options: "i" });
  });

  it("handles 'not_regex' operator correctly", () => {
    const result = toMongoComparator("not_regex", "pattern", new ObjectId());
    expect(result).toEqual({ $not: { $regex: "pattern", $options: "i" } });
  });

  it("handles anniversary operators correctly", () => {
    const fieldId = new ObjectId();
    vi.useFakeTimers({ now: referenceDate });

    const expectedResult = {
      type: "date-expression",
      expression: {
        $and: [
          {
            $eq: [
              {
                $month: {
                  $arrayElemAt: [`$objects.${fieldId}`, 0],
                },
              },
              {
                $month: {
                  date: referenceDate,
                },
              },
            ],
          },
          {
            $eq: [
              {
                $dayOfMonth: {
                  $arrayElemAt: [`$objects.${fieldId}`, 0],
                },
              },
              {
                $dayOfMonth: {
                  date: referenceDate,
                },
              },
            ],
          },
        ],
      },
    };

    const resultGte = toMongoComparator(
      "after_anniversary",
      { anniversary_date: 0 } as ICohortQueryValue,
      fieldId
    );
    const resultLte = toMongoComparator(
      "before_anniversary",
      { anniversary_date: 0 } as ICohortQueryValue,
      fieldId
    );
    const resultEq = toMongoComparator(
      "eq_anniversary",
      { anniversary_date: 0 } as ICohortQueryValue,
      fieldId
    );

    expect(resultGte).toEqual(expectedResult);
    expect(resultLte).toEqual(expectedResult);
    expect(resultEq).toEqual(expectedResult);

    vi.useRealTimers();
  });

  it("handles anniversary operators correctly for Feb 28th on a leap year", () => {
    const fieldId = new ObjectId();

    const feb28Date = new Date("2024-02-28T12:00:00.000Z");
    vi.useFakeTimers({ now: feb28Date });

    const expectedResult = {
      type: "date-expression",
      expression: {
        $and: [
          {
            $eq: [
              {
                $month: {
                  $arrayElemAt: [`$objects.${fieldId}`, 0],
                },
              },
              {
                $month: {
                  date: feb28Date,
                },
              },
            ],
          },
          {
            $eq: [
              {
                $dayOfMonth: {
                  $arrayElemAt: [`$objects.${fieldId}`, 0],
                },
              },
              {
                $dayOfMonth: {
                  date: feb28Date,
                },
              },
            ],
          },
        ],
      },
    };

    const resultGte = toMongoComparator(
      "after_anniversary",
      { anniversary_date: 0 } as ICohortQueryValue,
      fieldId
    );
    const resultLte = toMongoComparator(
      "before_anniversary",
      { anniversary_date: 0 } as ICohortQueryValue,
      fieldId
    );
    const resultEq = toMongoComparator(
      "eq_anniversary",
      { anniversary_date: 0 } as ICohortQueryValue,
      fieldId
    );

    expect(resultGte).toEqual(expectedResult);
    expect(resultLte).toEqual(expectedResult);
    expect(resultEq).toEqual(expectedResult);

    vi.useRealTimers();
  });

  it("handles anniversary operators correctly for Feb 28th on a non-leap year", () => {
    const fieldId = new ObjectId();

    const feb28Date = new Date("2023-02-28T12:00:00.000Z");
    vi.useFakeTimers({ now: feb28Date });

    const expectedResult = {
      type: "date-expression",
      expression: {
        $and: [
          {
            $eq: [
              {
                $month: {
                  $arrayElemAt: [`$objects.${fieldId}`, 0],
                },
              },
              {
                $month: {
                  date: feb28Date,
                },
              },
            ],
          },
          {
            $or: [
              {
                $eq: [
                  {
                    $dayOfMonth: {
                      $arrayElemAt: [`$objects.${fieldId}`, 0],
                    },
                  },
                  28,
                ],
              },
              {
                $eq: [
                  {
                    $dayOfMonth: {
                      $arrayElemAt: [`$objects.${fieldId}`, 0],
                    },
                  },
                  29,
                ],
              },
            ],
          },
        ],
      },
    };

    const resultGte = toMongoComparator(
      "after_anniversary",
      { anniversary_date: 0 } as ICohortQueryValue,
      fieldId
    );
    const resultLte = toMongoComparator(
      "before_anniversary",
      { anniversary_date: 0 } as ICohortQueryValue,
      fieldId
    );
    const resultEq = toMongoComparator(
      "eq_anniversary",
      { anniversary_date: 0 } as ICohortQueryValue,
      fieldId
    );

    expect(resultGte).toEqual(expectedResult);
    expect(resultLte).toEqual(expectedResult);
    expect(resultEq).toEqual(expectedResult);

    vi.useRealTimers();
  });

  it("throws an error for unknown operators", () => {
    expect(() =>
      toMongoComparator("invalid_operator" as any, 5, new ObjectId())
    ).toThrow("Unknown operator: invalid_operator");
  });
});

describe("toFieldValue function", () => {
  const referenceDate = new Date();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(referenceDate);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("handles null value", () => {
    const result = toFieldValue(null);
    expect(result).toBeNull();
  });

  it("handles date value", () => {
    const dateString = "2024-09-12T12:00:00Z";
    const value = { date: dateString };
    const expectedDate = new Date(dateString);
    const result = toFieldValue(value);

    expect(result).toEqual(expectedDate);
  });

  it("handles oid value", () => {
    const oidString = "64ff67a0b832c3e78a63f4a1";
    const value = { oid: oidString };
    const expectedObjectId = new ObjectId(oidString);
    const result = toFieldValue(value);

    expect(result).toEqual(expectedObjectId);
  });

  it("returns other values as-is", () => {
    const value = "some string";
    const result = toFieldValue(value);
    expect(result).toBe(value);
  });
});

describe.concurrent("isPlainObject function", () => {
  it("returns true for a plain object", () => {
    const obj = {};
    expect(isPlainObject(obj)).toBe(true);
  });

  it("returns false for an array", () => {
    const arr: any[] = [];
    expect(isPlainObject(arr)).toBe(false);
  });

  it("returns false for a function", () => {
    const func = () => {};
    expect(isPlainObject(func)).toBe(false);
  });

  it("returns false for a date", () => {
    const date = new Date();
    expect(isPlainObject(date)).toBe(false);
  });

  it("returns false for a null value", () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it("returns false for an undefined value", () => {
    expect(isPlainObject(undefined)).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isPlainObject(123)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isPlainObject("hello")).toBe(false);
  });

  it("returns false for a boolean", () => {
    expect(isPlainObject(true)).toBe(false);
  });
});
