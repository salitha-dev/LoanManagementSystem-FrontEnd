/** Sentinel value when the user selects "All" rows per page. */
export const ALL_PER_PAGE = -1;

/** Show Entries dropdown options. */
export const PER_COUNT_OPTIONS = [10, 50, 100, ALL_PER_PAGE] as const;

/** Fallback when "All" is selected before total is known. */
export const ALL_PER_PAGE_FALLBACK = 5000;

export function isAllPerPage(perPage: number): boolean {
	return perPage === ALL_PER_PAGE || perPage <= 0;
}

/** Map UI per-page (including All) to a positive API `per_page`. */
export function resolveApiPerPage(perPage: number, knownTotal = 0): number {
	if (isAllPerPage(perPage)) {
		return Math.max(knownTotal || 0, ALL_PER_PAGE_FALLBACK);
	}
	return perPage;
}

export function getPerPageSelectValue(perPage: number): string {
	return isAllPerPage(perPage) ? String(ALL_PER_PAGE) : String(perPage);
}

export function formatPerPageLabel(perPage: number): string {
	return isAllPerPage(perPage) ? 'All' : String(perPage);
}
