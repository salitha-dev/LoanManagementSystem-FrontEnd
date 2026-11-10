import React, { useContext, useEffect, useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import DetailList from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Badge from '../../components/bootstrap/Badge';
import Button from '../../components/bootstrap/Button';
import Spinner from '../../components/bootstrap/Spinner';
import useServerList from '../../hooks/useServerList';
import useOptions from '../../hooks/useOptions';
import useFormState from '../../hooks/useFormState';
import useConfirm from '../../hooks/useConfirm';
import AuthContext from '../../contexts/authContext';
import { hasPermission } from '../../helpers/permissions';
import { formatDateTime } from '../../helpers/datetime';
import { showAppError, showAppSuccess } from '../../helpers/appNotify';
import { ApiError, Reference } from '../../api/types';
import {
	ChequeLeaf,
	ChequeReactivation,
	chequeReactivationService,
} from '../../api/finance.service';
import { StateBadge } from './ChequeBooksPage';

const STATUS_OPTIONS = [
	{ id: 1, code: 'pending', name: 'Pending' },
	{ id: 2, code: 'approved', name: 'Approved' },
	{ id: 3, code: 'rejected', name: 'Rejected' },
];
const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;

const StatusBadge = ({ status }: { status: ChequeReactivation['status'] }) => (
	<Badge color={STATUS_COLORS[status]} isLight>
		{status[0].toUpperCase() + status.slice(1)}
	</Badge>
);

const accountLabel = (o: { code: string; name: string }) => `${o.code} – ${o.name}`;

/**
 * Cheque Reactive: maker-checker requests to return a cancelled, never-issued cheque to
 * Available. Requests are history; there is no edit or delete.
 */
const ChequeReactivePage = () => {
	const { user } = useContext(AuthContext);
	const confirm = useConfirm();
	const can = {
		create: hasPermission(user, 'cheque-reactive.create'),
		approve: hasPermission(user, 'cheque-reactive.approve'),
		reject: hasPermission(user, 'cheque-reactive.reject'),
	};

	const accounts = useOptions('bank-accounts');
	const [status, setStatus] = useState<number | null>(1);
	const [accountId, setAccountId] = useState<number | null>(null);
	const list = useServerList(chequeReactivationService.list, {
		defaultSort: 'created_at',
		defaultDirection: 'desc',
		entity: 'reactivation requests',
		filters: {
			status: STATUS_OPTIONS.find((o) => o.id === status)?.code,
			bank_account_id: accountId,
		},
	});

	// New request
	const form = useFormState<{
		bank_account_id: number | null;
		cheque_leaf_id: number | null;
		reason: string;
	}>({
		bank_account_id: null,
		cheque_leaf_id: null,
		reason: '',
	});
	const [creating, setCreating] = useState(false);
	const [eligible, setEligible] = useState<ChequeLeaf[]>([]);
	const [loadingEligible, setLoadingEligible] = useState(false);
	const selectedAccount = form.values.bank_account_id;

	useEffect(() => {
		if (!creating || !selectedAccount) return undefined;
		let active = true;
		chequeReactivationService
			.eligibleLeaves(selectedAccount)
			.then((rows) => active && setEligible(rows))
			.catch(() => active && setEligible([]))
			.finally(() => active && setLoadingEligible(false));
		return () => {
			active = false;
		};
	}, [creating, selectedAccount]);

	const eligibleOptions: Reference[] = eligible.map((l) => ({
		id: l.id,
		code: l.cheque_number,
		name: l.cheque_number,
	}));
	const chosenLeaf = eligible.find((l) => l.id === form.values.cheque_leaf_id);
	const cancelEvent = chosenLeaf?.history?.filter((h) => h.to_state === 'cancelled').at(-1);

	// Detail / decision
	const [detail, setDetail] = useState<ChequeReactivation | null>(null);
	const [busy, setBusy] = useState(false);
	const rejectForm = useFormState({ reason: '' });
	const [rejecting, setRejecting] = useState(false);

	const open = async (row: ChequeReactivation) => {
		try {
			setDetail(await chequeReactivationService.get(row.id));
			setRejecting(false);
			rejectForm.reset({ reason: '' });
		} catch (error) {
			showAppError('Could not open request', (error as Error).message);
		}
	};

	const approve = async () => {
		if (!detail) return;
		const ok = await confirm({
			title: 'Approve reactivation',
			message: `Return cheque ${detail.cheque_leaf?.cheque_number} to Available?`,
			subMessage:
				'The cheque can then be used again. This is recorded in the cheque history and activity log.',
			confirmLabel: 'Yes, approve',
			confirmColor: 'success',
			icon: 'CheckCircle',
		});
		if (!ok) return;
		setBusy(true);
		try {
			setDetail(await chequeReactivationService.approve(detail.id));
			showAppSuccess('Request approved', 'The cheque is available again.');
			list.reload();
		} catch (error) {
			showAppError(
				'Could not approve',
				error instanceof ApiError ? error.message : 'Please try again.',
			);
		} finally {
			setBusy(false);
		}
	};

	const reject = async () => {
		if (!detail) return;
		const ok = await rejectForm.submit(
			async () =>
				setDetail(
					await chequeReactivationService.reject(detail.id, rejectForm.values.reason),
				),
			{ title: 'Request rejected', message: 'The cheque stays cancelled.' },
		);
		if (ok) {
			setRejecting(false);
			list.reload();
		}
	};

	const columns: DataTableColumn<ChequeReactivation>[] = [
		{ id: 'id', label: 'Request', cell: (r) => `#${r.id}` },
		{
			id: 'cheque',
			label: 'Cheque',
			cell: (r) => <span className='font-monospace'>{r.cheque_leaf?.cheque_number}</span>,
		},
		{
			id: 'account',
			label: 'Bank account',
			cell: (r) =>
				r.cheque_leaf?.bank_account ? accountLabel(r.cheque_leaf.bank_account) : '—',
			hideBelow: 'lg',
		},
		{
			id: 'status',
			label: 'Status',
			sortable: true,
			cell: (r) => <StatusBadge status={r.status} />,
		},
		{
			id: 'requested_by',
			label: 'Requested by',
			cell: (r) => r.requested_by?.full_name,
			hideBelow: 'md',
		},
		{
			id: 'created_at',
			label: 'Requested',
			sortable: true,
			cell: (r) => <span className='text-nowrap'>{formatDateTime(r.created_at)}</span>,
			hideBelow: 'md',
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
						aria-label={`View request ${r.id}`}
						onClick={() => void open(r)}
					/>
				</div>
			),
		},
	];

	const decidedBy = detail?.approved_by ?? detail?.rejected_by;
	const decidedAt = detail?.approved_at ?? detail?.rejected_at;

	return (
		<CrudPage
			title='Cheque Reactive'
			createLabel='New reactivation request'
			onCreate={
				can.create
					? () => {
							form.reset({ bank_account_id: null, cheque_leaf_id: null, reason: '' });
							setEligible([]);
							setCreating(true);
						}
					: undefined
			}
			filters={
				<>
					<SelectField
						id='reactive-filter-status'
						label='Status'
						className='col-md-3'
						options={STATUS_OPTIONS}
						optionLabel={(o) => o.name}
						value={status}
						onChange={setStatus}
					/>
					<SelectField
						id='reactive-filter-account'
						label='Bank account'
						className='col-md-5'
						options={accounts.options}
						loading={accounts.loading}
						optionLabel={accountLabel}
						value={accountId}
						onChange={setAccountId}
					/>
				</>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='reactivation requests'
				getRowId={(r) => r.id}
				exportEnabled={false}
				emptyMessage='No reactivation requests found.'
			/>

			<FormModal
				id='reactive-create-modal'
				title='New cheque reactivation request'
				isOpen={creating}
				onClose={() => setCreating(false)}
				submitLabel='Submit request'
				saving={form.saving}
				onSubmit={async () => {
					const ok = await form.submit(
						() =>
							chequeReactivationService.create({
								cheque_leaf_id: form.values.cheque_leaf_id as number,
								reason: form.values.reason,
							}),
						{
							title: 'Request submitted',
							message: 'Another authorised user must approve it.',
						},
					);
					if (ok) {
						setCreating(false);
						list.reload();
					}
				}}>
				<div className='row g-3'>
					<SelectField
						id='reactive-account'
						label='Bank account'
						required
						className='col-md-7'
						options={accounts.options}
						loading={accounts.loading}
						optionLabel={accountLabel}
						value={form.values.bank_account_id}
						onChange={(v) => {
							setLoadingEligible(Boolean(v));
							setEligible([]);
							form.patch({ bank_account_id: v, cheque_leaf_id: null });
						}}
					/>
					<SelectField
						id='reactive-leaf'
						label='Cancelled cheque'
						required
						className='col-md-5'
						options={eligibleOptions}
						loading={loadingEligible}
						optionLabel={(o) => o.code}
						disabled={!form.values.bank_account_id}
						placeholder={
							!form.values.bank_account_id
								? 'Select an account first'
								: !loadingEligible && !eligible.length
									? 'No eligible cheques'
									: 'Select cheque'
						}
						value={form.values.cheque_leaf_id}
						onChange={(v) => form.setField('cheque_leaf_id', v)}
						feedback={form.feedback('cheque_leaf_id')}
					/>
					{chosenLeaf && (
						<div className='col-12'>
							<div className='border rounded-3 p-3 small'>
								<div>
									Cheque{' '}
									<span className='font-monospace fw-semibold'>
										{chosenLeaf.cheque_number}
									</span>{' '}
									is <StateBadge state={chosenLeaf.state} /> and will return to{' '}
									<StateBadge state='available' /> when approved.
								</div>
								{cancelEvent && (
									<div className='text-muted mt-1'>
										Cancelled {formatDateTime(cancelEvent.created_at)} by{' '}
										{cancelEvent.user?.full_name ?? '—'}: “{cancelEvent.reason}”
									</div>
								)}
							</div>
						</div>
					)}
					<TextField
						id='reactive-reason'
						label='Reason'
						required
						multiline
						className='col-12'
						value={form.values.reason}
						onChange={(v) => form.setField('reason', v)}
						feedback={form.feedback('reason')}
					/>
					<div className='col-12 form-text'>
						Only cancelled cheques that were never issued are listed. A different user
						must approve.
					</div>
				</div>
			</FormModal>

			<FormModal
				id='reactive-detail-modal'
				size='xl'
				title={detail ? `Reactivation request #${detail.id}` : 'Reactivation request'}
				isOpen={detail !== null}
				onClose={() => setDetail(null)}>
				{detail && (
					<>
						<DetailList
							items={[
								{ label: 'Status', value: <StatusBadge status={detail.status} /> },
								{
									label: 'Cheque',
									value: (
										<span>
											<span className='font-monospace'>
												{detail.cheque_leaf?.cheque_number}
											</span>{' '}
											{detail.cheque_leaf && (
												<StateBadge state={detail.cheque_leaf.state} />
											)}
										</span>
									),
								},
								{
									label: 'Bank account',
									value: detail.cheque_leaf?.bank_account
										? accountLabel(detail.cheque_leaf.bank_account)
										: null,
								},
								{
									label: 'Change',
									value: (
										<span>
											<StateBadge state={detail.previous_state} /> →{' '}
											<StateBadge state={detail.requested_state} />
										</span>
									),
								},
								{ label: 'Reason', value: detail.reason },
							]}
						/>

						<div className='fw-semibold mt-3 mb-2'>Request history</div>
						<ul className='list-group mb-3'>
							<li className='list-group-item'>
								<span className='fw-semibold'>Requested</span> by{' '}
								{detail.requested_by?.full_name} ·{' '}
								{formatDateTime(detail.created_at)}
							</li>
							{detail.status !== 'pending' && (
								<li className='list-group-item'>
									<span className='fw-semibold'>
										{detail.status === 'approved' ? 'Approved' : 'Rejected'}
									</span>{' '}
									by {decidedBy?.full_name} · {formatDateTime(decidedAt ?? null)}
									{detail.rejection_reason && (
										<div className='text-muted small'>
											“{detail.rejection_reason}”
										</div>
									)}
								</li>
							)}
						</ul>

						<div className='fw-semibold mb-2'>Cheque history</div>
						{detail.cheque_leaf?.history?.length ? (
							<div className='table-responsive mb-3'>
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
										{detail.cheque_leaf.history.map((h) => (
											<tr key={h.id}>
												<td className='text-nowrap'>
													{formatDateTime(h.created_at)}
												</td>
												<td className='text-nowrap'>
													<StateBadge state={h.from_state} /> →{' '}
													<StateBadge state={h.to_state} />
												</td>
												<td>{h.user?.full_name ?? '—'}</td>
												<td className='text-break'>{h.reason}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className='text-muted'>No history.</p>
						)}

						{detail.status === 'pending' && !detail.can_decide && (
							<div className='alert alert-info py-2 small mb-0'>
								Waiting for another authorised user to approve or reject (you cannot
								decide your own request).
							</div>
						)}
						{detail.can_decide && (can.approve || can.reject) && (
							<div className='border-top pt-3'>
								{rejecting ? (
									<div className='row g-2 align-items-end'>
										<TextField
											id='reject-reason'
											label='Rejection reason'
											required
											className='col-md-9'
											value={rejectForm.values.reason}
											onChange={(v) => rejectForm.setField('reason', v)}
											feedback={rejectForm.feedback('reason')}
										/>
										<div className='col-md-3 d-flex gap-2'>
											<Button
												color='light'
												onClick={() => setRejecting(false)}>
												Back
											</Button>
											<Button
												action='reject'
												isDisable={rejectForm.saving}
												onClick={() => void reject()}>
												{rejectForm.saving && <Spinner isSmall inButton />}{' '}
												Reject
											</Button>
										</div>
									</div>
								) : (
									<div className='d-flex gap-2 justify-content-end'>
										{can.reject && (
											<Button
												action='reject'
												isDisable={busy}
												onClick={() => setRejecting(true)}>
												Reject
											</Button>
										)}
										{can.approve && (
											<Button
												action='approve'
												isDisable={busy}
												onClick={() => void approve()}>
												{busy && <Spinner isSmall inButton />} Approve
											</Button>
										)}
									</div>
								)}
							</div>
						)}
					</>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default ChequeReactivePage;
