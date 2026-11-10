import { useCallback, useEffect, useState } from 'react';
import { ListParams, SortDirection } from '../api/resource';
import { PaginatedResponse } from '../api/types';
import { isAllPerPage } from '../helpers/serverPagination';
import { showAppError } from '../helpers/appNotify';

const MAX_PER_PAGE = 100;

type Loader<T> = (params: ListParams) => Promise<PaginatedResponse<T>>;

/**
 * Server-side list state (page, per page, search, sort, filters) wired to DataTable's
 * `mode='server'` props. Changing filters resets to page 1.
 */
export default function useServerList<T>(
	load: Loader<T>,
	options: {
		defaultSort: string;
		defaultDirection?: SortDirection;
		filters?: ListParams;
		entity: string;
	},
) {
	const { defaultSort, defaultDirection = 'asc', filters = {}, entity } = options;
	const filtersKey = JSON.stringify(filters);

	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [search, setSearch] = useState('');
	const [sort, setSort] = useState<{ id: string; direction: SortDirection }>({
		id: defaultSort,
		direction: defaultDirection,
	});
	const [rows, setRows] = useState<T[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [reloadToken, setReloadToken] = useState(0);
	const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);

	if (prevFiltersKey !== filtersKey) {
		setPrevFiltersKey(filtersKey);
		setPage(1);
	}

	useEffect(() => {
		let active = true;
		const params: ListParams = {
			...(JSON.parse(filtersKey) as ListParams),
			page,
			per_page: isAllPerPage(perPage) ? MAX_PER_PAGE : Math.min(perPage, MAX_PER_PAGE),
			search: search || undefined,
			sort: sort.id,
			direction: sort.direction,
		};
		load(params)
			.then((result) => {
				if (!active) return;
				setRows(result.data);
				setTotal(result.meta.total);
			})
			.catch((error: Error) => {
				if (!active) return;
				setRows([]);
				setTotal(0);
				showAppError(`Could not load ${entity}`, error.message);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [load, filtersKey, page, perPage, search, sort, reloadToken, entity]);

	const reload = useCallback(() => {
		setLoading(true);
		setReloadToken((token) => token + 1);
	}, []);

	const withLoading =
		<A extends unknown[]>(fn: (...args: A) => void) =>
		(...args: A) => {
			setLoading(true);
			fn(...args);
		};

	return {
		rows,
		total,
		loading,
		reload,
		tableProps: {
			mode: 'server' as const,
			rows,
			loading,
			totalItems: total,
			page,
			perPage,
			search,
			sort,
			onPageChange: withLoading(setPage),
			onPerPageChange: withLoading(setPerPage),
			onSearchChange: withLoading((value: string) => {
				setSearch(value);
				setPage(1);
			}),
			onSortChange: withLoading((id: string, direction: SortDirection) =>
				setSort({ id, direction }),
			),
		},
	};
}
