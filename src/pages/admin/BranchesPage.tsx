import React, { useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import GeoSelect, { EMPTY_GEO, GeoValue } from '../../components/common/GeoSelect';
import LocationPicker from '../../components/common/LocationPicker';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { formatDate } from '../../helpers/datetime';
import { Branch, BranchPayload, branchService } from '../../api/admin.service';

type Form = GeoValue & {
	branch_code: string;
	branch_name: string;
	address: string;
	contact_number: string;
	email: string;
	opening_date: string;
	latitude: number | null;
	longitude: number | null;
};
const EMPTY: Form = {
	...EMPTY_GEO,
	branch_code: '',
	branch_name: '',
	address: '',
	contact_number: '',
	email: '',
	opening_date: '',
	latitude: null,
	longitude: null,
};
const toForm = (r: Branch): Form => ({
	province_id: r.province_id,
	district_id: r.district_id,
	dsd_id: r.dsd_id,
	gnd_id: r.gnd_id,
	branch_code: r.branch_code,
	branch_name: r.branch_name,
	address: r.address,
	contact_number: r.contact_number ?? '',
	email: r.email ?? '',
	opening_date: r.opening_date ?? '',
	latitude: r.latitude,
	longitude: r.longitude,
});
const toPayload = (f: Form): BranchPayload => ({
	branch_code: f.branch_code,
	branch_name: f.branch_name,
	address: f.address,
	province_id: f.province_id as number,
	district_id: f.district_id as number,
	dsd_id: f.dsd_id as number,
	gnd_id: f.gnd_id as number,
	contact_number: f.contact_number || null,
	email: f.email || null,
	opening_date: f.opening_date || null,
	latitude: f.latitude,
	longitude: f.longitude,
});

const BranchesPage = () => {
	const [filter, setFilter] = useState<GeoValue>(EMPTY_GEO);
	const list = useServerList(branchService.list, {
		defaultSort: 'branch_name',
		entity: 'branches',
		filters: {
			province_id: filter.province_id,
			district_id: filter.district_id,
			dsd_id: filter.dsd_id,
		},
	});
	const crud = useCrudController({
		service: branchService,
		permission: 'branch',
		entity: 'Branch',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<Branch>[] = [
		{ id: 'branch_code', label: 'Code', sortable: true, cell: (r) => r.branch_code },
		{ id: 'branch_name', label: 'Branch', sortable: true, cell: (r) => r.branch_name },
		{ id: 'district', label: 'District', cell: (r) => r.district?.name, hideBelow: 'md' },
		{
			id: 'contact_number',
			label: 'Contact',
			cell: (r) => r.contact_number ?? '—',
			hideBelow: 'lg',
		},
		{
			id: 'opening_date',
			label: 'Opened',
			sortable: true,
			cell: (r) => (r.opening_date ? formatDate(r.opening_date) : '—'),
			hideBelow: 'xl',
		},
		{ id: 'users_count', label: 'Users', cell: (r) => r.users_count ?? 0, hideBelow: 'lg' },
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
			title='Branches'
			createLabel='Add branch'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<GeoSelect
					idPrefix='branch-filter'
					depth='dsd'
					value={filter}
					onChange={setFilter}
					colClassName='col-md-4'
				/>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='branches'
				getRowId={(r) => r.id}
				exportFileName='branches'
				emptyMessage='No branches found.'
			/>
			<FormModal
				id='branch-modal'
				size='xl'
				title={
					{ create: 'Add branch', edit: 'Edit branch', view: 'Branch' }[
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
							{ label: 'Code', value: record.branch_code },
							{ label: 'Branch', value: record.branch_name },
							{ label: 'Address', value: record.address },
							{ label: 'Province', value: record.province?.name },
							{ label: 'District', value: record.district?.name },
							{ label: 'DSD', value: record.dsd?.name },
							{ label: 'GND', value: record.gnd?.name },
							{ label: 'Contact number', value: record.contact_number },
							{ label: 'Email', value: record.email },
							{
								label: 'Opening date',
								value: record.opening_date ? formatDate(record.opening_date) : null,
							},
							{ label: 'Assigned users', value: record.users_count ?? 0 },
							{
								label: 'Location',
								value: (
									<LocationPicker
										idPrefix='branch-view'
										latitude={record.latitude}
										longitude={record.longitude}
										readOnly
										height={240}
									/>
								),
							},
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<TextField
							id='branch_code'
							label='Code'
							required
							className='col-md-3'
							value={form.values.branch_code}
							onChange={(v) => form.setField('branch_code', v.toUpperCase())}
							feedback={form.feedback('branch_code')}
						/>
						<TextField
							id='branch_name'
							label='Branch name'
							required
							className='col-md-5'
							value={form.values.branch_name}
							onChange={(v) => form.setField('branch_name', v)}
							feedback={form.feedback('branch_name')}
						/>
						<TextField
							id='opening_date'
							label='Opening date'
							type='date'
							className='col-md-4'
							value={form.values.opening_date}
							onChange={(v) => form.setField('opening_date', v)}
							feedback={form.feedback('opening_date')}
						/>
						<TextField
							id='address'
							label='Address'
							required
							multiline
							className='col-12'
							value={form.values.address}
							onChange={(v) => form.setField('address', v)}
							feedback={form.feedback('address')}
						/>
						<GeoSelect
							idPrefix='branch-form'
							depth='gnd'
							value={form.values}
							onChange={(geo) => form.patch(geo)}
							errors={form.errors}
							required
							colClassName='col-md-6 col-lg-3'
						/>
						<TextField
							id='contact_number'
							label='Contact number'
							type='tel'
							value={form.values.contact_number}
							onChange={(v) => form.setField('contact_number', v)}
							feedback={form.feedback('contact_number')}
						/>
						<TextField
							id='email'
							label='Email'
							type='email'
							value={form.values.email}
							onChange={(v) => form.setField('email', v)}
							feedback={form.feedback('email')}
						/>
						<div className='col-12'>
							<div className='fw-semibold mb-2'>Branch location</div>
							<LocationPicker
								idPrefix='branch-form'
								latitude={form.values.latitude}
								longitude={form.values.longitude}
								onChange={(latitude, longitude) =>
									form.patch({ latitude, longitude })
								}
								latitudeFeedback={form.feedback('latitude')}
								longitudeFeedback={form.feedback('longitude')}
							/>
						</div>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default BranchesPage;
