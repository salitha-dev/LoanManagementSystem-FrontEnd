import { PaginatedResponse } from '../api/types';

const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_ROWS = 5000;

export interface FetchAllResult<T> {
	items: T[];
	truncated: boolean;
	total: number;
}

export async function fetchAllPaginatedItems<T>(
	listFn: (
		page: number,
		perPage: number,
		filters: Record<string, unknown>,
	) => Promise<PaginatedResponse<T>>,
	filters: Record<string, unknown> = {},
): Promise<FetchAllResult<T>> {
	const items: T[] = [];
	let page = 1;
	let total = 0;
	let truncated = false;

	while (items.length < EXPORT_MAX_ROWS) {
		const result = await listFn(page, EXPORT_PAGE_SIZE, filters);
		total = result.meta.total;
		items.push(...result.data);

		if (result.data.length === 0 || page >= result.meta.last_page) {
			break;
		}

		if (items.length >= EXPORT_MAX_ROWS) {
			truncated = total > EXPORT_MAX_ROWS;
			break;
		}

		page += 1;
	}

	return {
		items: items.slice(0, EXPORT_MAX_ROWS),
		truncated,
		total,
	};
}

export default fetchAllPaginatedItems;
