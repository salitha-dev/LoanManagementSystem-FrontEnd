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

/**
 * Free maps: OpenStreetMap tiles (Leaflet) and Nominatim place search. No API key needed.
 * For heavy production traffic, point these at a commercial or self-hosted provider.
 */
export const MAP_TILE_URL: string =
	env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_TILE_ATTRIBUTION: string =
	env.VITE_MAP_TILE_ATTRIBUTION ||
	'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const GEOCODER_URL: string = env.VITE_GEOCODER_URL || 'https://nominatim.openstreetmap.org';
/** ISO country codes place search is limited to (comma-separated env value). */
export const MAP_SEARCH_COUNTRIES: string[] = (env.VITE_MAP_SEARCH_COUNTRIES || 'lk')
	.split(',')
	.map((code: string) => code.trim().toLowerCase())
	.filter(Boolean);
/** Initial map view when no pin is set (Sri Lanka). */
export const DEFAULT_MAP_CENTER = { lat: 7.8731, lng: 80.7718 };

/** localStorage keys. Keep every key here so they share one prefix. */
export const STORAGE_KEYS = {
	token: 'lms_token',
	user: 'lms_user',
	lastActivity: 'lms_last_activity',
} as const;
