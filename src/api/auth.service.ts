import { normalizeAuthUser } from '../helpers/permissions';
import {
	apiRequest,
	clearStoredAuth,
	getStoredToken,
	getStoredUser,
	setStoredAuth,
} from './client';
import { ApiError, AuthUser, LoginResponse } from './types';
import { AUTH_MODE } from '../config/app';

/** Offline login for UI work without the backend (`VITE_AUTH_MODE=demo`). Never enable in production. */
const DEMO_EMAIL = 'admin@lms.local';
const DEMO_PASSWORD = 'password';

const isDemoAuth = (): boolean => AUTH_MODE === 'demo';

const demoUser = (): LoginResponse => ({
	id: 1,
	name: 'Demo Administrator',
	email: DEMO_EMAIL,
	role: 'Super Admin',
	roles: ['super_admin'],
	status: 'active',
	permissions: [],
	unrestricted_access: true,
	token: 'demo-token',
});

export async function login(email: string, password: string): Promise<LoginResponse> {
	if (isDemoAuth()) {
		if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
			const data = demoUser();
			setStoredAuth(data.token, data);
			return data;
		}
		throw new ApiError(`Demo mode: use ${DEMO_EMAIL} / ${DEMO_PASSWORD}.`, 401);
	}

	const data = normalizeAuthUser(
		await apiRequest<LoginResponse>('post', '/auth/login', { email, password }),
	);
	if (!data.token) {
		throw new ApiError('Login succeeded without a session token.', 500);
	}
	setStoredAuth(data.token, data);
	return data;
}

export async function getCurrentUser(): Promise<AuthUser> {
	if (isDemoAuth()) {
		return demoUser();
	}
	return normalizeAuthUser(await apiRequest<AuthUser>('get', '/auth/me'));
}

export function logout(): void {
	if (!isDemoAuth() && getStoredToken()) {
		void apiRequest<null>('post', '/auth/logout').catch(() => undefined);
	}
	clearStoredAuth();
}

export function parseStoredUser(): AuthUser | null {
	const raw = getStoredUser();
	if (!raw) return null;
	try {
		return normalizeAuthUser(JSON.parse(raw) as AuthUser);
	} catch {
		return null;
	}
}
