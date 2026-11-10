import React, { FC } from 'react';
import { ActivityChange } from '../../api/activityLog.service';

interface IAuditChangesTableProps {
	event: string;
	rows: ActivityChange[];
}

const show = (value: string | null) =>
	value === null || value === '' ? <span className='text-muted'>—</span> : value;

/**
 * Before/after view of an activity log entry. UPDATE rows are highlighted; CREATE shows
 * the new values and DELETE the removed record's values.
 */
const AuditChangesTable: FC<IAuditChangesTableProps> = ({ event, rows }) => {
	if (!rows.length) {
		return <p className='text-muted mb-0'>No field values recorded for this event.</p>;
	}

	if (event !== 'UPDATE') {
		const valueOf = (row: ActivityChange) =>
			event === 'DELETE' ? row.old : (row.new ?? row.old);
		return (
			<div className='table-responsive'>
				<table className='table table-sm align-middle mb-0'>
					<thead>
						<tr>
							<th scope='col'>Field</th>
							<th scope='col'>{event === 'DELETE' ? 'Value (deleted)' : 'Value'}</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.field}>
								<th scope='row' className='fw-semibold'>
									{row.label}
								</th>
								<td className='text-break'>{show(valueOf(row))}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}

	return (
		<div className='table-responsive'>
			<table className='table table-sm align-middle mb-0'>
				<thead>
					<tr>
						<th scope='col'>Field</th>
						<th scope='col'>Before</th>
						<th scope='col'>After</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.field} className='table-warning'>
							<th scope='row' className='fw-semibold'>
								{row.label}
							</th>
							<td className='text-break'>
								<span className='text-danger text-decoration-line-through'>
									{show(row.old)}
								</span>
							</td>
							<td className='text-break'>
								<span className='text-success fw-semibold'>{show(row.new)}</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default AuditChangesTable;
