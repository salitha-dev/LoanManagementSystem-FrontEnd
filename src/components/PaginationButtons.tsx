import React, { FC } from 'react';
import { CardFooter, CardFooterLeft, CardFooterRight } from './bootstrap/Card';
import Pagination, { PaginationItem } from './bootstrap/Pagination';
import Select from './bootstrap/forms/Select';
import Option from './bootstrap/Option';
import {
	ALL_PER_PAGE,
	formatPerPageLabel,
	getPerPageSelectValue,
	isAllPerPage,
	PER_COUNT_OPTIONS,
} from '../helpers/serverPagination';

/** @deprecated Prefer PER_COUNT_OPTIONS — kept for Facit demo pages. */
export const PER_COUNT = {
	10: 10,
	50: 50,
	100: 100,
	[ALL_PER_PAGE]: ALL_PER_PAGE,
};

export const dataPagination = <T,>(data: T[], currentPage: number, perPage: number): T[] => {
	if (isAllPerPage(perPage)) {
		return data;
	}
	return data.filter(
		(_row, index) =>
			index + 1 > (currentPage - 1) * perPage && index + 1 <= currentPage * perPage,
	);
};

interface IPaginationButtonsProps {
	setCurrentPage: (page: number) => void;
	currentPage: number;
	perPage: number;
	setPerPage: (perPage: number) => void;
	/** Full client-side array (used when totalItems is omitted). */
	data?: unknown[];
	/** Prefer for server-side pagination. */
	totalItems?: number;
	label?: string;
	className?: string;
}

const PaginationButtons: FC<IPaginationButtonsProps> = ({
	setCurrentPage,
	currentPage,
	perPage,
	setPerPage,
	data,
	totalItems: totalItemsProp,
	label = 'entries',
	className,
}) => {
	const totalItems = totalItemsProp ?? data?.length ?? 0;
	const showAll = isAllPerPage(perPage);
	const effectivePerPage = showAll ? Math.max(totalItems, 1) : perPage;
	const totalPage = showAll ? 1 : Math.max(1, Math.ceil(totalItems / effectivePerPage) || 1);

	const pagination = () => {
		const items = [];

		let i = currentPage - 1;
		while (i >= currentPage - 1 && i > 0) {
			items.push(
				<PaginationItem key={i} onClick={() => setCurrentPage(currentPage - 1)}>
					{i}
				</PaginationItem>,
			);
			i -= 1;
		}

		const before = items.reverse();

		before.push(
			<PaginationItem key={currentPage} isActive onClick={() => setCurrentPage(currentPage)}>
				{currentPage}
			</PaginationItem>,
		);

		i = currentPage + 1;
		while (i <= currentPage + 1 && i <= totalPage) {
			before.push(
				<PaginationItem key={i} onClick={() => setCurrentPage(currentPage + 1)}>
					{i}
				</PaginationItem>,
			);
			i += 1;
		}

		return before;
	};

	const getInfo = () => {
		if (totalItems === 0) {
			return <span className='pagination__desc'>Showing 0 of 0 {label}</span>;
		}

		const start = showAll ? 1 : effectivePerPage * (currentPage - 1) + 1;
		const end = showAll ? totalItems : Math.min(effectivePerPage * currentPage, totalItems);

		return (
			<span className='pagination__desc'>
				Showing {start} to {end} of {totalItems} {label}
			</span>
		);
	};

	return (
		<CardFooter className={className}>
			<CardFooterLeft className='d-flex flex-wrap align-items-center gap-3'>
				<label className='d-flex align-items-center gap-2 mb-0 text-muted'>
					<span>Show</span>
					<Select
						size='sm'
						ariaLabel='Show entries'
						className='gps-show-entries-select'
						onChange={(e: { target: { value: string } }) => {
							setPerPage(parseInt(e.target.value, 10));
							setCurrentPage(1);
						}}
						value={getPerPageSelectValue(perPage)}>
						{PER_COUNT_OPTIONS.map((value) => (
							<Option key={value} value={String(value)}>
								{formatPerPageLabel(value)}
							</Option>
						))}
					</Select>
					<span>entries</span>
				</label>
				<span className='text-muted'>{getInfo()}</span>
			</CardFooterLeft>

			<CardFooterRight className='d-flex'>
				{!showAll && totalPage > 1 && (
					// @ts-ignore
					<Pagination ariaLabel={label}>
						<PaginationItem
							isFirst
							isDisabled={!(currentPage - 1 > 0)}
							onClick={() => setCurrentPage(1)}
						/>
						<PaginationItem
							isPrev
							isDisabled={!(currentPage - 1 > 0)}
							onClick={() => setCurrentPage(currentPage - 1)}
						/>
						{currentPage - 1 > 1 && (
							<PaginationItem onClick={() => setCurrentPage(currentPage - 2)}>
								...
							</PaginationItem>
						)}
						{pagination()}
						{currentPage + 1 < totalPage && (
							<PaginationItem onClick={() => setCurrentPage(currentPage + 2)}>
								...
							</PaginationItem>
						)}
						<PaginationItem
							isNext
							isDisabled={!(currentPage + 1 <= totalPage)}
							onClick={() => setCurrentPage(currentPage + 1)}
						/>
						<PaginationItem
							isLast
							isDisabled={!(currentPage + 1 <= totalPage)}
							onClick={() => setCurrentPage(totalPage)}
						/>
					</Pagination>
				)}
			</CardFooterRight>
		</CardFooter>
	);
};

export default PaginationButtons;
