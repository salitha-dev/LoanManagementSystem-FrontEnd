import React, { FC, useCallback, useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Badge from '../../components/bootstrap/Badge';
import Button from '../../components/bootstrap/Button';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import useOptions from '../../hooks/useOptions';
import useFormState from '../../hooks/useFormState';
import { formatDate, formatDateTime } from '../../helpers/datetime';
import { ListParams } from '../../api/resource';
import {
	CHEQUE_STATE_COLORS,
	ChequeBook,
	ChequeBookPayload,
	chequeBookService,
	ChequeLeaf,
	ChequeLeafState,
	chequeLeafService,
} from '../../api/finance.service';

const STATES: ChequeLeafState[] = [
	'available',
	'issued',
	'presented',
	'cleared',
	'returned',
	'cancelled',
];
const STATE_OPTIONS = STATES.map((s, i) => ({
	id: i + 1,
	code: s,
	name: s[0].toUpperCase() + s.slice(1),
}));
const MAX_LEAVES = 500;

export const StateBadge: FC<{ state: ChequeLeafState }> = ({ state }) => (
	<Badge color={CHEQUE_STATE_COLORS[state]} isLight>
		{state[0].toUpperCase() + state.slice(1)}
	</Badge>
);

/** Live leaf count for the form; mirrors the API rules (digits, same length, ≤ 500). */
const rangeHint = (start: string, end: string): { text: string; ok: boolean } | null => {
	if (!/^\d{1,12}$/.test(start) || !/^\d{1,12}$/.test(end)) return null;
	if (start.length !== end.length)
		return { text: 'Start and end must have the same number of digits.', ok: false };
	const total = Number(end) - Number(start) + 1;
	if (total < 1)
		return { text: 'The end number must not be lower than the start number.', ok: false };
	if (total > MAX_LEAVES)
		return { text: `${total} leaves — the maximum is ${MAX_LEAVES}.`, ok: false };
	return { text: `${total} cheque leaves will be created.`, ok: true };
};

type Form = {
	bank_account_id: number | null;
	cheque_book_number: string;
	start_cheque_number: string;
	end_cheque_number: string;
	issued_date: string;
	received_date: string;
};
const EMPTY: Form = {
	bank_account_id: null,
	cheque_book_number: '',
	start_cheque_number: '',
	end_cheque_number: '',
	issued_date: '',
	received_date: '',
};
const toForm = (r: ChequeBook): Form => ({
	bank_account_id: r.bank_account_id,
	cheque_book_number: r.cheque_book_number ?? '',
	start_cheque_number: r.start_cheque_number,
	end_cheque_number: r.end_cheque_number,
	issued_date: r.issued_date ?? '',
	received_date: r.received_date ?? '',
});
const toPayload = (f: Form): ChequeBookPayload => ({
	bank_account_id: f.bank_account_id,
	cheque_book_number: f.cheque_book_number || null,
	start_cheque_number: f.start_cheque_number,
	end_cheque_number: f.end_cheque_number,
	issued_date: f.issued_date,
	received_date: f.received_date || null,
});

/** Leaves of one book with state filter, history and cancel. */
const ChequeLeavesPanel: FC<{ bookId: number; canCancel: boolean; onChanged: () => void }> = ({
	bookId,
	canCancel,
	onChanged,
}) => {
	const [state, setState] = useState<number | null>(null);
	const load = useCallback(
		(params: ListParams) => chequeLeafService.listForBook(bookId, params),
		[bookId],
	);
	const leaves = useServerList(load, {
		defaultSort: 'cheque_number',
		entity: 'cheque leaves',
		filters: { state: STATE_OPTIONS.find((o) => o.id === state)?.code },
	});
	const [history, setHistory] = useState<ChequeLeaf | null>(null);
	const [cancelling, setCancelling] = useState<ChequeLeaf | null>(null);
	const reason = useFormState({ reason: '' });

	const showHistory = async (leaf: ChequeLeaf) =>
		setHistory(await chequeLeafService.get(leaf.id));

	const columns: DataTableColumn<ChequeLeaf>[] = [
		{
			id: 'cheque_number',
			label: 'Cheque no.',
			sortable: true,
			cell: (r) => <span className='font-monospace'>{r.cheque_number}</span>,
		},
		{
			id: 'state',
			label: 'State',
			sortable: true,
			cell: (r) => <StateBadge state={r.state} />,
		},
		{
			id: 'state_changed_at',
			label: 'Last change',
			cell: (r) => (r.state_changed_at ? formatDateTime(r.state_changed_at) : '—'),
			hideBelow: 'md',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<div className='d-flex gap-1 justify-content-end'>
					<Button
						color='info'
						isLight
						size='sm'
						icon='History'
						aria-label={`History of cheque ${r.cheque_number}`}
						onClick={() => void showHistory(r)}
					/>
					{canCancel && r.state === 'available' && (
						<Button
							color='danger'
							isLight
							size='sm'
							icon='Block'
							aria-label={`Cancel cheque ${r.cheque_number}`}
							onClick={() => {
								reason.reset({ reason: '' });
								setCancelling(r);
							}}
						/>
					)}
				</div>
			),
		},
	];

	return (
		<>
			<div className='row g-3 mb-2'>
				<SelectField
					id='leaf-state-filter'
					label='State'
					className='col-md-4'
					options={STATE_OPTIONS}
					optionLabel={(o) => o.name}
					value={state}
					onChange={setState}
				/>
			</div>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...leaves.tableProps}
				columns={columns}
				label='cheque leaves'
				getRowId={(r) => r.id}
				exportEnabled={false}
				emptyMessage='No cheque leaves in this state.'
			/>

			<FormModal
				id='cheque-cancel-modal'
				size='sm'
				title={`Cancel cheque ${cancelling?.cheque_number ?? ''}`}
				isOpen={cancelling !== null}
				onClose={() => setCancelling(null)}
				submitLabel='Cancel cheque'
				saving={reason.saving}
				onSubmit={async () => {
					if (!cancelling) return;
					const ok = await reason.submit(
						() => chequeLeafService.cancel(cancelling.id, reason.values.reason),
						{
							title: 'Cheque cancelled',
							message: `Cheque ${cancelling.cheque_number} was cancelled.`,
						},
					);
					if (ok) {
						setCancelling(null);
						leaves.reload();
						onChanged();
					}
				}}>
				<p className='small text-muted'>
					Use this for spoilt, lost or destroyed unused cheques. A cancelled cheque can
					only return to use through an approved Cheque Reactive request.
				</p>
				<TextField
					id='cancel-reason'
					label='Reason'
					required
					multiline
					className='col-12'
					value={reason.values.reason}
					onChange={(v) => reason.setField('reason', v)}
					feedback={reason.feedback('reason')}
				/>
			</FormModal>

			<FormModal
				id='cheque-history-modal'
				title={`Cheque ${history?.cheque_number ?? ''} history`}
				isOpen={history !== null}
				onClose={() => setHistory(null)}>
				{history && (
					<>
						<div className='mb-3'>
							Current state: <StateBadge state={history.state} />
						</div>
						{history.history?.length ? (
							<div className='table-responsive'>
								<table className='table table-sm align-middle mb-0'>
									<thead>
										<tr>
											<th>When</th>
											<th>Change</th>
											<th>By</th>
											<th>Reason</th>
										</tr>
									</thead>
									<tbody>
										{history.history.map((h) => (
											<tr key={h.id}>
												<td className='text-nowrap'>
													{formatDateTime(h.created_at)}
												</td>
												<td className='text-nowrap'>
													<StateBadge state={h.from_state} /> →{' '}
													<StateBadge state={h.to_state} />
												</td>
												<td>{h.user?.full_name ?? '—'}</td>
												<td className='text-break'>
													{h.reason}
													{h.cheque_reactivation_id && (
														<span className='text-muted'>
															{' '}
															(reactivation #
															{h.cheque_reactivation_id})
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className='text-muted mb-0'>No state changes yet.</p>
						)}
					</>
				)}
			</FormModal>
		</>
	);
};

const ChequeBooksPage = () => {
	const [accountId, setAccountId] = useState<number | null>(null);
	const accounts = useOptions('bank-accounts');
	const list = useServerList(chequeBookService.list, {
		defaultSort: 'issued_date',
		defaultDirection: 'desc',
		entity: 'cheque books',
		filters: { bank_account_id: accountId },
	});
	const crud = useCrudController({
		service: chequeBookService,
		permission: 'cheque-book',
		entity: 'Cheque book',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;
	const rangeLocked = crud.mode === 'edit' && Boolean(record?.is_used);
	const hint = rangeHint(form.values.start_cheque_number, form.values.end_cheque_number);
	const accountLabel = (o: { code: string; name: string }) => `${o.code} – ${o.name}`;

	const columns: DataTableColumn<ChequeBook>[] = [
		{
			id: 'bank_account',
			label: 'Bank account',
			cell: (r) => (r.bank_account ? `${r.bank_account.code} – ${r.bank_account.name}` : '—'),
		},
		{ id: 'bank', label: 'Bank', cell: (r) => r.bank?.name, hideBelow: 'lg' },
		{
			id: 'start_cheque_number',
			label: 'Cheque range',
			sortable: true,
			cell: (r) => (
				<span className='font-monospace text-nowrap'>
					{r.start_cheque_number} – {r.end_cheque_number}
				</span>
			),
		},
		{
			id: 'available_leaves',
			label: 'Available',
			cell: (r) => `${r.available_leaves ?? 0} / ${r.total_leaves}`,
			hideBelow: 'md',
		},
		{
			id: 'issued_date',
			label: 'Issued',
			sortable: true,
			cell: (r) => (r.issued_date ? formatDate(r.issued_date) : '—'),
			hideBelow: 'xl',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={`cheque book ${r.start_cheque_number}`}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Cheque Books'
			createLabel='Add cheque book'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<SelectField
					id='cheque-book-filter-account'
					label='Bank account'
					className='col-md-6'
					options={accounts.options}
					loading={accounts.loading}
					optionLabel={accountLabel}
					value={accountId}
					onChange={setAccountId}
				/>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='cheque books'
				getRowId={(r) => r.id}
				exportEnabled={false}
				emptyMessage='No cheque books found.'
			/>
			<FormModal
				id='cheque-book-modal'
				size='xl'
				title={
					{ create: 'Add cheque book', edit: 'Edit cheque book', view: 'Cheque book' }[
						crud.mode ?? 'view'
					]
				}
				isOpen={crud.mode !== null}
				onClose={crud.close}
				onSubmit={readOnly ? undefined : crud.save}
				saving={form.saving}>
				{readOnly && record ? (
					<>
						<DetailList
							items={[
								{
									label: 'Bank account',
									value: record.bank_account
										? accountLabel(record.bank_account)
										: null,
								},
								{ label: 'Bank', value: record.bank?.name },
								{ label: 'Cheque book no.', value: record.cheque_book_number },
								{
									label: 'Cheque range',
									value: `${record.start_cheque_number} – ${record.end_cheque_number} (${record.total_leaves} leaves)`,
								},
								{
									label: 'Issued date',
									value: record.issued_date
										? formatDate(record.issued_date)
										: null,
								},
								{
									label: 'Received date',
									value: record.received_date
										? formatDate(record.received_date)
										: null,
								},
								...auditDetails(record),
							]}
						/>
						<div className='d-flex flex-wrap gap-2 my-3'>
							{STATES.map((s) => (
								<Badge
									key={s}
									color={CHEQUE_STATE_COLORS[s]}
									isLight
									className='py-2 px-3'>
									{s[0].toUpperCase() + s.slice(1)}:{' '}
									{record.state_counts?.[s] ?? 0}
								</Badge>
							))}
						</div>
						<ChequeLeavesPanel
							bookId={record.id}
							canCancel={crud.can.update}
							onChanged={list.reload}
						/>
					</>
				) : (
					<div className='row g-3'>
						<SelectField
							id='bank_account_id'
							label='Bank account'
							required
							className='col-md-8'
							options={accounts.options}
							loading={accounts.loading}
							optionLabel={accountLabel}
							disabled={rangeLocked}
							value={form.values.bank_account_id}
							onChange={(v) => form.setField('bank_account_id', v)}
							feedback={form.feedback('bank_account_id')}
						/>
						<TextField
							id='cheque_book_number'
							label='Cheque book no.'
							className='col-md-4'
							value={form.values.cheque_book_number}
							onChange={(v) => form.setField('cheque_book_number', v)}
							feedback={form.feedback('cheque_book_number')}
						/>
						<TextField
							id='start_cheque_number'
							label='Start cheque no.'
							required
							className='col-md-3'
							disabled={rangeLocked}
							value={form.values.start_cheque_number}
							onChange={(v) =>
								form.setField('start_cheque_number', v.replace(/\D/g, ''))
							}
							feedback={form.feedback('start_cheque_number')}
						/>
						<TextField
							id='end_cheque_number'
							label='End cheque no.'
							required
							className='col-md-3'
							disabled={rangeLocked}
							value={form.values.end_cheque_number}
							onChange={(v) =>
								form.setField('end_cheque_number', v.replace(/\D/g, ''))
							}
							feedback={form.feedback('end_cheque_number')}
						/>
						<TextField
							id='issued_date'
							label='Issued date'
							type='date'
							required
							className='col-md-3'
							value={form.values.issued_date}
							onChange={(v) => form.setField('issued_date', v)}
							feedback={form.feedback('issued_date')}
						/>
						<TextField
							id='received_date'
							label='Received date'
							type='date'
							className='col-md-3'
							value={form.values.received_date}
							onChange={(v) => form.setField('received_date', v)}
							feedback={form.feedback('received_date')}
						/>
						<div
							className={`col-12 form-text ${hint && !hint.ok ? 'text-danger' : ''}`}>
							{rangeLocked
								? 'Cheques in this book have been used, so the account and range can no longer change.'
								: (hint?.text ??
									'Enter digits only; keep leading zeros (e.g. 000101 – 000150).')}
						</div>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default ChequeBooksPage;
