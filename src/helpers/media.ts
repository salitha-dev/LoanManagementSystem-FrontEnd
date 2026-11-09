import { API_BASE_URL } from '../config/app';

/**
 * Laravel public-disk URLs (`APP_URL/storage/...`) must load from the Vite
 * origin in local dev so `/storage` can be proxied to the backend.
 */
export function mediaUrl(url?: string | null): string | null {
	if (!url) {
		return null;
	}
	if (url.startsWith('blob:') || url.startsWith('data:')) {
		return url;
	}

	const apiBase = API_BASE_URL;
	const useDevProxy = !/^https?:\/\//i.test(apiBase);

	if (!useDevProxy) {
		return url;
	}

	try {
		const parsed = new URL(url, 'http://localhost');
		if (parsed.pathname.startsWith('/storage/')) {
			return `${parsed.pathname}${parsed.search}`;
		}
	} catch {
		// Keep the original URL if it is not parseable.
	}

	return url;
}
