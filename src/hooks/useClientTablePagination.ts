import { useEffect, useMemo, useState } from 'react';
import { dataPagination } from '../components/PaginationButtons';
import { ALL_PER_PAGE, isAllPerPage } from '../helpers/serverPagination';

/**
 * Client-side Show Entries + page state for tables that already hold a full (or capped) array.
 */
export function useClientTablePagination<T>(items: T[], defaultPerPage = 10) {
	const [currentPage, setCurrentPage] = useState(1);
	const [perPage, setPerPage] = useState(defaultPerPage);

	useEffect(() => {
		if (isAllPerPage(perPage)) {
			setCurrentPage(1);
			return;
		}
		const lastPage = Math.max(1, Math.ceil(items.length / perPage) || 1);
		setCurrentPage((page) => (page > lastPage ? lastPage : page));
	}, [items.length, perPage]);

	const pageItems = useMemo(() => {
		if (isAllPerPage(perPage)) {
			return items;
		}
		return dataPagination(items, currentPage, perPage) as T[];
	}, [items, currentPage, perPage]);

	return {
		currentPage,
		setCurrentPage,
		perPage,
		setPerPage,
		pageItems,
		totalItems: items.length,
		allPerPage: ALL_PER_PAGE,
	};
}
