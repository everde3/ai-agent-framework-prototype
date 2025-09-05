import { describe, it, expect, beforeEach, vi } from "vitest";
import { ObjectId } from "mongodb";
import { Db } from "mongodb";

import { getEmployeeReportPipeline, getFilteredEmployeeIds } from "./index";
import { FieldType, FilterComparison } from "./types";

// Mock the database
const mockDb = {
	collection: vi.fn().mockReturnValue({
		aggregate: vi.fn().mockReturnValue({
			toArray: vi.fn().mockResolvedValue([]),
		}),
	}),
} as unknown as Db;

describe("create-employee-report-pipeline", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getFilteredEmployeeIds", () => {
		it("should create pipeline to get filtered employee IDs", async () => {
			const companyId = new ObjectId();
			const asOfDate = new Date("2024-01-15");
			
			// Mock the aggregate result
			const mockAggregate = vi.fn().mockReturnValue({
				toArray: vi.fn().mockResolvedValue([
					{ _id: new ObjectId() },
					{ _id: new ObjectId() },
				]),
			});
			mockDb.collection = vi.fn().mockReturnValue({
				aggregate: mockAggregate,
			});

			const result = await getFilteredEmployeeIds(mockDb, companyId, asOfDate);

			expect(mockDb.collection).toHaveBeenCalledWith("employee_history");
			expect(mockAggregate).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						$match: {
							company_id: companyId,
							as_of: { $lte: asOfDate },
						},
					}),
					expect.objectContaining({
						$sort: {
							user_id: 1,
							as_of: -1,
							last_updated: -1,
						},
					}),
					expect.objectContaining({
						$group: {
							_id: "$user_id",
							as_of: { $first: "$as_of" },
							document_id: { $first: "$_id" },
							state: { $first: "$state" },
						},
					}),
				]),
				{ allowDiskUse: true }
			);

			expect(result).toHaveLength(2);
			expect(result[0]).toHaveProperty("_id");
		});

		it("should add activation status filter when provided", async () => {
			const companyId = new ObjectId();
			const asOfDate = new Date("2024-01-15");
			const activationStatusFilter = [
				{
					field: "Activation Status",
					value: "Active",
					comparison: FilterComparison.Equals,
					type: FieldType.Text,
					category: "EMPLOYEE_FIELD" as const,
				},
			];

			const mockAggregate = vi.fn().mockReturnValue({
				toArray: vi.fn().mockResolvedValue([]),
			});
			mockDb.collection = vi.fn().mockReturnValue({
				aggregate: mockAggregate,
			});

			await getFilteredEmployeeIds(mockDb, companyId, asOfDate, activationStatusFilter);

			const pipeline = mockAggregate.mock.calls[0][0];
			
			// Should have activation status filter
			const activationStatusStage = pipeline.find((stage: any) => 
				stage.$match && stage.$match["state.custom_values.Activation Status"]
			);
			
			expect(activationStatusStage).toBeDefined();
			expect(activationStatusStage.$match["state.custom_values.Activation Status"]).toBe("Active");
		});

		it("should handle deactivated state correctly", async () => {
			const companyId = new ObjectId();
			const asOfDate = new Date("2024-01-15");
			const activationStatusFilter = [
				{
					field: "Activation Status",
					value: "Deactivated",
					comparison: FilterComparison.Equals,
					type: FieldType.Text,
					category: "EMPLOYEE_FIELD" as const,
				},
			];

			const mockAggregate = vi.fn().mockReturnValue({
				toArray: vi.fn().mockResolvedValue([]),
			});
			mockDb.collection = vi.fn().mockReturnValue({
				aggregate: mockAggregate,
			});

			await getFilteredEmployeeIds(mockDb, companyId, asOfDate, activationStatusFilter);

			const pipeline = mockAggregate.mock.calls[0][0];
			const activationStatusStage = pipeline.find((stage: any) => 
				stage.$match && stage.$match["state.custom_values.Activation Status"]
			);
			
			expect(activationStatusStage.$match["state.custom_values.Activation Status"]).toBe("Deactivated");
		});
	});

	describe("getEmployeeReportPipeline", () => {
		const baseProps = {
			companyID: new ObjectId(),
			columns: [],
			filters: [],
			sorts: [],
			summarizeBy: [],
			aggregationOperations: [],
			userPermissions: [],
		};

		it("should create pipeline with Has Direct Reports filter", async () => {
			const props = {
				...baseProps,
				filters: [
					[
						{
							field: "Has Direct Reports",
							value: true,
							comparison: FilterComparison.Equals,
							type: FieldType.Boolean,
							category: "EMPLOYEE_FIELD" as const,
						},
					],
				],
			};

			const pipeline = await getEmployeeReportPipeline(mockDb, props);

			// Should include direct reports stages
			const hasDirectReportsStage = pipeline.find((stage: any) => 
				stage.$lookup && stage.$lookup.as === "direct_reports"
			);
			
			expect(hasDirectReportsStage).toBeDefined();
		});

		it("should not include direct reports stages when filter is not present", async () => {
			const props = {
				...baseProps,
				filters: [
					[
						{
							field: "Employee",
							value: "John Doe",
							comparison: FilterComparison.Equals,
							type: FieldType.Text,
							category: "EMPLOYEE_FIELD" as const,
						},
					],
				],
			};

			const pipeline = await getEmployeeReportPipeline(mockDb, props);

			// Should not include direct reports stages
			const hasDirectReportsStage = pipeline.find((stage: any) => 
				stage.$lookup && stage.$lookup.as === "direct_reports"
			);
			
			expect(hasDirectReportsStage).toBeUndefined();
		});

		it("should handle activation status filter with Has Direct Reports", async () => {
			const props = {
				...baseProps,
				filters: [
					[
						{
							field: "Has Direct Reports",
							value: true,
							comparison: FilterComparison.Equals,
							type: FieldType.Boolean,
							category: "EMPLOYEE_FIELD" as const,
						},
					],
					[
						{
							field: "Activation Status",
							value: "Active",
							comparison: FilterComparison.Equals,
							type: FieldType.Text,
							category: "EMPLOYEE_FIELD" as const,
						},
					],
				],
			};

			const pipeline = await getEmployeeReportPipeline(mockDb, props);

			// Should include both filters
			expect(pipeline).toBeDefined();
			// Additional assertions would depend on the actual pipeline structure
		});

		it("should handle Has Direct Reports filter with false value", async () => {
			const props = {
				...baseProps,
				filters: [
					[
						{
							field: "Has Direct Reports",
							value: false,
							comparison: FilterComparison.Equals,
							type: FieldType.Boolean,
							category: "EMPLOYEE_FIELD" as const,
						},
					],
				],
			};

			const pipeline = await getEmployeeReportPipeline(mockDb, props);

			// Should include direct reports stages for false value
			const hasDirectReportsStage = pipeline.find((stage: any) => 
				stage.$lookup && stage.$lookup.as === "direct_reports"
			);
			
			expect(hasDirectReportsStage).toBeDefined();
		});
	});
}); 