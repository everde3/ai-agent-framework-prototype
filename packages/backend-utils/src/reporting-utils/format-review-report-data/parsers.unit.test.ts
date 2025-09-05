import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { SummarizeByRowTypes, SummaryFunction } from "@repo/models";

import {
  selectColumnSummaryOperation,
  selectGroupedQuestionSummaryOperation,
  selectSingleQuestionSummaryOperation,
  selectSummarizeByColumnDisplayName,
  selectSummarizeByValue,
} from "./parsers";

describe("csv summary view parsers", () => {
  it("select summarize by value", () => {
    const input = {
      _id: new ObjectId(),
      name: "abc 123",
    };

    const result = selectSummarizeByValue(input);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(input.name);
  });
  it("select summarize by column display name - employee - manager", () => {
    const type = SummarizeByRowTypes.EMPLOYEE;
    const summaryColumnName = "manager";

    const expected = "Manager";

    const result = selectSummarizeByColumnDisplayName(type, summaryColumnName);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expected);
  });
  it("select summarize by column display name - cycle - status", () => {
    const type = SummarizeByRowTypes.REVIEW_CYCLE;
    const summaryColumnName = "name";

    const expected = "Review Cycle Name";

    const result = selectSummarizeByColumnDisplayName(type, summaryColumnName);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expected);
  });
  it("select single question summary operation", () => {
    const summaryColumnMetadata = {
      isColumnVisible: true,
      currentlySelectedSummaryFunction: SummaryFunction.Maximum,
      availableSummaryFunctions: [SummaryFunction.Maximum, SummaryFunction.Sum],
    };

    const expected = SummaryFunction.Maximum;

    const result = selectSingleQuestionSummaryOperation(summaryColumnMetadata);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expected);
  });
  it("select group question summary operation", () => {
    const summaryColumnMetadata = {
      isColumnVisible: true,
      currentlySelectedSummaryFunction: SummaryFunction.Maximum,
      availableSummaryFunctions: [SummaryFunction.Maximum, SummaryFunction.Sum],
    };

    const expected = SummaryFunction.Maximum;

    const result = selectGroupedQuestionSummaryOperation(summaryColumnMetadata);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expected);
  });
  it("select column summary operation", () => {
    const summaryColumnMetadata = {
      isColumnVisible: true,
      currentlySelectedSummaryFunction: SummaryFunction.Maximum,
      availableSummaryFunctions: [SummaryFunction.Maximum, SummaryFunction.Sum],
    };

    const expected = SummaryFunction.Maximum;

    const result = selectColumnSummaryOperation(summaryColumnMetadata);

    expect(typeof result).toBe("string");
    expect(result).toStrictEqual(expected);
  });
});
