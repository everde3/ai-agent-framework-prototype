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
export const assigneeSummarizeByFieldPathMap: PathMap = {
	EMPLOYEE_FIELD: {
		Manager: {
			_id: "assignee.manager._id",
			name: "assignee.manager.name",
		},
		Group: {
			_id: "assignee.group._id",
			name: "assignee.group.name",
		},
		"Hire Date": {
			_id: "assignee.custom_values.Hire Date",
			name: "assignee.custom_values.Hire Date",
		},
		"Termination Date": {
			_id: "assignee.custom_values.Termination Date",
			name: "assignee.custom_values.Termination Date",
		},
	},
};

export const goalDateFields = ["Hire Date", "Termination Date", "end_date"];
