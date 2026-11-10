import React, { useEffect, useMemo, useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import DetailList from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import AuditChangesTable from '../../components/common/AuditChangesTable';
import Badge from '../../components/bootstrap/Badge';
import Button from '../../components/bootstrap/Button';
import Spinner from '../../components/bootstrap/Spinner';
import useServerList from '../../hooks/useServerList';
import useOptions from '../../hooks/useOptions';
import { formatDateTime } from '../../helpers/datetime';
import { showAppError } from '../../helpers/appNotify';
import { TColor } from '../../type/color-type';
import { Reference } from '../../api/types';
import {
	ActivityChange,
	ActivityLog,
	ActivityLogDetail,
	ActivityLogFilterOptions,
	activityLogService,
} from '../../api/activityLog.service';

const EVENT_COLORS: Record<string, TColor> = {
	CREATE: 'success',
	UPDATE: 'warning',
	DELETE: 'danger',
	VIEW: 'info',
	LOGIN: 'primary',
	LOGOUT: 'secondary',
	LOGIN_FAILED: 'danger',
	PASSWORD_RESET: 'warning',
};

const EventBadge = ({ event }: { event: string }) => (
	<Badge color={EVENT_COLORS[event] ?? 'secondary'} isLight>
		{event.replace('_', ' ')}
	</Badge>
);

type Filters = {
	date_from: string;
	date_to: string;
	user_id: number | null;
	module: number | null;
	event: number | null;
	branch_id: number | null;
	record_type: number | null;
	record_id: string;
};

const EMPTY_FILTERS: Filters = {
	date_from: '',
	date_to: '',
	user_id: null,
	module: null,
	event: null,
	branch_id: null,
	record_type: null,
	record_id: '',
};

/** String lists as {id, code, name} options; the 1-based index is the select value. */
const asOptions = (values: string[]): Reference[] =>
	values.map((value, index) => ({ id: index + 1, code: value, name: value }));
const pick = (values: string[], index: number | null) => (index ? values[index - 1] : undefined);

const humanize = (key: string) =>
	key
		.replace(/_id$/, '')
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());

/** Rows for the details view; events without recorded rows (e.g. LOGIN_FAILED) use raw values. */
const changeRows = (log: ActivityLogDetail): ActivityChange[] => {
	if (log.changed_fields?.length) return log.changed_fields;
	const keys = new Set([
		...Object.keys(log.old_values ?? {}),
		...Object.keys(log.new_values ?? {}),
	]);
	return [...keys].map((key) => ({
		field: key,
		label: humanize(key),
		old: log.old_values?.[key] == null ? null : String(log.old_values[key]),
		new: log.new_values?.[key] == null ? null : String(log.new_values[key]),
	}));
};

