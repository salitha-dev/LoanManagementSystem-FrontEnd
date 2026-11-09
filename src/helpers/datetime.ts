export function formatDate(value?: string | null): string {
	if (!value) return '—';
	const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString();
}

export function formatDateTime(value?: string | null): string {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString();
}

/** Backend list APIs reject per_page above 200. */
export function clampPerPage(perPage: number): number {
	if (perPage <= 0) return 200;
	return Math.min(200, perPage);
}
