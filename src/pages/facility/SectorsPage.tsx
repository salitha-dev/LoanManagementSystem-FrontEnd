import React, { useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import SectorSelect, { EMPTY_SECTOR, SectorValue } from '../../components/common/SectorSelect';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { Sector, SectorPayload, sectorService } from '../../api/facility.service';

type Form = SectorValue & { sector_code: string; sector_name: string; description: string };
const EMPTY: Form = { ...EMPTY_SECTOR, sector_code: '', sector_name: '', description: '' };
const toForm = (r: Sector): Form => ({
	...EMPTY_SECTOR,
	main_sector_id: r.main_sector?.id ?? null,
	sub_sector_id: r.sub_sector_id,
	sector_code: r.sector_code,
	sector_name: r.sector_name,
	description: r.description ?? '',
});
const toPayload = (f: Form): SectorPayload => ({
	main_sector_id: f.main_sector_id,
	sub_sector_id: f.sub_sector_id as number,
	sector_code: f.sector_code,
	sector_name: f.sector_name,
	description: f.description || null,
});

const SectorsPage = () => {
	const [filter, setFilter] = useState<SectorValue>(EMPTY_SECTOR);
	const list = useServerList(sectorService.list, {
		defaultSort: 'sector_name',
		entity: 'sectors',
		filters: {
			main_sector_id: filter.main_sector_id,
			sub_sector_id: filter.sub_sector_id,
		},
	});
	const crud = useCrudController({
		service: sectorService,
		permission: 'sector',
		entity: 'Sector',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<Sector>[] = [
		{ id: 'sector_code', label: 'Code', sortable: true, cell: (r) => r.sector_code },
		{ id: 'sector_name', label: 'Sector', sortable: true, cell: (r) => r.sector_name },
		{ id: 'sub_sector', label: 'Sub Sector', cell: (r) => r.sub_sector?.name, hideBelow: 'md' },
		{
			id: 'main_sector',
			label: 'Main Sector',
			cell: (r) => r.main_sector?.name,
			hideBelow: 'lg',
		},
		{
			id: 'description',
			label: 'Description',
			cell: (r) => (
				<span className='text-truncate d-inline-block' style={{ maxWidth: 280 }}>
					{r.description ?? '—'}
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
					label={r.sector_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Sectors'
			createLabel='Add sector'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<SectorSelect
					idPrefix='sector-filter'
					depth='sub'
					value={filter}
					onChange={setFilter}
					colClassName='col-md-4'
				/>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='sectors'
				getRowId={(r) => r.id}
				exportFileName='sectors'
				emptyMessage='No sectors found.'
			/>
			<FormModal
				id='sector-modal'
				title={
					{ create: 'Add sector', edit: 'Edit sector', view: 'Sector' }[
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
							{ label: 'Code', value: record.sector_code },
							{ label: 'Sector', value: record.sector_name },
							{ label: 'Sub Sector', value: record.sub_sector?.name },
							{ label: 'Main Sector', value: record.main_sector?.name },
							{ label: 'Description', value: record.description },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<SectorSelect
							idPrefix='sector-form'
							depth='sub'
							value={form.values}
							onChange={(next) => form.patch(next)}
							errors={form.errors}
							required
						/>
						<TextField
							id='sector_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.sector_code}
							onChange={(v) => form.setField('sector_code', v.toUpperCase())}
							feedback={form.feedback('sector_code')}
						/>
						<TextField
							id='sector_name'
							label='Sector name'
							required
							className='col-md-8'
							value={form.values.sector_name}
							onChange={(v) => form.setField('sector_name', v)}
							feedback={form.feedback('sector_name')}
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

export default SectorsPage;
