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
import { SubSector, SubSectorPayload, subSectorService } from '../../api/facility.service';

type Form = SectorValue & { sub_sector_code: string; sub_sector_name: string; description: string };
const EMPTY: Form = { ...EMPTY_SECTOR, sub_sector_code: '', sub_sector_name: '', description: '' };
const toForm = (r: SubSector): Form => ({
	...EMPTY_SECTOR,
	main_sector_id: r.main_sector_id,
	sub_sector_code: r.sub_sector_code,
	sub_sector_name: r.sub_sector_name,
	description: r.description ?? '',
});
const toPayload = (f: Form): SubSectorPayload => ({
	main_sector_id: f.main_sector_id as number,
	sub_sector_code: f.sub_sector_code,
	sub_sector_name: f.sub_sector_name,
	description: f.description || null,
});

const SubSectorsPage = () => {
	const [filter, setFilter] = useState<SectorValue>(EMPTY_SECTOR);
	const list = useServerList(subSectorService.list, {
		defaultSort: 'sub_sector_name',
		entity: 'sub sectors',
		filters: {
			main_sector_id: filter.main_sector_id,
		},
	});
	const crud = useCrudController({
		service: subSectorService,
		permission: 'sub-sector',
		entity: 'Sub Sector',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<SubSector>[] = [
		{ id: 'sub_sector_code', label: 'Code', sortable: true, cell: (r) => r.sub_sector_code },
		{
			id: 'sub_sector_name',
			label: 'Sub Sector',
			sortable: true,
			cell: (r) => r.sub_sector_name,
		},
		{
			id: 'main_sector',
			label: 'Main Sector',
			cell: (r) => r.main_sector?.name,
			hideBelow: 'md',
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
			id: 'sectors_count',
			label: 'Sectors',
			cell: (r) => r.sectors_count ?? 0,
			hideBelow: 'md',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.sub_sector_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Sub Sectors'
			createLabel='Add sub sector'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<SectorSelect
					idPrefix='sub-sector-filter'
					depth='main'
					value={filter}
					onChange={setFilter}
					colClassName='col-md-4'
				/>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='sub sectors'
				getRowId={(r) => r.id}
				exportFileName='sub-sectors'
				emptyMessage='No sub sectors found.'
			/>
			<FormModal
				id='sub-sector-modal'
				title={
					{ create: 'Add sub sector', edit: 'Edit sub sector', view: 'Sub Sector' }[
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
							{ label: 'Code', value: record.sub_sector_code },
							{ label: 'Sub Sector', value: record.sub_sector_name },
							{ label: 'Main Sector', value: record.main_sector?.name },
							{ label: 'Description', value: record.description },
							{ label: 'Sectors', value: record.sectors_count ?? 0 },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<SectorSelect
							idPrefix='sub-sector-form'
							depth='main'
							value={form.values}
							onChange={(next) => form.patch(next)}
							errors={form.errors}
							required
						/>
						<TextField
							id='sub_sector_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.sub_sector_code}
							onChange={(v) => form.setField('sub_sector_code', v.toUpperCase())}
							feedback={form.feedback('sub_sector_code')}
						/>
						<TextField
							id='sub_sector_name'
							label='Sub Sector name'
							required
							className='col-md-8'
							value={form.values.sub_sector_name}
							onChange={(v) => form.setField('sub_sector_name', v)}
							feedback={form.feedback('sub_sector_name')}
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

export default SubSectorsPage;
