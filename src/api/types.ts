/**
 * Shared API contracts. Mirrors the backend conventions (see backend CLAUDE.md):
 * - Success: `{ data: T }` (Laravel API Resource), paginated lists add `meta` + `links`.
 * - Error:   `{ message: string, errors?: Record<field, string[]> }` with a 4xx/5xx status.
 */
export interface ApiResponse<T> {
	data?: T;
	message?: string;
	errors?: Record<string, string[]>;
}

export interface PaginationMeta {
	current_page: number;
	from: number | null;
	last_page: number;
	per_page: number;
	to: number | null;
	total: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
	links?: Record<string, string | null>;
}

export class ApiError extends Error {
	status: number;

	errors?: Record<string, string[]>;

	constructor(message: string, status = 500, errors?: Record<string, string[]>) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.errors = errors;
	}
}

/** Compact related record / dropdown option: { id, code, name }. */
export interface Reference {
	id: number;
	code: string;
	name: string;
}

export interface AuthUser {
	id: number;
	employee_code?: string | null;
	full_name: string;
	username?: string | null;
	email: string;
	phone?: string | null;
	avatar_url?: string | null;
	designation?: Reference | null;
	primary_branch?: Reference | null;
	branches?: Reference[];
	role?: string | null;
	roles?: { id: number; name: string }[];
	permissions?: string[];
	unrestricted_access?: boolean;
	last_login_at?: string | null;
}

export interface LoginResponse extends AuthUser {
	token: string;
}
