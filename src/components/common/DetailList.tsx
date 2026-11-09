import React, { FC, ReactNode } from 'react';
import { formatDateTime } from '../../helpers/datetime';

export interface DetailItem {
	label: string;
	value: ReactNode;
}

/** Read-only label/value grid for "View" dialogs. */
const DetailList: FC<{ items: DetailItem[] }> = ({ items }) => (
	<dl className='row mb-0'>
		{items.map((item) => (
			<React.Fragment key={item.label}>
				<dt className='col-sm-4 text-muted fw-normal'>{item.label}</dt>
				<dd className='col-sm-8 fw-semibold'>
					{item.value === null || item.value === undefined || item.value === ''
						? '—'
						: item.value}
				</dd>
			</React.Fragment>
		))}
	</dl>
);

/** Standard audit rows appended to every master-data view. */
export const auditDetails = (record: {
	created_by?: { full_name: string } | null;
	updated_by?: { full_name: string } | null;
	created_at: string | null;
	updated_at: string | null;
}): DetailItem[] => [
	{ label: 'Created by', value: record.created_by?.full_name },
	{ label: 'Created at', value: record.created_at ? formatDateTime(record.created_at) : null },
	{ label: 'Updated by', value: record.updated_by?.full_name },
	{ label: 'Updated at', value: record.updated_at ? formatDateTime(record.updated_at) : null },
];

export default DetailList;
