import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import PaginationButtons, { dataPagination } from '../PaginationButtons';
import Input from '../bootstrap/forms/Input';
import Button, { ButtonGroup } from '../bootstrap/Button';
import { isAllPerPage, PER_COUNT_OPTIONS } from '../../helpers/serverPagination';
import { exportTableRows, TableExportFormat } from '../../helpers/tableExport';

export type SortDirection = 'asc' | 'desc';

export type DataTableColumn<T> = {
	id?: string;
	key?: string;
	header?: ReactNode;
	label?: string;
	sortable?: boolean;
	getValue?: (row: T) => string | number | boolean | null | undefined;
	getSearchText?: (row: T) => string;
	cell?: (row: T, index: number) => ReactNode;
	render?: (row: T, index: number) => ReactNode;
	className?: string;
	headerClassName?: string;
	hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
	exportable?: boolean;
};

export type DataTableProps<T> = {
	columns: DataTableColumn<T>[];
	rows: T[];
	getRowId?: (row: T, index: number) => string | number;
	label?: string;
	loading?: boolean;
	emptyMessage?: string;
	emptyTitle?: string;
	className?: string;
	mode?: 'client' | 'server';
	defaultPerPage?: number;
	totalItems?: number;
	page?: number;
	perPage?: number;
	onPageChange?: (page: number) => void;
	onPerPageChange?: (perPage: number) => void;
	search?: string;
	onSearchChange?: (search: string) => void;
	searchDebounceMs?: number;
	toolbarExtra?: ReactNode;
	exportEnabled?: boolean;
	exportFileName?: string;
	/** Replaces the built-in export, e.g. to download every server-side row. */
	onExport?: (format: TableExportFormat) => Promise<void>;
	/** Server-side sorting; the table then shows rows in the order given. */
	sort?: { id: string; direction: SortDirection } | null;
	onSortChange?: (id: string, direction: SortDirection) => void;
	/** Rendered as the table footer, e.g. totals for the full filtered set. */
	footer?: ReactNode;
};

function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
	const av = a ?? '';
	const bv = b ?? '';
	if (typeof av === 'number' && typeof bv === 'number') {
		return direction === 'asc' ? av - bv : bv - av;
	}
	if (typeof av === 'boolean' && typeof bv === 'boolean') {
		return direction === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
	}
	const as = String(av).toLowerCase();
	const bs = String(bv).toLowerCase();
	if (as < bs) return direction === 'asc' ? -1 : 1;
	if (as > bs) return direction === 'asc' ? 1 : -1;
	return 0;
}

function hideClass(hideBelow?: DataTableColumn<unknown>['hideBelow']): string | undefined {
	if (!hideBelow) return undefined;
	return `d-none d-${hideBelow}-table-cell`;
}

function columnId<T>(column: DataTableColumn<T>, index: number): string {
	return column.id || column.key || `col-${index}`;
}

function columnHeader<T>(column: DataTableColumn<T>): ReactNode {
	return column.header ?? column.label ?? '';
}

function columnCell<T>(column: DataTableColumn<T>, row: T, index: number): ReactNode {
	return column.cell?.(row, index) ?? column.render?.(row, index) ?? null;
}

function defaultRowId<T>(row: T, index: number): string {
	if (row && typeof row === 'object' && 'id' in row && (row as { id?: unknown }).id != null) {
		return String((row as { id: string | number }).id);
	}
	return String(index);
}

