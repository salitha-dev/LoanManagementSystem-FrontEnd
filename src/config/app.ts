/**
 * Central runtime configuration. Every `import.meta.env` read for app-wide
 * settings lives here so pages and services never touch env vars directly.
 */
const env = import.meta.env;

const numberEnv = (value: string | undefined, fallback: number): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const APP_NAME: string = env.VITE_SITE_NAME || 'Loan Management System';
export const APP_SHORT_NAME: string = env.VITE_SITE_SHORT_NAME || 'LMS';

/** API base URL including the version segment, e.g. `/api/v1` or `https://api.example.com/api/v1`. */
export const API_BASE_URL: string = env.VITE_API_URL || '/api/v1';

/** `api` = real backend login. `demo` = offline login for UI work without the backend. */
export const AUTH_MODE: 'api' | 'demo' = env.VITE_AUTH_MODE === 'demo' ? 'demo' : 'api';

export const IDLE_TIMEOUT_MINUTES = numberEnv(env.VITE_IDLE_TIMEOUT_MINUTES, 30);

/** localStorage keys. Keep every key here so they share one prefix. */
export const STORAGE_KEYS = {
	token: 'lms_token',
	user: 'lms_user',
	lastActivity: 'lms_last_activity',
} as const;
