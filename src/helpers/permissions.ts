type PermissionUser =
	| {
			unrestricted_access?: boolean | string | number | null;
			permissions?: unknown;
			role_code?: string | null;
			data?: unknown;
	  }
	| null
	| undefined;

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const nestedUser = (user: NonNullable<PermissionUser>): Record<string, unknown> => {
	const rec = user as Record<string, unknown>;
	const inner = asRecord(rec.data);
	if (
		inner &&
		!('permissions' in rec && rec.permissions != null) &&
		('permissions' in inner || 'email' in inner || 'unrestricted_access' in inner)
	) {
		return inner;
	}
	return rec;
};

export function permissionNames(value: unknown): string[] {
	if (value == null || value === false) return [];
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (!trimmed) return [];
		if (trimmed.startsWith('[')) {
			try {
				return permissionNames(JSON.parse(trimmed));
			} catch {
				return trimmed.split(/[\s,]+/).filter(Boolean);
			}
		}
		return trimmed.split(/[\s,]+/).filter(Boolean);
	}
	if (Array.isArray(value)) {
		return [...new Set(value.flatMap((item) => permissionNames(item)))];
	}
	const rec = asRecord(value);
	if (!rec) return [];
	if (typeof rec.name === 'string' && rec.name.trim()) {
		return [rec.name.trim()];
	}
	if ('permissions' in rec) {
		return permissionNames(rec.permissions);
	}
	if ('data' in rec) {
		return permissionNames(rec.data);
	}
	return [];
}

export function coerceUnrestrictedFlag(value: unknown, roleCode?: unknown): boolean {
	if (roleCode === 'super_admin') return true;
	if (value === true || value === 1 || value === '1' || value === 'true') return true;
	return false;
}

const accessState = (user: PermissionUser) => {
	if (!user) {
		return { unrestricted: false, permissions: [] as string[] };
	}
	const inner = nestedUser(user);
	const roleCode = inner.role_code ?? (user as { role_code?: unknown }).role_code;
	const permissions = permissionNames(
		inner.permissions ?? (user as { permissions?: unknown }).permissions,
	);
	return {
		unrestricted: coerceUnrestrictedFlag(
			inner.unrestricted_access ??
				(user as { unrestricted_access?: unknown }).unrestricted_access,
			roleCode,
		),
		permissions,
	};
};

export function hasUnrestrictedAccess(user: PermissionUser): boolean {
	return accessState(user).unrestricted;
}

export function grantedPermissions(user: PermissionUser): string[] {
	return accessState(user).permissions;
}

export function hasPermission(user: PermissionUser, permission: string): boolean {
	if (!user || !permission) return false;
	const { unrestricted, permissions } = accessState(user);
	if (unrestricted) return true;
	return permissions.includes(permission);
}

export function hasAnyPermission(user: PermissionUser, permissions: string[]): boolean {
	if (!user) return false;
	const { unrestricted, permissions: granted } = accessState(user);
	if (unrestricted) return true;
	if (!permissions.length) return true;
	return permissions.some((permission) => granted.includes(permission));
}

export function normalizeAuthUser<T extends object>(user: T): T {
	const inner = nestedUser(user as NonNullable<PermissionUser>);
	const merged = {
		...(user as Record<string, unknown>),
		...inner,
	};
	delete merged.data;
	const { unrestricted, permissions } = accessState(merged);
	return {
		...merged,
		permissions,
		unrestricted_access: unrestricted,
	} as T;
}