// eslint-disable-next-line react/function-component-definition -- generic component
function DataTable<T>({
	columns,
	rows,
	getRowId = defaultRowId,
	label = 'entries',
	loading = false,
	emptyMessage = 'No records found.',
	emptyTitle,
	className,
	mode = 'client',
	defaultPerPage = PER_COUNT_OPTIONS[0],
	totalItems: totalItemsProp,
	page: pageProp,
	perPage: perPageProp,
	onPageChange,
	onPerPageChange,
	search: searchProp,
	onSearchChange,
	searchDebounceMs = 300,
	toolbarExtra,
	exportEnabled = true,
	exportFileName,
	onExport: onExportOverride,
	sort: serverSort,
	onSortChange,
	footer,
}: DataTableProps<T>) {
	const isServer = mode === 'server';
	const serverSorted = isServer && Boolean(onSortChange);

	const [localPage, setLocalPage] = useState(1);
	const [localPerPage, setLocalPerPage] = useState(defaultPerPage);
	const [localSearch, setLocalSearch] = useState('');
	const [sortId, setSortId] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<SortDirection>('asc');
	const [searchDraft, setSearchDraft] = useState(searchProp ?? '');
	const [exporting, setExporting] = useState<TableExportFormat | null>(null);

	const page = isServer ? (pageProp ?? 1) : localPage;
	const perPage = isServer ? (perPageProp ?? defaultPerPage) : localPerPage;
	const search = isServer ? (searchProp ?? '') : localSearch;

	useEffect(() => {
		if (!isServer) return;
		setSearchDraft(searchProp ?? '');
	}, [isServer, searchProp]);

	useEffect(() => {
		if (!isServer || !onSearchChange) return;
		const handle = window.setTimeout(() => {
			if (searchDraft !== (searchProp ?? '')) {
				onSearchChange(searchDraft);
			}
		}, searchDebounceMs);
		return () => window.clearTimeout(handle);
	}, [isServer, onSearchChange, searchDebounceMs, searchDraft, searchProp]);

	const setPage = (next: number) => {
		if (isServer) onPageChange?.(next);
		else setLocalPage(next);
	};

	const setPerPage = (next: number) => {
		if (isServer) {
			onPerPageChange?.(next);
			onPageChange?.(1);
		} else {
			setLocalPerPage(next);
			setLocalPage(1);
		}
	};

	const onSearchInput = (value: string) => {
		if (isServer) {
			setSearchDraft(value);
		} else {
			setLocalSearch(value);
			setLocalPage(1);
		}
	};

	const filteredRows = useMemo(() => {
		if (isServer && onSearchChange) return rows;
		const q = (isServer ? searchDraft : search).trim().toLowerCase();
		if (!q) return rows;
		return rows.filter((row) =>
			columns.some((col) => {
				const rendered = col.render?.(row, 0);
				const fromRender =
					typeof rendered === 'string' || typeof rendered === 'number'
						? String(rendered)
						: '';
				const text =
					col.getSearchText?.(row) ??
					(col.getValue ? String(col.getValue(row) ?? '') : fromRender);
				return text.toLowerCase().includes(q);
			}),
		);
	}, [columns, isServer, onSearchChange, rows, search, searchDraft]);

	const sortedRows = useMemo(() => {
		if (serverSorted || !sortId) return filteredRows;
		const column = columns.find((c, index) => columnId(c, index) === sortId);
		if (!column?.getValue) return filteredRows;
		const copy = [...filteredRows];
		copy.sort((a, b) => compareValues(column.getValue!(a), column.getValue!(b), sortDir));
		return copy;
	}, [columns, filteredRows, serverSorted, sortDir, sortId]);

	const totalItems = useMemo(() => {
		if (!isServer) return sortedRows.length;
		const localFilterActive = !onSearchChange && searchDraft.trim().length > 0;
		if (localFilterActive) return sortedRows.length;
		return totalItemsProp ?? rows.length;
	}, [isServer, onSearchChange, rows.length, searchDraft, sortedRows.length, totalItemsProp]);

	useEffect(() => {
		if (isServer || isAllPerPage(perPage)) return;
		const last = Math.max(1, Math.ceil(totalItems / perPage) || 1);
		if (page > last) setLocalPage(last);
	}, [isServer, page, perPage, totalItems]);

	const pageRows = useMemo(() => {
		if (isServer) return sortedRows;
		return dataPagination(sortedRows, page, perPage);
	}, [isServer, page, perPage, sortedRows]);

	const activeSortId = serverSorted ? (serverSort?.id ?? null) : sortId;
	const activeSortDir = serverSorted ? (serverSort?.direction ?? 'asc') : sortDir;

	const toggleSort = (column: DataTableColumn<T>, index: number) => {
		if (!column.sortable || !column.getValue) return;
		const id = columnId(column, index);
		if (serverSorted) {
			onSortChange?.(id, activeSortId === id && activeSortDir === 'asc' ? 'desc' : 'asc');
			return;
		}
		if (sortId === id) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortId(id);
			setSortDir('asc');
		}
	};

	const searchValue = isServer ? searchDraft : search;
	const emptyText = emptyTitle || emptyMessage;

	const onExport = async (format: TableExportFormat) => {
		if (exporting) return;
		setExporting(format);
		try {
			if (onExportOverride) {
				await onExportOverride(format);
				return;
			}
			await exportTableRows(
				format,
				exportFileName || label,
				columns.map((col, index) => ({
					...col,
					id: columnId(col, index),
					header: columnHeader(col),
				})),
				sortedRows,
			);
		} finally {
			setExporting(null);
		}
	};

	return (
		<div className={classNames('gps-datatable', className)}>
			<div className='gps-datatable__toolbar'>
				<div className='gps-datatable__toolbar-left d-flex flex-wrap align-items-center gap-2'>
					{exportEnabled && (
						<ButtonGroup>
							<Button
								action='export_excel'
								size='sm'
								isDisable={loading || exporting !== null}
								onClick={() => void onExport('excel')}>
								{exporting === 'excel' ? 'Exporting…' : 'Excel'}
							</Button>
							<Button
								action='export_csv'
								size='sm'
								isDisable={loading || exporting !== null}
								onClick={() => void onExport('csv')}>
								{exporting === 'csv' ? 'Exporting…' : 'CSV'}
							</Button>
							<Button
								action='export_pdf'
								size='sm'
								isDisable={loading || exporting !== null}
								onClick={() => void onExport('pdf')}>
								{exporting === 'pdf' ? 'Exporting…' : 'PDF'}
							</Button>
						</ButtonGroup>
					)}
					{toolbarExtra}
				</div>
				<div className='gps-datatable__toolbar-right'>
					<label className='gps-datatable__search mb-0'>
						<span className='text-muted me-2'>Search</span>
						<Input
							type='search'
							ariaLabel='Search table'
							placeholder='Type to filter…'
							value={searchValue}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								onSearchInput(e.target.value)
							}
						/>
					</label>
				</div>
			</div>

			<div className='table-responsive gps-datatable__scroll'>
				{loading ? (
					<p className='text-muted mb-0 p-3'>Loading…</p>
				) : (
					<table className='table table-modern table-hover gps-datatable__table mb-0'>
						<thead>
							<tr>
								{columns.map((col, colIndex) => {
									const id = columnId(col, colIndex);
									const active = activeSortId === id;
									const canSort = Boolean(col.sortable && col.getValue);
									return (
										<th
											key={id}
											className={classNames(
												col.headerClassName,
												hideClass(col.hideBelow),
												canSort && 'gps-datatable__th--sortable',
												active && `gps-datatable__th--${activeSortDir}`,
											)}
											onClick={() => canSort && toggleSort(col, colIndex)}
											aria-sort={
												!canSort
													? undefined
													: active
														? activeSortDir === 'asc'
															? 'ascending'
															: 'descending'
														: 'none'
											}>
											<span className='gps-datatable__th-label'>
												{columnHeader(col)}
												{canSort && (
													<span
														className='gps-datatable__sort-icon'
														aria-hidden>
														{active
															? activeSortDir === 'asc'
																? ' ▲'
																: ' ▼'
															: ' ↕'}
													</span>
												)}
											</span>
										</th>
									);
								})}
							</tr>
						</thead>
						<tbody>
							{pageRows.map((row, index) => (
								<tr key={getRowId(row, index)}>
									{columns.map((col, colIndex) => (
										<td
											key={columnId(col, colIndex)}
											className={classNames(
												col.className,
												hideClass(col.hideBelow),
											)}>
											{columnCell(col, row, index)}
										</td>
									))}
								</tr>
							))}
							{!pageRows.length && (
								<tr>
									<td
										colSpan={Math.max(columns.length, 1)}
										className='text-muted'>
										{emptyText}
									</td>
								</tr>
							)}
						</tbody>
						{footer && pageRows.length ? <tfoot>{footer}</tfoot> : null}
					</table>
				)}
			</div>

			<PaginationButtons
				totalItems={totalItems}
				label={label}
				currentPage={page}
				setCurrentPage={setPage}
				perPage={perPage}
				setPerPage={setPerPage}
			/>
		</div>
	);
}

export default DataTable;
