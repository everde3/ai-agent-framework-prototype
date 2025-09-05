/**
 * File includes any utility functions that without implementation specific details
 * that are used across any of the reporting pipeline files
 */
import { Db, ObjectId } from "mongodb";

import { MatchStage } from "../create-review-report-pipeline";
import { ReportAnalyticsRbacPermissions } from "../format-review-report-data";

type ReportsKey = "goalReports" | "employeeReports" | "reviewReports";

export const createGroupByDateField = (timeUnit: string | null, cleanupLocation: any) => {
	let timeField;

	if (timeUnit === "year") {
		// For "year," simply group by the year of the date.
		timeField = { $toString: { $year: `$${cleanupLocation}` } };
	} else if (timeUnit === "quarter") {
		// For "quarter," create a composite field with year and quarter as a single string.
		// This will end up looking like "2020-Q1" or "2020-Q2" etc.
		timeField = {
			$concat: [
				// grab the year as a string
				{ $toString: { $year: `$${cleanupLocation}` } },
				// add a dash and Q to indicate quarter
				"-Q",
				{
					// if the month is less than or equal to 3, it's Q1
					$cond: [
						{ $lte: [{ $month: `$${cleanupLocation}` }, 3] },
						"1",
						{
							// if the month is less than or equal to 6, it's Q2
							$cond: [
								{ $lte: [{ $month: `$${cleanupLocation}` }, 6] },
								"2",
								{
									// if the month is less than or equal to 9, it's Q3
									// else we can assume it's Q4 at this point
									$cond: [{ $lte: [{ $month: `$${cleanupLocation}` }, 9] }, "3", "4"],
								},
							],
						},
					],
				},
			],
		};
	} else if (timeUnit === "month") {
		// For "month," create a composite field with year and month as a single string.
		timeField = {
			$concat: [
				// grab the year as a string
				{ $toString: { $year: `$${cleanupLocation}` } },
				"-",
				// grab the month as a string
				{ $cond: [{ $lte: [{ $month: `$${cleanupLocation}` }, 9] }, "0", ""] },
				{ $toString: { $month: `$${cleanupLocation}` } },
			],
		};
	} else {
		throw new Error("Invalid timeUnit specified.");
	}

	return {
		// Use $cond to handle cases where the date field is empty.
		// If the date field is empty, group by an empty string.
		// Otherwise, group by the time field we created above.
		// This prevents errors when using date aggregation operators on an empty string.

		$cond: [
			{
				$and: [
					{ $ne: [`$${cleanupLocation}`, ""] },
					{ $ne: [`$${cleanupLocation}`, null] },
					{ $ne: [`$${cleanupLocation}`, undefined] },
					{ $ne: [`$${cleanupLocation}`, "null"] },
					{ $ne: [`$${cleanupLocation}`, "undefined"] },
					{ $ne: [{ $type: `$${cleanupLocation}` }, "string"] },
				],
			},
			timeField,
			"",
		],
	};
};

export const getBucketBoundaries = async (minMax: { min: null | number; max: null | number }, selection: number) => {
	let min = minMax.min;
	let max = minMax.max;

	if (min === null || max === null) {
		return [];
	}

	// see if min/max is divisible by the bin size
	// if not, round min down to nearest divisible number and round max up to nearest divisible number
	if (min % selection !== 0) {
		min = Math.floor(min / selection) * selection;
	}
	if (max % selection !== 0) {
		max = Math.ceil(max / selection) * selection;
	}
	// if max is divisible by selection, add selection to max, since the range max is not inclusive
	else if (max % selection === 0) {
		max = max + selection;
	}

	if (min !== null && max !== null) {
		const boundaryDistance = (max - min) / selection;
		const boundaries = Array.from(Array(selection + 1).keys()).map(
			(item, index) => (min as number) + index * boundaryDistance
		);
		return boundaries;
	}

	return [];
};

export const getMinMaxForField = async (
	db: Db,
	companyID: ObjectId,
	reportMatches: MatchStage[] | null,
	fieldPath: string,
	collectionName: string
) => {
	const pipeline = [
		{
			$match: {
				company_id: companyID,
				...(reportMatches && reportMatches.length > 0 ? { $and: [...reportMatches] } : {}),
			},
		},
		{
			$group: {
				_id: {},
				min: { $min: `$${fieldPath}` },
				max: { $max: `$${fieldPath}` },
			},
		},
	] as Record<string, unknown>[];

	// run pipeline
	const results = await db
		.collection(collectionName)
		.aggregate<any>(pipeline, {
			allowDiskUse: true,
			collation: { locale: "en" }, // sort case insensitive
		})
		.toArray();

	return {
		min: results.length ? results[0].min : null,
		max: results.length ? results[0].max : null,
	};
};

