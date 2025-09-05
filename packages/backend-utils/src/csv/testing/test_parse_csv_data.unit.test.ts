
import { describe, expect, it } from "vitest";
import { parseAndPreventFormulaInjection } from "..";
import fs from "fs";
import parse from "csv-parse/lib/sync"; // Changed import
import path from "path";

const testGoalCsvData = parse(fs.readFileSync(
    path.join(__dirname, 'test_data.csv')
), {
    columns: true,
    skip_empty_lines: true
});


describe("parseAndPreventFormulaInjection function", async () => {
    it("Returns csv with space added before content in cells that start with a metacharacter ", async () => {
        const csvRows = await parseAndPreventFormulaInjection(testGoalCsvData);
        expect(csvRows[0].Assignee).toEqual(" @Jenny German")
        expect(csvRows[1].Assignee).toEqual(" =Jenny German")
        expect(csvRows[2].Assignee).toEqual(" +Ian Cowles")
        expect(csvRows[3].Assignee).toEqual(" -Jenny German")
        expect(csvRows[5].Assignee).toEqual(" ()Monica Speaks English")
        expect(csvRows[6].Assignee).toEqual(" {}Marc Johnson");
        expect(csvRows[7].Assignee).toEqual(" []Manager, Client Experience Spanish")
        expect(csvRows[8].Assignee).toEqual(" $Lizzy Finch")
        expect(csvRows[9].Assignee).toEqual(" |Lizzy Finch")
    })

    it("Return csv row content as is in cells that start with normal character", async () => {
        const csvRows = await parseAndPreventFormulaInjection(testGoalCsvData);
        expect(csvRows[4].Assignee).toEqual("Admin admin")
    })
})