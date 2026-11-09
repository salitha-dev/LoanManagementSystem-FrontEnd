import React from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { Province, ProvincePayload, provinceService } from '../../api/admin.service';

type Form = ProvincePayload;
const EMPTY: Form = { province_code: '', province_name: '' };
const toForm = (r: Province): Form => ({
	province_code: r.province_code,
	province_name: r.province_name,
});
const toPayload = (f: Form): ProvincePayload => f;

const ProvincesPage = () => {
	const list = useServerList(provinceService.list, {
		defaultSort: 'province_name',
		entity: 'provinces',
	});
	const crud = useCrudController({
		service: provinceService,
		permission: 'province',
		entity: 'Province',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';

	const columns: DataTableColumn<Province>[] = [
		{ id: 'province_code', label: 'Code', sortable: true, cell: (r) => r.province_code },
		{ id: 'province_name', label: 'Province', sortable: true, cell: (r) => r.province_name },
		{
			id: 'districts_count',
			label: 'Districts',
			cell: (r) => r.districts_count ?? 0,
			hideBelow: 'md',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.province_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Provinces'
			createLabel='Add province'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='provinces'
				getRowId={(r) => r.id}
				exportFileName='provinces'
				emptyMessage='No provinces found.'
			/>
			<FormModal
				id='province-modal'
				title={
					{ create: 'Add province', edit: 'Edit province', view: 'Province' }[
						crud.mode ?? 'view'
					]
				}
				isOpen={crud.mode !== null}
				onClose={crud.close}
				onSubmit={readOnly ? undefined : crud.save}
				saving={form.saving}>
				{readOnly && crud.record ? (
					<DetailList
						items={[
							{ label: 'Code', value: crud.record.province_code },
							{ label: 'Province', value: crud.record.province_name },
							{ label: 'Districts', value: crud.record.districts_count ?? 0 },
							...auditDetails(crud.record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<TextField
							id='province_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.province_code}
							onChange={(v) => form.setField('province_code', v.toUpperCase())}
							feedback={form.feedback('province_code')}
						/>
						<TextField
							id='province_name'
							label='Province name'
							required
							className='col-md-8'
							value={form.values.province_name}
							onChange={(v) => form.setField('province_name', v)}
							feedback={form.feedback('province_name')}
						/>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default ProvincesPage;