export const getBucketAggregation = (
	cleanupLocation: string,
	boundaries: any[],
	name: string,
	type: string,
	reportsKey: ReportsKey
) => {
	const nestedCleanupLocation = `${reportsKey}.${cleanupLocation}`;
	const nestedSummarizeByLocation = `${reportsKey}.summarizeBy.${type}.${name}`;
	const boundaryDistance = boundaries.length && boundaries.length > 2 ? boundaries[1] - boundaries[0] : 0;

	const manualBucketFormatting = {
		$cond: {
			if: { $eq: ["$_id", "None"] },
			then: "None",
			else: {
				$concat: [{ $toString: "$_id" }, "-", { $toString: { $add: ["$_id", boundaryDistance] } }],
			},
		},
	};

	const autoBucketFormatting = {
		$concat: [
			{ $cond: { if: { $eq: ["$_id.min", null] }, then: "<", else: { $toString: "$_id.min" } } },
			{ $cond: { if: { $eq: ["$_id.min", null] }, then: "=", else: "-" } },
			{ $toString: "$_id.max" },
		],
	};

	const formattedBoundary = boundaries.length ? manualBucketFormatting : autoBucketFormatting;

	return [
		...(boundaries?.length
			? [
					{
						$bucket: {
							groupBy: `$${cleanupLocation}`,
							default: "None",
							boundaries: boundaries,
							output: {
								count: { $sum: 1 },
								[reportsKey]: {
									$push: {
										_id: "$_id",
										cleanup: "$cleanup",
										summarizeBy: "$summarizeBy",
									},
								},
							},
						},
					},
				]
			: [
					{
						$bucketAuto: {
							groupBy: `$${cleanupLocation}`,
							buckets: 10,
							output: {
								count: { $sum: 1 },
								[reportsKey]: {
									$push: {
										_id: "$_id",
									},
								},
							},
						},
					},
				]),

		{
			$unwind: {
				path: `$${reportsKey}`,
			},
		},
		// replace cleanup value with the bucket boundary so when we replace the root, the boundary value doesn't get lost
		{
			$addFields: {
				[nestedCleanupLocation]: boundaries.length ? "$_id" : "$_id.min",
				[nestedSummarizeByLocation]: {
					// keep the original bucket min value for sorting purposes
					_id: boundaries.length ? "$_id" : "$_id.min",
					// formats the boundary with the range display (0-10, 10-20, etc.)
					name: formattedBoundary,
				},
			},
		},
		{
			$replaceRoot: { newRoot: `$${reportsKey}` },
		},
	];
};

/* Get allowed custom_fields to project */
export const generateAllowedCustomFields = async (
	db: Db,
	companyId: ObjectId,
	userPermissions: string[],
	reportType: string
) => {
	const vis: string[] = [];

	// Add visibility levels based on permissions
	if (reportType === "reviewReport") {
		if (userPermissions.includes(ReportAnalyticsRbacPermissions.viewReportSharedWithManagers)) {
			vis.push("manager");
			vis.push("all");
		}
		if (userPermissions.includes(ReportAnalyticsRbacPermissions.viewReportSharedWithContributors)) {
			vis.push("all");
		}
	}
	if (reportType === "goalReport") {
		if (userPermissions.includes(ReportAnalyticsRbacPermissions.viewGoalReportSharedWithManagers)) {
			vis.push("manager");
			vis.push("all");
		}
		if (userPermissions.includes(ReportAnalyticsRbacPermissions.viewGoalReportSharedWithContributors)) {
			vis.push("all");
		}
	}

	if (reportType === "employeeReport") {
		if (userPermissions.includes(ReportAnalyticsRbacPermissions.viewEmployeeReportSharedWithManagers)) {
			vis.push("manager");
			vis.push("all");
		}
		if (userPermissions.includes(ReportAnalyticsRbacPermissions.viewEmployeeReportSharedWithContributors)) {
			vis.push("all");
		}
	}

	const query: any = {
		company_id: companyId,
		vis: { $in: vis },
		$or: [{ deleted: false }, { deleted: { $exists: false } }],
	};
	const results = await db
		.collection("custom_fields")
		.find(query)
		.project({
			name: 1,
		})
		.toArray();

	const allowedCustomFields = results.map((customField) => customField.name);

	// always allow activation status for now
	if (!allowedCustomFields?.includes("Activation Status")) {
		allowedCustomFields.push("Activation Status");
	}

	// manager's email does not have a vis setting -> so if manager is allowed then manager's email is allowed
	if (allowedCustomFields.includes("Manager") && !allowedCustomFields.includes("Manager's Email")) {
		allowedCustomFields.push("Manager's Email");
	}
	if (reportType === "reviewReport") {
		const customValuesProjection = {
			$arrayToObject: {
				$filter: {
					input: { $objectToArray: "$review.subject.custom_values" },
					as: "custom_value",
					cond: { $in: ["$$custom_value.k", allowedCustomFields] },
				},
			},
		};

		const customValuesProjectionSummary = {
			$arrayToObject: {
				$filter: {
					input: { $objectToArray: "$subject.custom_values" },
					as: "custom_value",
					cond: { $in: ["$$custom_value.k", allowedCustomFields] },
				},
			},
		};

		return { customValuesProjection, customValuesProjectionSummary, allowedCustomFields };
	} else {
		return { allowedCustomFields };
	}
};
