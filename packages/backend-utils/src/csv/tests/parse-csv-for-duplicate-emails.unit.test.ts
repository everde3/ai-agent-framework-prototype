import { describe, expect, it } from "vitest";
import { getDuplicateEmailsDataFromCsv } from "..";
import fs from "fs";
import parse from "csv-parse/lib/sync"; // Changed import
import path from "path";

const testDataWithDups = parse(
  fs.readFileSync(path.join(__dirname, "test_data_duplicates.csv")),
  {
    columns: true,
    skip_empty_lines: true,
  }
);

const testDataWithoutDups = parse(
  fs.readFileSync(path.join(__dirname, "test_data_no_duplicates.csv")),
  {
    columns: true,
    skip_empty_lines: true,
  }
);

describe("Get duplicate emails exist in csv function returns boolean", () => {
  it("Returns true when duplicate emails exist in csv function", () => {
    const result = getDuplicateEmailsDataFromCsv(testDataWithDups);
    expect(result).toEqual({
      "lmurphy+ian2@repo.com": [
        "ian cowles",
        "jenny sherman",
        "jessica hernandez",
      ],
      "lmurphy+testeremployee2@repo.com": [
        "monica blanca",
        "employee two",
        "patricia wolf",
      ],
    });
  });
  it("Returns false when no duplicate emails exist in csv function", () => {
    const result = getDuplicateEmailsDataFromCsv(testDataWithoutDups);
    expect(result).toEqual({});
  });
});
