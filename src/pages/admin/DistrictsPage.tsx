import React, { useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import GeoSelect, { EMPTY_GEO, GeoValue } from '../../components/common/GeoSelect';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { District, DistrictPayload, districtService } from '../../api/admin.service';

type Form = GeoValue & { district_code: string; district_name: string };
const EMPTY: Form = { ...EMPTY_GEO, district_code: '', district_name: '' };
const toForm = (r: District): Form => ({
	...EMPTY_GEO,
	province_id: r.province_id,
	district_code: r.district_code,
	district_name: r.district_name,
});
const toPayload = (f: Form): DistrictPayload => ({
	province_id: f.province_id as number,
	district_code: f.district_code,
	district_name: f.district_name,
});

const DistrictsPage = () => {
	const [filter, setFilter] = useState<GeoValue>(EMPTY_GEO);
	const list = useServerList(districtService.list, {
		defaultSort: 'district_name',
		entity: 'districts',
		filters: {
			province_id: filter.province_id,
		},
	});
	const crud = useCrudController({
		service: districtService,
		permission: 'district',
		entity: 'District',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<District>[] = [
		{ id: 'district_code', label: 'Code', sortable: true, cell: (r) => r.district_code },
		{ id: 'district_name', label: 'District', sortable: true, cell: (r) => r.district_name },
		{ id: 'province', label: 'Province', cell: (r) => r.province?.name, hideBelow: 'md' },
		{ id: 'dsds_count', label: 'DSDs', cell: (r) => r.dsds_count ?? 0, hideBelow: 'lg' },
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.district_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Districts'
			createLabel='Add district'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<GeoSelect
					idPrefix='district-filter'
					depth='province'
					value={filter}
					onChange={setFilter}
					colClassName='col-md-4'
				/>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='districts'
				getRowId={(r) => r.id}
				exportFileName='districts'
				emptyMessage='No districts found.'
			/>
			<FormModal
				id='district-modal'
				title={
					{ create: 'Add district', edit: 'Edit district', view: 'District' }[
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
							{ label: 'Code', value: record.district_code },
							{ label: 'District', value: record.district_name },
							{ label: 'Province', value: record.province?.name },
							{ label: 'DSDs', value: record.dsds_count ?? 0 },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<GeoSelect
							idPrefix='district-form'
							depth='province'
							value={form.values}
							onChange={(geo) => form.patch(geo)}
							errors={form.errors}
							required
						/>
						<TextField
							id='district_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.district_code}
							onChange={(v) => form.setField('district_code', v.toUpperCase())}
							feedback={form.feedback('district_code')}
						/>
						<TextField
							id='district_name'
							label='District name'
							required
							className='col-md-8'
							value={form.values.district_name}
							onChange={(v) => form.setField('district_name', v)}
							feedback={form.feedback('district_name')}
						/>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default DistrictsPage;
