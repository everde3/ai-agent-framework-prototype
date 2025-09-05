import { describe, expect, it } from "vitest";

import { ReviewReportStatusFilters, ReviewStatusFilters } from "@repo/models";

import { translateQuickFilterToAdvancedFilter } from "./quick-filter-to-advance-filter";

describe("quick filters to advanced filters function", () => {
  it(" should translate reviewStatus and reviewReportStatus quick filters ", () => {
    const input = [
      {
        type: "reviewStatus",
        value: {
          value: ["Completed"] as ReviewStatusFilters[],
        },
      },
      {
        type: "reviewReportStatus",
        value: {
          value: ["completed"] as ReviewReportStatusFilters[],
        },
      },
    ];

    const expectedOutput = [
      [
        {
          comparison: "eq",
          type: "text",
          value: "Completed",
          field: "status",
          category: "REVIEW_FIELD",
        },
      ],
      [
        {
          comparison: "eq",
          type: "reviewReportStatus",
          value: "completed",
          field: "status",
          category: "REVIEW_REPORT_FIELD",
        },
      ],
    ];

    const result = translateQuickFilterToAdvancedFilter(input);

    expect(result).toEqual(expectedOutput);
  });

  it("should translates multiple reviewStatus values in a single quick filter", () => {
    const input = [
      {
        type: "reviewStatus",
        value: {
          value: ["Completed", "Active"] as ReviewStatusFilters[],
        },
      },
    ];

    const expectedOutput = [
      [
        {
          comparison: "eq",
          type: "text",
          value: "Completed",
          field: "status",
          category: "REVIEW_FIELD",
        },
        {
          comparison: "eq",
          type: "text",
          value: "Active",
          field: "status",
          category: "REVIEW_FIELD",
        },
      ],
    ];

    const result = translateQuickFilterToAdvancedFilter(input);

    expect(result).toEqual(expectedOutput);
  });
});
