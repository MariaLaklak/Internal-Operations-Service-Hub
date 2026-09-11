export const DEMO_EMPLOYEE_EMAIL = 'demo.employee@example.com';
export const ACTOR_EMAIL_BY_ALIAS = {
	'demo-employee': DEMO_EMPLOYEE_EMAIL,
	'it-staff-001': 'it.department.staff@example.com'
} as const;
export const SUPPORTED_DEPARTMENTS = ['IT', 'Human Resources', 'Finance'] as const;
export const SUPPORTED_STATUSES = ['Submitted', 'In Progress', 'Resolved'] as const;
export const SUBMITTED_STATUS = SUPPORTED_STATUSES[0];
export const IN_PROGRESS_STATUS = SUPPORTED_STATUSES[1];
export const DEPARTMENT_STAFF_ROLE = 'Department Staff';
