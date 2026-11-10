import { apiRequest } from './client';
import { createResourceService } from './resource';
import { Reference } from './types';

/** Audit columns returned on admin master records. */
export interface AuditFields {
	created_by?: { id: number; full_name: string } | null;
	updated_by?: { id: number; full_name: string } | null;
	created_at: string | null;
	updated_at: string | null;
}

export interface Province extends AuditFields {
	id: number;
	province_code: string;
	province_name: string;
	districts_count?: number;
}

export interface District extends AuditFields {
	id: number;
	province_id: number;
	district_code: string;
	district_name: string;
	province?: Reference | null;
	dsds_count?: number;
}

export interface Dsd extends AuditFields {
	id: number;
	district_id: number;
	dsd_code: string;
	dsd_name: string;
	district?: Reference | null;
	province?: Reference | null;
	gnds_count?: number;
}

export interface Gnd extends AuditFields {
	id: number;
	dsd_id: number;
	gnd_code: string;
	gnd_name: string;
	dsd?: Reference | null;
	district?: Reference | null;
	province?: Reference | null;
}

export interface Branch extends AuditFields {
	id: number;
	branch_code: string;
	branch_name: string;
	address: string;
	province_id: number;
	district_id: number;
	dsd_id: number;
	gnd_id: number;
	province?: Reference | null;
	district?: Reference | null;
	dsd?: Reference | null;
	gnd?: Reference | null;
	latitude: number | null;
	longitude: number | null;
	contact_number: string | null;
	email: string | null;
	opening_date: string | null;
	users_count?: number;
}

export interface Designation extends AuditFields {
	id: number;
	designation_code: string;
	designation_name: string;
	description: string | null;
	users_count?: number;
}

export interface Role {
	id: number;
	name: string;
	is_protected: boolean;
	permissions?: string[];
	permissions_count?: number;
	users_count?: number;
	created_at: string | null;
	updated_at: string | null;
}

export interface AdminUser {
	id: number;
	employee_code: string | null;
	full_name: string;
	username: string | null;
	email: string;
	phone: string | null;
	designation_id: number | null;
	designation?: Reference | null;
	primary_branch_id: number | null;
	primary_branch?: Reference | null;
	branches?: Reference[];
	roles?: { id: number; name: string }[];
	last_login_at: string | null;
	created_at: string | null;
	updated_at: string | null;
}

export interface PermissionCatalog {
	actions: string[];
	groups: {
		resource: string;
		label: string;
		permissions: { name: string; action: string }[];
	}[];
}

export type ProvincePayload = Pick<Province, 'province_code' | 'province_name'>;
export type DistrictPayload = Pick<District, 'province_id' | 'district_code' | 'district_name'>;
export type DsdPayload = Pick<Dsd, 'district_id' | 'dsd_code' | 'dsd_name'>;
export type GndPayload = Pick<Gnd, 'dsd_id' | 'gnd_code' | 'gnd_name'>;
export type BranchPayload = Omit<
	Branch,
	'id' | 'province' | 'district' | 'dsd' | 'gnd' | 'users_count' | keyof AuditFields
>;
export type DesignationPayload = Pick<
	Designation,
	'designation_code' | 'designation_name' | 'description'
>;
export type RolePayload = { name: string; permissions: string[] };
export type UserPayload = {
	employee_code: string;
	full_name: string;
	username: string;
	email: string;
	phone: string | null;
	designation_id: number | null;
	role_ids: number[];
	branch_ids: number[];
	primary_branch_id: number | null;
	password?: string;
	password_confirmation?: string;
};

export const provinceService = createResourceService<Province, ProvincePayload>('/provinces');
export const districtService = createResourceService<District, DistrictPayload>('/districts');
export const dsdService = createResourceService<Dsd, DsdPayload>('/dsds');
export const gndService = createResourceService<Gnd, GndPayload>('/gnds');
export const branchService = createResourceService<Branch, BranchPayload>('/branches');
export const designationService = createResourceService<Designation, DesignationPayload>(
	'/designations',
);
export const roleService = createResourceService<Role, RolePayload>('/roles');
export const userService = createResourceService<AdminUser, UserPayload>('/users');

export const fetchPermissionCatalog = () => apiRequest<PermissionCatalog>('get', '/permissions');

export const resetUserPassword = (
	id: number,
	payload: { password: string; password_confirmation: string },
) => apiRequest<{ message: string }>('post', `/users/${id}/password`, payload);
