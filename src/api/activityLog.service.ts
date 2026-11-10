import { apiPayload, apiRequest } from './client';
import { ListParams } from './resource';
import { PaginatedResponse, Reference } from './types';

/** One readable change row: values are already display strings (FKs resolved to labels). */
export interface ActivityChange {
	field: string;
	label: string;
	old: string | null;
	new: string | null;
}

export interface ActivityLog {
	id: number;
	event: string;
	module: string | null;
	record_type: string | null;
	record_id: number | null;
	record_label: string | null;
	description: string;
	user_id: number | null;
	user_name: string | null;
	branch_id: number | null;
	branch?: Reference | null;
	ip_address: string | null;
	request_id: string | null;
	created_at: string | null;
}

export interface ActivityLogDetail extends ActivityLog {
	user_agent: string | null;
	old_values: Record<string, unknown> | null;
	new_values: Record<string, unknown> | null;
	changed_fields: ActivityChange[];
}

export interface ActivityLogFilterOptions {
	events: string[];
	modules: string[];
	record_types: string[];
	users: Reference[];
}

/** Read-only: the activity log has no create/update/delete endpoints. */
export const activityLogService = {
	list: (params: ListParams = {}) =>
		apiPayload<PaginatedResponse<ActivityLog>>(
			'get',
			'/activity-logs',
			undefined,
			Object.fromEntries(
				Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
			),
		),
	get: (id: number) => apiRequest<ActivityLogDetail>('get', `/activity-logs/${id}`),
	filters: () => apiRequest<ActivityLogFilterOptions>('get', '/activity-logs/filters'),
};
