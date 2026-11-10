import React, { useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import BankSelect, { BankValue, EMPTY_BANK } from '../../components/common/BankSelect';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { formatDate } from '../../helpers/datetime';
import {
	BANK_ACCOUNT_TYPES,
	BankAccount,
	BankAccountPayload,
	bankAccountService,
	formatMoney,
} from '../../api/finance.service';

const TYPE_OPTIONS = BANK_ACCOUNT_TYPES.map((t, i) => ({
	id: i + 1,
	code: t.value,
	name: t.label,
}));
const typeId = (value: string) => TYPE_OPTIONS.find((o) => o.code === value)?.id ?? null;
const typeValue = (id: number | null) => TYPE_OPTIONS.find((o) => o.id === id)?.code ?? '';

type Form = BankValue & {
	account_number: string;
	account_name: string;
	account_type: string;
	currency_code: string;
	opening_balance: string;
	opening_date: string;
	description: string;
};
const EMPTY: Form = {
	...EMPTY_BANK,
	account_number: '',
	account_name: '',
	account_type: 'current',
	currency_code: 'LKR',
	opening_balance: '0.00',
	opening_date: '',
	description: '',
};
const toForm = (r: BankAccount): Form => ({
	bank_id: r.bank?.id ?? null,
	bank_branch_id: r.bank_branch_id,
	bank_account_id: null,
	account_number: r.account_number_revealed ? r.account_number : '',
	account_name: r.account_name,
	account_type: r.account_type,
	currency_code: r.currency_code,
	opening_balance: r.opening_balance,
	opening_date: r.opening_date ?? '',
	description: r.description ?? '',
});
const toPayload = (f: Form): BankAccountPayload => ({
	bank_id: f.bank_id,
	bank_branch_id: f.bank_branch_id,
	account_number: f.account_number,
	account_name: f.account_name,
	account_type: f.account_type,
	currency_code: f.currency_code,
	opening_balance: f.opening_balance.trim(),
	opening_date: f.opening_date || null,
	description: f.description || null,
});

const BankAccountsPage = () => {
	const [filter, setFilter] = useState<BankValue>(EMPTY_BANK);
	const [type, setType] = useState<number | null>(null);
	const list = useServerList(bankAccountService.list, {
		defaultSort: 'account_name',
		entity: 'bank accounts',
		filters: {
			bank_id: filter.bank_id,
			bank_branch_id: filter.bank_branch_id,
			account_type: typeValue(type),
		},
	});
	const crud = useCrudController({
		service: bankAccountService,
		permission: 'bank-account',
		entity: 'Bank account',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;
	const balanceLocked = crud.mode === 'edit' && Boolean(record?.has_financial_activity);

	const columns: DataTableColumn<BankAccount>[] = [
		{
			id: 'account_number',
			label: 'Account no.',
			cell: (r) => <span className='font-monospace'>{r.account_number_masked}</span>,
		},
		{ id: 'account_name', label: 'Account name', sortable: true, cell: (r) => r.account_name },
		{ id: 'bank', label: 'Bank', cell: (r) => r.bank?.name, hideBelow: 'md' },
		{ id: 'bank_branch', label: 'Branch', cell: (r) => r.bank_branch?.name, hideBelow: 'lg' },
		{
			id: 'account_type',
			label: 'Type',
			sortable: true,
			cell: (r) => r.account_type_label,
			hideBelow: 'lg',
		},
		{
			id: 'opening_balance',
			label: 'Opening balance',
			className: 'text-end',
			cell: (r) => (
				<span className='text-nowrap'>
					{formatMoney(r.opening_balance, r.currency_code)}
				</span>
			),
			hideBelow: 'xl',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.account_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Bank Accounts'
			createLabel='Add bank account'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<>
					<BankSelect
						idPrefix='bank-account-filter'
						depth='branch'
						value={filter}
						onChange={setFilter}
						colClassName='col-md-4'
					/>
					<SelectField
						id='bank-account-filter-type'
						label='Account type'
						className='col-md-4'
						options={TYPE_OPTIONS}
						optionLabel={(o) => o.name}
						value={type}
						onChange={setType}
					/>
				</>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='bank accounts'
				getRowId={(r) => r.id}
				exportEnabled={false}
				emptyMessage='No bank accounts found.'
			/>
			<FormModal
				id='bank-account-modal'
				size='xl'
				title={
					{ create: 'Add bank account', edit: 'Edit bank account', view: 'Bank account' }[
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
							{ label: 'Branch', value: record.bank_branch?.name },
							{
								label: 'Account number',
								value: (
									<span className='font-monospace'>{record.account_number}</span>
								),
							},
							{ label: 'Account name', value: record.account_name },
							{ label: 'Type', value: record.account_type_label },
							{ label: 'Currency', value: record.currency_code },
							{
								label: 'Opening balance',
								value: formatMoney(record.opening_balance, record.currency_code),
							},
							{
								label: 'Opening date',
								value: record.opening_date ? formatDate(record.opening_date) : null,
							},
							{ label: 'Description', value: record.description },
							{ label: 'Cheque books', value: record.cheque_books_count ?? 0 },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<BankSelect
							idPrefix='bank-account-form'
							depth='branch'
							value={form.values}
							onChange={(next) => form.patch(next)}
							errors={form.errors}
							required
						/>
						<TextField
							id='account_number'
							label='Account number'
							required
							className='col-md-6'
							autoComplete='off'
							value={form.values.account_number}
							onChange={(v) => form.setField('account_number', v.toUpperCase())}
							feedback={form.feedback('account_number')}
						/>
						<TextField
							id='account_name'
							label='Account name'
							required
							className='col-md-6'
							value={form.values.account_name}
							onChange={(v) => form.setField('account_name', v)}
							feedback={form.feedback('account_name')}
						/>
						<SelectField
							id='account_type'
							label='Account type'
							required
							className='col-md-4'
							options={TYPE_OPTIONS}
							optionLabel={(o) => o.name}
							value={typeId(form.values.account_type)}
							onChange={(v) => form.setField('account_type', typeValue(v))}
							feedback={form.feedback('account_type')}
						/>
						<TextField
							id='currency_code'
							label='Currency'
							required
							className='col-md-2'
							disabled={balanceLocked}
							value={form.values.currency_code}
							onChange={(v) =>
								form.setField('currency_code', v.toUpperCase().slice(0, 3))
							}
							feedback={form.feedback('currency_code')}
						/>
						<TextField
							id='opening_balance'
							label='Opening balance'
							required
							className='col-md-3'
							disabled={balanceLocked}
							value={form.values.opening_balance}
							onChange={(v) =>
								form.setField('opening_balance', v.replace(/[^0-9.-]/g, ''))
							}
							feedback={form.feedback('opening_balance')}
						/>
						<TextField
							id='opening_date'
							label='Opening date'
							type='date'
							className='col-md-3'
							value={form.values.opening_date}
							onChange={(v) => form.setField('opening_date', v)}
							feedback={form.feedback('opening_date')}
						/>
						<TextField
							id='description'
							label='Description'
							multiline
							className='col-12'
							value={form.values.description}
							onChange={(v) => form.setField('description', v)}
							feedback={form.feedback('description')}
						/>
						<div className='col-12 form-text'>
							{balanceLocked
								? 'Opening balance and currency are locked because this account has financial activity.'
								: 'The opening balance is initial data only; no accounting entry is posted.'}
						</div>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default BankAccountsPage;
