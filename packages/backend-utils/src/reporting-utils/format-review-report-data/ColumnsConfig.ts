/**
 * This config is used to map fields where we want a custom display name
 */
export const ColumnsConfig = {
	reviewFormFields: {
		name: {
			_id: "name",
			name: "Name",
			type: "text",
			headerName: "Form Name",
		},
		status: {
			_id: "status",
			name: "Status",
			type: "text",
			headerName: "Form Status",
		},
		authors_due_date: {
			_id: "authors_due_date",
			name: "Author Due Date",
			type: "date",
			headerName: "Authors' Due Date",
		},
		signers_due_date: {
			_id: "signers_due_date",
			name: "Signer Due Date",
			type: "date",
			headerName: "Signers' Due Date",
		},
		completed_date: {
			_id: "completed_date",
			name: "Completed Date",
			type: "date",
			headerName: "Form Complete Date",
		},
		authors: {
			_id: "authors",
			name: "Authors",
			type: "people",
			headerName: "Form Authors",
		},
		signers: {
			_id: "signers",
			name: "Signers",
			type: "people",
			headerName: "Form Signers",
		},
		authoring_completed_at: {
			_id: "authoring_completed_at",
			name: "Form Authored Date",
			type: "date",
			headerName: "Form Authored Date",
		},
		signing_completed_at: {
			_id: "signing_completed_at",
			name: "Form Signed Date",
			type: "date",
			headerName: "Form Signed Date",
		},
		author_completion: {
			_id: "author_completion",
			name: "Author Completion",
			type: "percentage",
			headerName: "Author Completion",
		},
		signer_completion: {
			_id: "signer_completion",
			name: "Signer Completion",
			type: "percentage",
			headerName: "Signer Completion",
		},
		participants: {
			_id: "participants",
			name: "participants",
			type: "people",
			headerName: "Form Participants",
		},
	},
	reviewCycleFields: {
		name: {
			_id: "name",
			name: "Name",
			type: "text",
			headerName: "Cycle Name",
		},
		group: {
			_id: "group",
			name: "Group",
			type: "department",
			headerName: "Cycle Group Name",
		},
		template: {
			_id: "template",
			name: "Template",
			type: "reviewTemplate",
			headerName: "Template Name",
		},
		start_date: {
			_id: "start_date",
			name: "Start Date",
			type: "date",
			headerName: "Cycle Start Date",
		},
		status: {
			_id: "status",
			name: "Status",
			type: "text",
			headerName: "Cycle Status",
		},
	},
	reviewFields: {
		subject: {
			_id: "subject",
			name: "Subject",
			type: "person",
			headerName: "Review Subject",
		},
		name: {
			_id: "name",
			name: "Review Name",
			type: "text",
			headerName: "Review Name",
		},
		start_date: {
			_id: "start_date",
			name: "Start Date",
			type: "date",
			headerName: "Review Start Date",
		},
		completed_date: {
			_id: "completed_date",
			name: "Completed Date",
			type: "date",
			headerName: "Review Complete Date",
		},
		participants: {
			_id: "participants",
			name: "Participants",
			type: "people",
			headerName: "Review Participants",
		},
		status: {
			_id: "status",
			name: "Status",
			type: "text",
			headerName: "Review Status",
		},
		easy_add_enabled: {
			_id: "easy_add_enabled",
			name: "360 Enabled",
			type: "boolean",
			headerName: "360 Enabled",
		},
		forms_awaiting_approval: {
			_id: "forms_awaiting_approval",
			name: "360 Forms Awaiting Approval",
			type: "number",
			headerName: "360 Forms Awaiting Approval",
		},
	},
	employeeFields: {
		manager_email: {
			_id: "manager_email",
			name: "Manager's Email",
			type: "text",
			headerName: "Manager's Email",
		},
	},
	goalFields: {
		assignee: {
			headerName: "Assignee",
		},
		outlook: {
			headerName: "Outlook",
		},
		categories: {
			headerName: "Categories",
		},
		alignment: {
			headerName: "Alignment",
		},
		name: {
			headerName: "Name",
		},
		last_status_update: {
			headerName: "Last Status Update",
		},
		value: {
			headerName: "Value",
		},
		current_progress: {
			headerName: "Current Progress",
		},
		transparency: {
			headerName: "Transparency",
		},
		target: {
			headerName: "Target",
		},
		alignment_assignee: {
			headerName: "Alignment Assignee",
		},
		assignee_group: {
			headerName: "Assignee Group",
		},
		creation_date: {
			headerName: "Creation Date",
		},
		description: {
			headerName: "Description",
		},
		due_date: {
			headerName: "Due Date",
		},
		goal_weight: {
			headerName: "Goal Weight",
		},
		start_date: {
			headerName: "Start Date",
		},
		status: {
			headerName: "Status",
		},
		units: {
			headerName: "Units",
		},
	},
};
