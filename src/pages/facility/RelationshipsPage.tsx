import React from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { Relationship, RelationshipPayload, relationshipService } from '../../api/facility.service';

type Form = { relationship_code: string; relationship_name: string };
const EMPTY: Form = { relationship_code: '', relationship_name: '' };
const toForm = (r: Relationship): Form => ({
	relationship_code: r.relationship_code,
	relationship_name: r.relationship_name,
});
const toPayload = (f: Form): RelationshipPayload => ({
	relationship_code: f.relationship_code,
	relationship_name: f.relationship_name,
});

/** Relationship types (Spouse, Father ...) reused by family, guarantor, nominee and contact records. */
const RelationshipsPage = () => {
	const list = useServerList(relationshipService.list, {
		defaultSort: 'relationship_name',
		entity: 'relationships',
	});
	const crud = useCrudController({
		service: relationshipService,
		permission: 'relationship',
		entity: 'Relationship',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<Relationship>[] = [
		{
			id: 'relationship_code',
			label: 'Code',
			sortable: true,
			cell: (r) => r.relationship_code,
		},
		{
			id: 'relationship_name',
			label: 'Relationship',
			sortable: true,
			cell: (r) => r.relationship_name,
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.relationship_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Relationships'
			createLabel='Add relationship'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='relationships'
				getRowId={(r) => r.id}
				exportFileName='relationships'
				emptyMessage='No relationships found.'
			/>
			<FormModal
				id='relationship-modal'
				title={
					{ create: 'Add relationship', edit: 'Edit relationship', view: 'Relationship' }[
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
							{ label: 'Code', value: record.relationship_code },
							{ label: 'Relationship', value: record.relationship_name },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<TextField
							id='relationship_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.relationship_code}
							onChange={(v) => form.setField('relationship_code', v.toUpperCase())}
							feedback={form.feedback('relationship_code')}
						/>
						<TextField
							id='relationship_name'
							label='Relationship'
							required
							className='col-md-8'
							value={form.values.relationship_name}
							onChange={(v) => form.setField('relationship_name', v)}
							feedback={form.feedback('relationship_name')}
						/>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default RelationshipsPage;