/** Read-only activity log / audit trail (no edit or delete actions by design). */
const ActivityLogsPage = () => {
	const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
	const [meta, setMeta] = useState<ActivityLogFilterOptions>({
		events: [],
		modules: [],
		record_types: [],
		users: [],
	});
	const branches = useOptions('branches');
	const [detail, setDetail] = useState<ActivityLogDetail | null>(null);
	const [loadingId, setLoadingId] = useState<number | null>(null);

	useEffect(() => {
		activityLogService
			.filters()
			.then(setMeta)
			.catch(() => undefined);
	}, []);

	const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
		setFilters((prev) => ({ ...prev, [key]: value }));

	const recordId = /^\d+$/.test(filters.record_id.trim()) ? Number(filters.record_id) : undefined;
	const listFilters = useMemo(
		() => ({
			date_from: filters.date_from || undefined,
			date_to: filters.date_to || undefined,
			user_id: filters.user_id,
			module: pick(meta.modules, filters.module),
			event: pick(meta.events, filters.event),
			branch_id: filters.branch_id,
			record_type: pick(meta.record_types, filters.record_type),
			record_id: recordId,
		}),
		[filters, meta, recordId],
	);

	const list = useServerList(activityLogService.list, {
		defaultSort: 'created_at',
		defaultDirection: 'desc',
		entity: 'activity logs',
		filters: listFilters,
	});

	const openDetail = async (row: ActivityLog) => {
		setLoadingId(row.id);
		try {
			setDetail(await activityLogService.get(row.id));
		} catch (error) {
			showAppError('Could not open activity', (error as Error).message);
		} finally {
			setLoadingId(null);
		}
	};

	const columns: DataTableColumn<ActivityLog>[] = [
		{
			id: 'created_at',
			label: 'Date & Time',
			sortable: true,
			cell: (r) => <span className='text-nowrap'>{formatDateTime(r.created_at)}</span>,
		},
		{ id: 'user', label: 'User', cell: (r) => r.user_name ?? 'System', hideBelow: 'md' },
		{
			id: 'module',
			label: 'Module',
			sortable: true,
			cell: (r) => r.module ?? '—',
			hideBelow: 'xl',
		},
		{
			id: 'event',
			label: 'Action',
			sortable: true,
			cell: (r) => <EventBadge event={r.event} />,
		},
		{
			id: 'record_type',
			label: 'Record Type',
			sortable: true,
			cell: (r) => r.record_type ?? '—',
			hideBelow: 'lg',
		},
		{ id: 'record_id', label: 'Record ID', cell: (r) => r.record_id ?? '—', hideBelow: 'xl' },
		{
			id: 'description',
			label: 'Description',
			cell: (r) => (
				<span
					className='d-inline-block text-truncate'
					style={{ maxWidth: 360 }}
					title={r.description}>
					{r.description}
				</span>
			),
		},
		{
			id: 'ip_address',
			label: 'IP Address',
			cell: (r) => r.ip_address ?? '—',
			hideBelow: 'xl',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<div className='d-flex justify-content-end'>
					<Button
						action='view'
						size='sm'
						isDisable={loadingId === r.id}
						aria-label={`View details of activity ${r.id}`}
						onClick={() => void openDetail(r)}>
						{loadingId === r.id ? <Spinner isSmall inButton /> : null}
					</Button>
				</div>
			),
		},
	];

	const stringFilter = (
		key: 'module' | 'event' | 'record_type',
		label: string,
		values: string[],
	) => (
		<SelectField
			id={`activity-filter-${key}`}
			label={label}
			className='col-sm-6 col-lg-3'
			options={asOptions(values)}
			optionLabel={(o) => o.name}
			value={filters[key]}
			onChange={(v) => set(key, v)}
		/>
	);

	return (
		<CrudPage
			title='Activity Logs'
			filters={
				<>
					<TextField
						id='activity-filter-from'
						label='From date'
						type='date'
						className='col-sm-6 col-lg-3'
						value={filters.date_from}
						onChange={(v) => set('date_from', v)}
					/>
					<TextField
						id='activity-filter-to'
						label='To date'
						type='date'
						className='col-sm-6 col-lg-3'
						value={filters.date_to}
						onChange={(v) => set('date_to', v)}
					/>
					<SelectField
						id='activity-filter-user'
						label='User'
						className='col-sm-6 col-lg-3'
						options={meta.users}
						value={filters.user_id}
						onChange={(v) => set('user_id', v)}
					/>
					<SelectField
						id='activity-filter-branch'
						label='Branch'
						className='col-sm-6 col-lg-3'
						options={branches.options}
						loading={branches.loading}
						value={filters.branch_id}
						onChange={(v) => set('branch_id', v)}
					/>
					{stringFilter('module', 'Module', meta.modules)}
					{stringFilter('event', 'Action', meta.events)}
					{stringFilter('record_type', 'Record type', meta.record_types)}
					<TextField
						id='activity-filter-record'
						label='Record ID'
						type='number'
						className='col-sm-6 col-lg-2'
						value={filters.record_id}
						onChange={(v) => set('record_id', v)}
					/>
					<div className='col-sm-6 col-lg-1 d-flex align-items-end'>
						<Button
							color='light'
							className='w-100'
							icon='ClearAll'
							aria-label='Clear filters'
							onClick={() => setFilters(EMPTY_FILTERS)}
						/>
					</div>
				</>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='activity logs'
				getRowId={(r) => r.id}
				exportEnabled={false}
				emptyMessage='No activity found for these filters.'
			/>

			<FormModal
				id='activity-detail-modal'
				size='xl'
				title={detail ? `Activity #${detail.id}` : 'Activity'}
				isOpen={detail !== null}
				onClose={() => setDetail(null)}>
				{detail && (
					<>
						<DetailList
							items={[
								{ label: 'Action', value: <EventBadge event={detail.event} /> },
								{ label: 'Description', value: detail.description },
								{ label: 'User', value: detail.user_name ?? 'System' },
								{ label: 'Date & time', value: formatDateTime(detail.created_at) },
								{ label: 'Module', value: detail.module },
								{
									label: 'Affected record',
									value: detail.record_type
										? `${detail.record_type}${detail.record_label ? ` ${detail.record_label}` : ''}${
												detail.record_id ? ` (ID ${detail.record_id})` : ''
											}`
										: null,
								},
								{ label: 'Branch', value: detail.branch?.name },
								{ label: 'IP address', value: detail.ip_address },
								{
									label: 'User agent',
									value: (
										<span className='small text-break'>
											{detail.user_agent}
										</span>
									),
								},
								{ label: 'Request ID', value: <code>{detail.request_id}</code> },
							]}
						/>
						<div className='fw-semibold mt-3 mb-2'>
							{detail.event === 'UPDATE' ? 'Changed fields' : 'Values'}
						</div>
						<AuditChangesTable event={detail.event} rows={changeRows(detail)} />
					</>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default ActivityLogsPage;
