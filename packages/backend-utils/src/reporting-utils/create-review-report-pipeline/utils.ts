import { MatchStage } from "./types";

export const removeNullMatches = (value: MatchStage | null): value is MatchStage => {
	return value !== null && value !== undefined;
};

export const binningOptions = ["automatic", 5, 10, 25];

interface PathMap {
	[key: string]: {
		[key: string]: Field;
	};
}

interface Field {
	_id: string;
	name: string;
}

// provides the path to the field value in the review report document
export const reviewSummarizeByFieldPathMap: PathMap = {
	EMPLOYEE_FIELD: {
		Manager: {
			_id: "review.subject.manager._id",
			name: "review.subject.manager.name",
		},
		Group: {
			_id: "review.subject.group._id",
			name: "review.subject.group.name",
		},
	},
	REVIEW_FIELD: {
		subject: {
			_id: "review.subject._id",
			name: "review.subject.name",
		},
		status: {
			_id: "review.status",
			name: "review.status",
		},
		start_date: {
			_id: "review.start_date",
			name: "review.start_date",
		},
		completed_date: {
			_id: "review.completed_date",
			name: "review.completed_date",
		},
	},
	REVIEW_CYCLE_FIELD: {
		name: {
			_id: "review_cycle._id",
			name: "review_cycle.name",
		},
		status: {
			_id: "review_cycle.status",
			name: "review_cycle.status",
		},
		due_date: {
			_id: "review_cycle.due_date",
			name: "review_cycle.due_date",
		},
		start_date: {
			_id: "review_cycle.start_date",
			name: "review_cycle.start_date",
		},
	},
	REVIEW_FORM_FIELD: {
		name: {
			_id: "review_form.id",
			name: "review_form.name",
		},
		status: {
			_id: "status",
			name: "status",
		},
		signers_due_date: {
			_id: "signers_due_date",
			name: "signers_due_date",
		},
		authors_due_date: {
			_id: "authors_due_date",
			name: "authors_due_date",
		},
		completed_date: {
			_id: "completed_date",
			name: "completed_date",
		},
	},
};

export const fieldGroupLookup: Record<string, string> = {
	employee: "EMPLOYEE_FIELD",
	review: "REVIEW_FIELD",
	reviewcycle: "REVIEW_CYCLE_FIELD",
	reviewform: "REVIEW_FORM_FIELD",
	question: "UNIQUE_QUESTION",
	groupedquestion: "GROUPED_QUESTION",
};
