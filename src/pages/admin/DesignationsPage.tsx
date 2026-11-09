import React from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { Designation, DesignationPayload, designationService } from '../../api/admin.service';

type Form = { designation_code: string; designation_name: string; description: string };
const EMPTY: Form = { designation_code: '', designation_name: '', description: '' };
const toForm = (r: Designation): Form => ({
	designation_code: r.designation_code,
	designation_name: r.designation_name,
	description: r.description ?? '',
});
const toPayload = (f: Form): DesignationPayload => ({ ...f, description: f.description || null });

/** Designation = organisational position (not a system role). */
const DesignationsPage = () => {
	const list = useServerList(designationService.list, {
		defaultSort: 'designation_name',
		entity: 'designations',
	});
	const crud = useCrudController({
		service: designationService,
		permission: 'designation',
		entity: 'Designation',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<Designation>[] = [
		{ id: 'designation_code', label: 'Code', sortable: true, cell: (r) => r.designation_code },
		{
			id: 'designation_name',
			label: 'Designation',
			sortable: true,
			cell: (r) => r.designation_name,
		},
		{
			id: 'description',
			label: 'Description',
			cell: (r) => (
				<span className='text-truncate d-inline-block' style={{ maxWidth: 320 }}>
					{r.description ?? '—'}
				</span>
			),
			hideBelow: 'lg',
		},
		{ id: 'users_count', label: 'Users', cell: (r) => r.users_count ?? 0, hideBelow: 'md' },
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.designation_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Designations'
			createLabel='Add designation'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='designations'
				getRowId={(r) => r.id}
				exportFileName='designations'
				emptyMessage='No designations found.'
			/>
			<FormModal
				id='designation-modal'
				title={
					{ create: 'Add designation', edit: 'Edit designation', view: 'Designation' }[
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
							{ label: 'Code', value: record.designation_code },
							{ label: 'Designation', value: record.designation_name },
							{ label: 'Description', value: record.description },
							{ label: 'Users', value: record.users_count ?? 0 },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<TextField
							id='designation_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.designation_code}
							onChange={(v) => form.setField('designation_code', v.toUpperCase())}
							feedback={form.feedback('designation_code')}
						/>
						<TextField
							id='designation_name'
							label='Designation name'
							required
							className='col-md-8'
							value={form.values.designation_name}
							onChange={(v) => form.setField('designation_name', v)}
							feedback={form.feedback('designation_name')}
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
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default DesignationsPage;
