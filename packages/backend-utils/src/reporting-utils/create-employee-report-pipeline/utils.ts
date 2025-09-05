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
export const employeeSummarizeByFieldPathMap: PathMap = {
	EMPLOYEE_FIELD: {
		Manager: {
			_id: "state.Manager._id",
			name: "state.Manager.name",
		},
		Group: {
			_id: "state.Group._id",
			name: "state.Group.name",
		},
		Bonus: {
			_id: "state.Bonus",
			name: "state.Bonus",
		},
		Salary: {
			_id: "state.Salary",
			name: "state.Salary",
		},
		"Hire Date": {
			_id: "state.Hire Date",
			name: "state.Hire Date",
		},
		"Termination Date": {
			_id: "state.Termination Date",
			name: "state.Termination Date",
		},
	},
};
