import React from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList, { auditDetails } from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import { Education, EducationPayload, educationService } from '../../api/facility.service';

type Form = { education_code: string; education_name: string };
const EMPTY: Form = { education_code: '', education_name: '' };
const toForm = (r: Education): Form => ({
	education_code: r.education_code,
	education_name: r.education_name,
});
const toPayload = (f: Form): EducationPayload => ({
	education_code: f.education_code,
	education_name: f.education_name,
});

/** Education qualifications, reused by customer, guarantor and applicant forms. */
const EducationPage = () => {
	const list = useServerList(educationService.list, {
		defaultSort: 'education_code',
		entity: 'education qualifications',
	});
	const crud = useCrudController({
		service: educationService,
		permission: 'education',
		entity: 'Education',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const record = crud.record;

	const columns: DataTableColumn<Education>[] = [
		{ id: 'education_code', label: 'Code', sortable: true, cell: (r) => r.education_code },
		{
			id: 'education_name',
			label: 'Education qualification',
			sortable: true,
			cell: (r) => r.education_name,
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.education_name}
					onView={() => crud.open('view', r)}
					onEdit={crud.can.update ? () => crud.open('edit', r) : undefined}
					onDelete={crud.can.delete ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	return (
		<CrudPage
			title='Education'
			createLabel='Add education'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='education qualifications'
				getRowId={(r) => r.id}
				exportFileName='education'
				emptyMessage='No education qualifications found.'
			/>
			<FormModal
				id='education-modal'
				title={
					{ create: 'Add education', edit: 'Edit education', view: 'Education' }[
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
							{ label: 'Code', value: record.education_code },
							{ label: 'Education qualification', value: record.education_name },
							...auditDetails(record),
						]}
					/>
				) : (
					<div className='row g-3'>
						<TextField
							id='education_code'
							label='Code'
							required
							className='col-md-4'
							value={form.values.education_code}
							onChange={(v) => form.setField('education_code', v.toUpperCase())}
							feedback={form.feedback('education_code')}
						/>
						<TextField
							id='education_name'
							label='Education qualification'
							required
							className='col-md-8'
							value={form.values.education_name}
							onChange={(v) => form.setField('education_name', v)}
							feedback={form.feedback('education_name')}
						/>
					</div>
				)}
			</FormModal>
		</CrudPage>
	);
};

export default EducationPage;
