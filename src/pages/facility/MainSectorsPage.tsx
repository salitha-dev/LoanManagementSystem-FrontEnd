import React from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { MainSector, MainSectorPayload, mainSectorService } from '../../api/facility.service';

type Form = { main_sector_code: string; main_sector_name: string; description: string };
const EMPTY: Form = { main_sector_code: '', main_sector_name: '', description: '' };
const toForm = (r: MainSector): Form => ({
	main_sector_code: r.main_sector_code,
	main_sector_name: r.main_sector_name,
	description: r.description ?? '',
});
const toPayload = (f: Form): MainSectorPayload => ({
	main_sector_code: f.main_sector_code,
	main_sector_name: f.main_sector_name,
	description: f.description || null,
});

const MainSectorsPage = () => {
	const list = useServerList(mainSectorService.list, {
		defaultSort: 'main_sector_name',
		entity: 'main sectors',
	});
	const crud = useCrudController({
		service: mainSectorService,
		permission: 'main-sector',
		entity: 'Main Sector',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<MainSector>[] = [
		{ id: 'main_sector_code', label: 'Code', sortable: true, cell: (r) => r.main_sector_code },
		{
			id: 'main_sector_name',
			label: 'Main Sector',
			sortable: true,
			cell: (r) => r.main_sector_name,
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
			id: 'sub_sectors_count',
			label: 'Sub sectors',
			cell: (r) => r.sub_sectors_count ?? 0,
			hideBelow: 'md',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.main_sector_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Main Sectors'
			createLabel='Add main sector'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='main sectors'
				getRowId={(r) => r.id}
				exportFileName='main-sectors'
				emptyMessage='No main sectors found.'
			/>
			<FormModal
				id='main-sector-modal'
				title={
					{ create: 'Add main sector', edit: 'Edit main sector', view: 'Main Sector' }[
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
							{ label: 'Code', value: record.main_sector_code },
							{ label: 'Main Sector', value: record.main_sector_name },
							{ label: 'Description', value: record.description },
							{ label: 'Sub sectors', value: record.sub_sectors_count ?? 0 },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<TextField
							id='main_sector_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.main_sector_code}
							onChange={(v) => form.setField('main_sector_code', v.toUpperCase())}
							feedback={form.feedback('main_sector_code')}
						/>
						<TextField
							id='main_sector_name'
							label='Main Sector name'
							required
							className='col-md-8'
							value={form.values.main_sector_name}
							onChange={(v) => form.setField('main_sector_name', v)}
							feedback={form.feedback('main_sector_name')}
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

export default MainSectorsPage;
