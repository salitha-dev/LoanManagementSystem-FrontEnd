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
import { Dsd, DsdPayload, dsdService } from '../../api/admin.service';

type Form = GeoValue & { dsd_code: string; dsd_name: string };
const EMPTY: Form = { ...EMPTY_GEO, dsd_code: '', dsd_name: '' };
const toForm = (r: Dsd): Form => ({
	...EMPTY_GEO,
	province_id: r.province?.id ?? null,
	district_id: r.district_id,
	dsd_code: r.dsd_code,
	dsd_name: r.dsd_name,
});
const toPayload = (f: Form): DsdPayload => ({
	district_id: f.district_id as number,
	dsd_code: f.dsd_code,
	dsd_name: f.dsd_name,
});

const DsdsPage = () => {
	const [filter, setFilter] = useState<GeoValue>(EMPTY_GEO);
	const list = useServerList(dsdService.list, {
		defaultSort: 'dsd_name',
		entity: 'DSDs',
		filters: {
			province_id: filter.province_id,
			district_id: filter.district_id,
		},
	});
	const crud = useCrudController({
		service: dsdService,
		permission: 'dsd',
		entity: 'DSD',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<Dsd>[] = [
		{ id: 'dsd_code', label: 'Code', sortable: true, cell: (r) => r.dsd_code },
		{ id: 'dsd_name', label: 'DSD', sortable: true, cell: (r) => r.dsd_name },
		{ id: 'district', label: 'District', cell: (r) => r.district?.name, hideBelow: 'md' },
		{ id: 'province', label: 'Province', cell: (r) => r.province?.name, hideBelow: 'lg' },
		{ id: 'gnds_count', label: 'GNDs', cell: (r) => r.gnds_count ?? 0, hideBelow: 'lg' },
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.dsd_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Divisional Secretariat Divisions'
			createLabel='Add DSD'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<GeoSelect
					idPrefix='dsd-filter'
					depth='district'
					value={filter}
					onChange={setFilter}
					colClassName='col-md-4'
				/>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='DSDs'
				getRowId={(r) => r.id}
				exportFileName='DSDs'
				emptyMessage='No DSDs found.'
			/>
			<FormModal
				id='dsd-modal'
				title={{ create: 'Add DSD', edit: 'Edit DSD', view: 'DSD' }[crud.mode ?? 'view']}
				isOpen={crud.mode !== null}
				onClose={crud.close}
				onSubmit={readOnly ? undefined : crud.save}
				saving={form.saving}>
				{readOnly && record ? (
					<DetailList
						items={[
							{ label: 'Code', value: record.dsd_code },
							{ label: 'DSD', value: record.dsd_name },
							{ label: 'District', value: record.district?.name },
							{ label: 'Province', value: record.province?.name },
							{ label: 'GNDs', value: record.gnds_count ?? 0 },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<GeoSelect
							idPrefix='dsd-form'
							depth='district'
							value={form.values}
							onChange={(geo) => form.patch(geo)}
							errors={form.errors}
							required
						/>
						<TextField
							id='dsd_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.dsd_code}
							onChange={(v) => form.setField('dsd_code', v.toUpperCase())}
							feedback={form.feedback('dsd_code')}
						/>
						<TextField
							id='dsd_name'
							label='DSD name'
							required
							className='col-md-8'
							value={form.values.dsd_name}
							onChange={(v) => form.setField('dsd_name', v)}
							feedback={form.feedback('dsd_name')}
						/>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default DsdsPage;
