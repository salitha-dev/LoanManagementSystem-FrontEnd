import React, { useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import useOptions from '../../hooks/useOptions';
import { BankBranch, BankBranchPayload, bankBranchService } from '../../api/finance.service';

type Form = {
	bank_id: number | null;
	branch_code: string;
	branch_name: string;
	address: string;
	contact_number: string;
};
const EMPTY: Form = {
	bank_id: null,
	branch_code: '',
	branch_name: '',
	address: '',
	contact_number: '',
};
const toForm = (r: BankBranch): Form => ({
	bank_id: r.bank_id,
	branch_code: r.branch_code,
	branch_name: r.branch_name,
	address: r.address ?? '',
	contact_number: r.contact_number ?? '',
});
const toPayload = (f: Form): BankBranchPayload => ({
	bank_id: f.bank_id as number,
	branch_code: f.branch_code,
	branch_name: f.branch_name,
	address: f.address || null,
	contact_number: f.contact_number || null,
});

const BankBranchesPage = () => {
	const [bankId, setBankId] = useState<number | null>(null);
	const banks = useOptions('banks');
	const list = useServerList(bankBranchService.list, {
		defaultSort: 'branch_name',
		entity: 'bank branches',
		filters: { bank_id: bankId },
	});
	const crud = useCrudController({
		service: bankBranchService,
		permission: 'bank-branch',
		entity: 'Bank branch',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<BankBranch>[] = [
		{ id: 'branch_code', label: 'Code', sortable: true, cell: (r) => r.branch_code },
		{ id: 'branch_name', label: 'Branch', sortable: true, cell: (r) => r.branch_name },
		{ id: 'bank', label: 'Bank', cell: (r) => r.bank?.name, hideBelow: 'md' },
		{
			id: 'contact_number',
			label: 'Contact',
			cell: (r) => r.contact_number ?? '—',
			hideBelow: 'lg',
		},
		{
			id: 'accounts_count',
			label: 'Accounts',
			cell: (r) => r.accounts_count ?? 0,
			hideBelow: 'xl',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.branch_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Bank Branches'
			createLabel='Add bank branch'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<SelectField
					id='bank-branch-filter-bank'
					label='Bank'
					className='col-md-4'
					options={banks.options}
					loading={banks.loading}
					value={bankId}
					onChange={setBankId}
				/>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='bank branches'
				getRowId={(r) => r.id}
				exportFileName='bank-branches'
				emptyMessage='No bank branches found.'
			/>
			<FormModal
				id='bank-branch-modal'
				title={
					{ create: 'Add bank branch', edit: 'Edit bank branch', view: 'Bank branch' }[
						crud.mode ?? 'view'
					]
				}
				isOpen={crud.mode !== null}
				onClose={crud.close}
				onSubmit={readOnly ? undefined : crud.save}
				saving={form.saving}>
				{readOnly && record ? (
					<DetailList
						items={[
							{ label: 'Bank', value: record.bank?.name },
							{ label: 'Code', value: record.branch_code },
							{ label: 'Branch', value: record.branch_name },
							{ label: 'Address', value: record.address },
							{ label: 'Contact number', value: record.contact_number },
							{ label: 'Accounts', value: record.accounts_count ?? 0 },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<SelectField
							id='bank_id'
							label='Bank'
							required
							className='col-12'
							options={banks.options}
							loading={banks.loading}
							value={form.values.bank_id}
							onChange={(v) => form.setField('bank_id', v)}
							feedback={form.feedback('bank_id')}
						/>
						<TextField
							id='branch_code'
							label='Branch code'
							required
							className='col-md-4'
							value={form.values.branch_code}
							onChange={(v) => form.setField('branch_code', v.toUpperCase())}
							feedback={form.feedback('branch_code')}
						/>
						<TextField
							id='branch_name'
							label='Branch name'
							required
							className='col-md-8'
							value={form.values.branch_name}
							onChange={(v) => form.setField('branch_name', v)}
							feedback={form.feedback('branch_name')}
						/>
						<TextField
							id='address'
							label='Address'
							multiline
							className='col-12'
							value={form.values.address}
							onChange={(v) => form.setField('address', v)}
							feedback={form.feedback('address')}
						/>
						<TextField
							id='contact_number'
							label='Contact number'
							type='tel'
							className='col-md-6'
							value={form.values.contact_number}
							onChange={(v) => form.setField('contact_number', v)}
							feedback={form.feedback('contact_number')}
						/>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default BankBranchesPage;
