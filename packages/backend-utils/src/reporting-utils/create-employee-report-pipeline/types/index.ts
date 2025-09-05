import { ObjectId } from "mongodb";
import { z } from "zod";

import { AVAILABLE_AGGREGATION_OPERATIONS } from "../../create-review-report-pipeline/types";

export type CustomFieldValue = string | number | Date | ObjectId | string[] | ObjectId[];

export interface SkinnyEmployee {
	_id: ObjectId | string;
	email?: string;
	name: string;
}

export interface SkinnyGroupDetails {
	_id: ObjectId;
	name: string;
}

export const maximumEmployeeReportPageSize = 200;
export const maximumEmployeeReportVisualizationResultSize = 1000;

export type DenormalizedEmployeeCustomFieldValue =
	| null
	| CustomFieldValue
	| SkinnyGroupDetails
	| SkinnyEmployee
	| (SkinnyEmployee | null)[];

export interface EmployeeCustomValuesHash {
	[key: string]: DenormalizedEmployeeCustomFieldValue;
}

export enum FieldType {
	People = "people",
	Person = "person",
	Text = "text",
	Email = "email",
	Phone = "phone",
	Date = "date",
	MultiSelect = "multi-select",
	Numeric = "numeric",
	SingleSelect = "single-select",
	Monetary = "monetary",
	Textbox = "textbox",
	// eslint-disable-next-line id-blacklist
	Boolean = "boolean",
	Template = "template",
	Department = "department",
	Cycle = "cycle",
	Review = "review",
	Status = "status",
	Subject = "subject",
}

export enum FilterComparison {
	Equals = "eq",
	Between = "between",
	GreaterThan = "gt",
	GreaterThanOrEqual = "gte",
	LessThan = "lt",
	After = "after",
	Before = "before",
	LessThanOrEqual = "lte",
	NotEqual = "ne",
	Contains = "contains",
	NotContains = "notcontains",
	StartsWith = "startswith",
	NotStartsWith = "notstartswith",
	EndsWith = "endswith",
	NotEndsWith = "notendswith",
	Null = "null",
}

export type FieldCategory = "EMPLOYEE_FIELD" | "REVIEW_FIELD" | "REVIEW_CYCLE_FIELD" | "REVIEW_FORM_FIELD" | "SUBJECT";

export type FieldValue = string | ObjectId | null | Date | boolean | (string | ObjectId | Date)[];

export interface FieldFilter {
	value: FieldValue;
	field: string;
	comparison: FilterComparison;
	type: FieldType;
	isCustomField?: boolean;
	category?: FieldCategory;
}

export interface ReviewReportFilters {
	filters?: FieldFilter[][];
}

export interface EmployeeReportSummarizeByInput {
	type: string;
	name: string;
	selection: string | null | number;
}

export interface EmployeeReportAggregationOperationInput {
	type: string;
	name: string;
	operation: string;
}

export type SelectedColumnDefinition = { id: string; type: string }[];

export interface EmployeeReportSort {
	name: string;
	direction: "asc" | "desc";
	fieldPath: string[];
	type: "EMPLOYEE_FIELD";
}

export interface GetEmployeeReportDataArgs {
	companyID: ObjectId;
	columns?: SelectedColumnDefinition;
	filters?: FieldFilter[][];
	pageNumber: string;
	pageSize: string;
	sorts: EmployeeReportSort[];
	summarizeBy?: EmployeeReportSummarizeByInput[];
	aggregationOperations?: EmployeeReportAggregationOperationInput[];
}

export interface EmployeeReportResult {
	_id: ObjectId;
	company_id: ObjectId;
	summarizeBy: any;
	employee: {
		custom_values: EmployeeCustomValuesHash; // includes activation status
	};
}

export type EmployeeReportAggregationOperation = (typeof AVAILABLE_AGGREGATION_OPERATIONS)[number];

export interface EmployeeReportAggregationOperationDefinition
	extends Omit<EmployeeReportAggregationOperationInput, "operation"> {
	operation: EmployeeReportAggregationOperation;
}

export const FilterComparisonEnum = z.nativeEnum(FilterComparison);

export const FieldTypeEnum = z.nativeEnum(FieldType);
