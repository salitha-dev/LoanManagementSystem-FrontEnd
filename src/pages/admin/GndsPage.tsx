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
import { Gnd, GndPayload, gndService } from '../../api/admin.service';

type Form = GeoValue & { gnd_code: string; gnd_name: string };
const EMPTY: Form = { ...EMPTY_GEO, gnd_code: '', gnd_name: '' };
const toForm = (r: Gnd): Form => ({
	...EMPTY_GEO,
	province_id: r.province?.id ?? null,
	district_id: r.district?.id ?? null,
	dsd_id: r.dsd_id,
	gnd_code: r.gnd_code,
	gnd_name: r.gnd_name,
});
const toPayload = (f: Form): GndPayload => ({
	dsd_id: f.dsd_id as number,
	gnd_code: f.gnd_code,
	gnd_name: f.gnd_name,
});

const GndsPage = () => {
	const [filter, setFilter] = useState<GeoValue>(EMPTY_GEO);
	const list = useServerList(gndService.list, {
		defaultSort: 'gnd_name',
		entity: 'GNDs',
		filters: {
			province_id: filter.province_id,
			district_id: filter.district_id,
			dsd_id: filter.dsd_id,
		},
	});
	const crud = useCrudController({
		service: gndService,
		permission: 'gnd',
		entity: 'GND',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<Gnd>[] = [
		{ id: 'gnd_code', label: 'Code', sortable: true, cell: (r) => r.gnd_code },
		{ id: 'gnd_name', label: 'GND', sortable: true, cell: (r) => r.gnd_name },
		{ id: 'dsd', label: 'DSD', cell: (r) => r.dsd?.name, hideBelow: 'md' },
		{ id: 'district', label: 'District', cell: (r) => r.district?.name, hideBelow: 'lg' },
		{ id: 'province', label: 'Province', cell: (r) => r.province?.name, hideBelow: 'xl' },
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.gnd_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Grama Niladhari Divisions'
			createLabel='Add GND'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<GeoSelect
					idPrefix='gnd-filter'
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
				label='GNDs'
				getRowId={(r) => r.id}
				exportFileName='GNDs'
				emptyMessage='No GNDs found.'
			/>
			<FormModal
				id='gnd-modal'
				title={{ create: 'Add GND', edit: 'Edit GND', view: 'GND' }[crud.mode ?? 'view']}
				isOpen={crud.mode !== null}
				onClose={crud.close}
				onSubmit={readOnly ? undefined : crud.save}
				saving={form.saving}>
				{readOnly && record ? (
					<DetailList
						items={[
							{ label: 'Code', value: record.gnd_code },
							{ label: 'GND', value: record.gnd_name },
							{ label: 'DSD', value: record.dsd?.name },
							{ label: 'District', value: record.district?.name },
							{ label: 'Province', value: record.province?.name },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<GeoSelect
							idPrefix='gnd-form'
							depth='dsd'
							value={form.values}
							onChange={(geo) => form.patch(geo)}
							errors={form.errors}
							required
						/>
						<TextField
							id='gnd_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.gnd_code}
							onChange={(v) => form.setField('gnd_code', v.toUpperCase())}
							feedback={form.feedback('gnd_code')}
						/>
						<TextField
							id='gnd_name'
							label='GND name'
							required
							className='col-md-8'
							value={form.values.gnd_name}
							onChange={(v) => form.setField('gnd_name', v)}
							feedback={form.feedback('gnd_name')}
						/>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default GndsPage;
