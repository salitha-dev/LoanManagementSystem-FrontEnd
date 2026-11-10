import { apiPayload, apiRequest } from './client';
import { PaginatedResponse, Reference } from './types';

export type SortDirection = 'asc' | 'desc';

export interface ListParams {
	page?: number;
	per_page?: number;
	search?: string;
	sort?: string;
	direction?: SortDirection;
	[filter: string]: string | number | undefined | null;
}

const cleanParams = (params: ListParams): Record<string, unknown> =>
	Object.fromEntries(
		Object.entries(params).filter(
			([, value]) => value !== undefined && value !== null && value !== '',
		),
	);

/**
 * Standard REST resource client for `/api/v1/<path>` (index/show/store/update/destroy).
 * Every admin and future module service is built from this.
 */
export function createResourceService<T, TPayload = Partial<T>>(path: string) {
	return {
		list: (params: ListParams = {}) =>
			apiPayload<PaginatedResponse<T>>('get', path, undefined, cleanParams(params)),
		get: (id: number) => apiRequest<T>('get', `${path}/${id}`),
		create: (payload: TPayload) => apiRequest<T>('post', path, payload),
		update: (id: number, payload: TPayload) => apiRequest<T>('put', `${path}/${id}`, payload),
		remove: (id: number) => apiPayload<{ message: string }>('delete', `${path}/${id}`),
	};
}

export type ResourceService<T, TPayload = Partial<T>> = ReturnType<
	typeof createResourceService<T, TPayload>
>;

export type OptionType =
	| 'provinces'
	| 'districts'
	| 'dsds'
	| 'gnds'
	| 'branches'
	| 'designations'
	| 'roles'
	| 'main-sectors'
	| 'sub-sectors'
	| 'sectors'
	| 'titles'
	| 'relationships';

/** Dropdown data available to any signed-in user. Child types need their parent id. */
export const fetchOptions = (type: OptionType, params: Record<string, number> = {}) =>
	apiRequest<Reference[]>('get', `/options/${type}`, undefined, params);
