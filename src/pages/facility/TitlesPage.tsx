import React from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { Title, TitlePayload, titleService } from '../../api/facility.service';

type Form = { title_code: string; title_name: string };
const EMPTY: Form = { title_code: '', title_name: '' };
const toForm = (r: Title): Form => ({ title_code: r.title_code, title_name: r.title_name });
const toPayload = (f: Form): TitlePayload => ({
	title_code: f.title_code,
	title_name: f.title_name,
});

/** Person titles (Mr., Mrs., Dr. ...) reused by customer, guarantor and other people forms. */
const TitlesPage = () => {
	const list = useServerList(titleService.list, {
		defaultSort: 'title_name',
		entity: 'titles',
	});
	const crud = useCrudController({
		service: titleService,
		permission: 'title',
		entity: 'Title',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<Title>[] = [
		{ id: 'title_code', label: 'Code', sortable: true, cell: (r) => r.title_code },
		{ id: 'title_name', label: 'Title', sortable: true, cell: (r) => r.title_name },
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.title_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Titles'
			createLabel='Add title'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='titles'
				getRowId={(r) => r.id}
				exportFileName='titles'
				emptyMessage='No titles found.'
			/>
			<FormModal
				id='title-modal'
				title={
					{ create: 'Add title', edit: 'Edit title', view: 'Title' }[crud.mode ?? 'view']
				}
				isOpen={crud.mode !== null}
				onClose={crud.close}
				onSubmit={readOnly ? undefined : crud.save}
				saving={form.saving}>
				{readOnly && record ? (
					<DetailList
						items={[
							{ label: 'Code', value: record.title_code },
							{ label: 'Title', value: record.title_name },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<TextField
							id='title_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.title_code}
							onChange={(v) => form.setField('title_code', v.toUpperCase())}
							feedback={form.feedback('title_code')}
						/>
						<TextField
							id='title_name'
							label='Title'
							required
							className='col-md-8'
							value={form.values.title_name}
							onChange={(v) => form.setField('title_name', v)}
							feedback={form.feedback('title_name')}
						/>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default TitlesPage;
