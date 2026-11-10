import React from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { Bank, BankPayload, bankService } from '../../api/finance.service';

type Form = { bank_code: string; bank_name: string; short_name: string };
const EMPTY: Form = { bank_code: '', bank_name: '', short_name: '' };
const toForm = (r: Bank): Form => ({
	bank_code: r.bank_code,
	bank_name: r.bank_name,
	short_name: r.short_name ?? '',
});
const toPayload = (f: Form): BankPayload => ({ ...f, short_name: f.short_name || null });

const BanksPage = () => {
	const list = useServerList(bankService.list, { defaultSort: 'bank_name', entity: 'banks' });
	const crud = useCrudController({
		service: bankService,
		permission: 'bank',
		entity: 'Bank',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<Bank>[] = [
		{ id: 'bank_code', label: 'Code', sortable: true, cell: (r) => r.bank_code },
		{ id: 'bank_name', label: 'Bank', sortable: true, cell: (r) => r.bank_name },
		{
			id: 'short_name',
			label: 'Short name',
			sortable: true,
			cell: (r) => r.short_name ?? '—',
			hideBelow: 'md',
		},
		{
			id: 'branches_count',
			label: 'Branches',
			cell: (r) => r.branches_count ?? 0,
			hideBelow: 'lg',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.bank_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Banks'
			createLabel='Add bank'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='banks'
				getRowId={(r) => r.id}
				exportFileName='banks'
				emptyMessage='No banks found.'
			/>
			<FormModal
				id='bank-modal'
				title={{ create: 'Add bank', edit: 'Edit bank', view: 'Bank' }[crud.mode ?? 'view']}
				isOpen={crud.mode !== null}
				onClose={crud.close}
				onSubmit={readOnly ? undefined : crud.save}
				saving={form.saving}>
				{readOnly && record ? (
					<DetailList
						items={[
							{ label: 'Code', value: record.bank_code },
							{ label: 'Bank', value: record.bank_name },
							{ label: 'Short name', value: record.short_name },
							{ label: 'Branches', value: record.branches_count ?? 0 },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<TextField
							id='bank_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.bank_code}
							onChange={(v) => form.setField('bank_code', v.toUpperCase())}
							feedback={form.feedback('bank_code')}
						/>
						<TextField
							id='bank_name'
							label='Bank name'
							required
							className='col-md-8'
							value={form.values.bank_name}
							onChange={(v) => form.setField('bank_name', v)}
							feedback={form.feedback('bank_name')}
						/>
						<TextField
							id='short_name'
							label='Short name'
							className='col-md-4'
							value={form.values.short_name}
							onChange={(v) => form.setField('short_name', v)}
							feedback={form.feedback('short_name')}
						/>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default BanksPage;
