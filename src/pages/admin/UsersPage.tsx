import React, { useContext, useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import DetailList from '../../components/common/DetailList';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/bootstrap/Button';
import Badge from '../../components/bootstrap/Badge';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import useFormState from '../../hooks/useFormState';
import useOptions from '../../hooks/useOptions';
import AuthContext from '../../contexts/authContext';
import { hasUnrestrictedAccess } from '../../helpers/permissions';
import { formatDateTime } from '../../helpers/datetime';
import { AdminUser, resetUserPassword, UserPayload, userService } from '../../api/admin.service';
import { Reference } from '../../api/types';

const SUPER_ADMIN = 'super_admin';

type Form = UserPayload & { password: string; password_confirmation: string };
const EMPTY: Form = {
	employee_code: '',
	full_name: '',
	username: '',
	email: '',
	phone: '',
	designation_id: null,
	role_ids: [],
	branch_ids: [],
	primary_branch_id: null,
	password: '',
	password_confirmation: '',
};
const toForm = (r: AdminUser): Form => ({
	employee_code: r.employee_code ?? '',
	full_name: r.full_name,
	username: r.username ?? '',
	email: r.email,
	phone: r.phone ?? '',
	designation_id: r.designation_id,
	role_ids: (r.roles ?? []).map((role) => role.id),
	branch_ids: (r.branches ?? []).map((b) => b.id),
	primary_branch_id: r.primary_branch_id,
	password: '',
	password_confirmation: '',
});
const toPayload = (f: Form, mode: string): UserPayload => {
	const { password, password_confirmation: confirmation, ...rest } = f;
	const payload: UserPayload = { ...rest, phone: f.phone || null };
	if (mode === 'create') {
		payload.password = password;
		payload.password_confirmation = confirmation;
	}
	return payload;
};

const isSuperAdmin = (u: AdminUser) => (u.roles ?? []).some((r) => r.name === SUPER_ADMIN);
const refName = (r?: Reference | null) => r?.name ?? '—';

const UsersPage = () => {
	const { user: actor } = useContext(AuthContext);
	const actorIsSuper = hasUnrestrictedAccess(actor);
	const [filters, setFilters] = useState<{
		branch_id: number | null;
		designation_id: number | null;
		role_id: number | null;
	}>({ branch_id: null, designation_id: null, role_id: null });

	const branches = useOptions('branches');
	const designations = useOptions('designations');
	const roles = useOptions('roles');

	const list = useServerList(userService.list, {
		defaultSort: 'full_name',
		entity: 'users',
		filters,
	});
	const crud = useCrudController({
		service: userService,
		permission: 'user',
		entity: 'User',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';
	const isSelf = crud.record?.id === actor?.id;

	const reset = useFormState({ password: '', password_confirmation: '' });
	const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);

	// UI hints only; the API enforces the same rules.
	const canManage = (u: AdminUser) => actorIsSuper || !isSuperAdmin(u);
	const roleOptions = roles.options.filter((r) => actorIsSuper || r.name !== SUPER_ADMIN);
	const assignedBranches = branches.options.filter((b) => form.values.branch_ids.includes(b.id));

	const setBranches = (ids: number[]) => {
		form.patch({
			branch_ids: ids,
			primary_branch_id:
				form.values.primary_branch_id && ids.includes(form.values.primary_branch_id)
					? form.values.primary_branch_id
					: (ids[0] ?? null),
		});
	};

	const columns: DataTableColumn<AdminUser>[] = [
		{
			id: 'employee_code',
			label: 'Emp. code',
			sortable: true,
			cell: (r) => r.employee_code ?? '—',
		},
		{ id: 'full_name', label: 'Full name', sortable: true, cell: (r) => r.full_name },
		{
			id: 'username',
			label: 'Username',
			sortable: true,
			cell: (r) => r.username ?? '—',
			hideBelow: 'lg',
		},
		{ id: 'email', label: 'Email', sortable: true, cell: (r) => r.email, hideBelow: 'md' },
		{
			id: 'designation',
			label: 'Designation',
			cell: (r) => refName(r.designation),
			hideBelow: 'xl',
		},
		{
			id: 'primary_branch',
			label: 'Primary branch',
			cell: (r) => refName(r.primary_branch),
			hideBelow: 'lg',
		},
		{
			id: 'roles',
			label: 'Roles',
			cell: (r) => (
				<div className='d-flex flex-wrap gap-1'>
					{(r.roles ?? []).map((role) => (
						<Badge
							key={role.id}
							color={role.name === SUPER_ADMIN ? 'warning' : 'info'}
							isLight>
							{role.name}
						</Badge>
					))}
				</div>
			),
			getValue: (r) => (r.roles ?? []).map((role) => role.name).join(', '),
			hideBelow: 'md',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => {
				const manageable = canManage(r);
				return (
					<RowActions
						label={r.full_name}
						onView={() => crud.open('view', r)}
						extra={
							crud.can.update && manageable ? (
								<Button
									color='secondary'
									isLight
									size='sm'
									icon='LockReset'
									aria-label={`Reset password for ${r.full_name}`}
									onClick={() => {
										reset.reset({ password: '', password_confirmation: '' });
										setResetTarget(r);
									}}
								/>
							) : null
						}
						onEdit={
							crud.can.update && manageable ? () => crud.open('edit', r) : undefined
						}
						onDelete={
							crud.can.delete && manageable && r.id !== actor?.id
								? () => crud.remove(r)
								: undefined
						}
					/>
				);
			},
		},
	];

	const record = crud.record;

	return (
		<CrudPage
			title='Users'
			createLabel='Add user'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}
			filters={
				<>
					<SelectField
						id='filter-branch'
						label='Branch'
						className='col-md-4'
						options={branches.options}
						loading={branches.loading}
						value={filters.branch_id}
						onChange={(v) => setFilters((f) => ({ ...f, branch_id: v }))}
					/>
					<SelectField
						id='filter-designation'
						label='Designation'
						className='col-md-4'
						options={designations.options}
						loading={designations.loading}
						value={filters.designation_id}
						onChange={(v) => setFilters((f) => ({ ...f, designation_id: v }))}
					/>
					<SelectField
						id='filter-role'
						label='Role'
						className='col-md-4'
						options={roles.options}
						loading={roles.loading}
						value={filters.role_id}
						onChange={(v) => setFilters((f) => ({ ...f, role_id: v }))}
					/>
				</>
			}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='users'
				getRowId={(r) => r.id}
				exportFileName='users'
				emptyMessage='No users found.'
			/>

			<FormModal
				id='user-modal'
				size='xl'
				title={
					{ create: 'Add user', edit: 'Edit user', view: record?.full_name ?? 'User' }[
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
							{ label: 'Employee code', value: record.employee_code },
							{ label: 'Full name', value: record.full_name },
							{ label: 'Username', value: record.username },
							{ label: 'Email', value: record.email },
							{ label: 'Phone', value: record.phone },
							{ label: 'Designation', value: record.designation?.name },
							{
								label: 'Roles',
								value: (record.roles ?? []).map((r) => r.name).join(', '),
							},
							{
								label: 'Branches',
								value: (record.branches ?? []).map((b) => b.name).join(', '),
							},
							{ label: 'Primary branch', value: record.primary_branch?.name },
							{
								label: 'Last login',
								value: record.last_login_at
									? formatDateTime(record.last_login_at)
									: 'Never',
							},
							{
								label: 'Created at',
								value: record.created_at ? formatDateTime(record.created_at) : null,
							},
							{
								label: 'Updated at',
								value: record.updated_at ? formatDateTime(record.updated_at) : null,
							},
						]}
					/>
				) : (
					<div className='row g-3'>
						<TextField
							id='employee_code'
							label='Employee code'
							required
							className='col-md-4'
							value={form.values.employee_code}
							onChange={(v) => form.setField('employee_code', v.toUpperCase())}
							feedback={form.feedback('employee_code')}
						/>
						<TextField
							id='full_name'
							label='Full name'
							required
							className='col-md-8'
							value={form.values.full_name}
							onChange={(v) => form.setField('full_name', v)}
							feedback={form.feedback('full_name')}
						/>
						<TextField
							id='username'
							label='Username'
							required
							className='col-md-4'
							autoComplete='off'
							value={form.values.username}
							onChange={(v) => form.setField('username', v.toLowerCase())}
							feedback={form.feedback('username')}
						/>
						<TextField
							id='email'
							label='Email'
							type='email'
							required
							className='col-md-4'
							value={form.values.email}
							onChange={(v) => form.setField('email', v)}
							feedback={form.feedback('email')}
						/>
						<TextField
							id='phone'
							label='Phone'
							type='tel'
							className='col-md-4'
							value={form.values.phone}
							onChange={(v) => form.setField('phone', v)}
							feedback={form.feedback('phone')}
						/>
						<SelectField
							id='designation_id'
							label='Designation'
							required
							className='col-md-6'
							options={designations.options}
							loading={designations.loading}
							value={form.values.designation_id}
							onChange={(v) => form.setField('designation_id', v)}
							feedback={form.feedback('designation_id')}
						/>
						<SelectField
							id='role_ids'
							label='Roles'
							multiple
							required
							className='col-md-6'
							options={roleOptions}
							loading={roles.loading}
							disabled={isSelf}
							value={form.values.role_ids}
							onChange={(v) => form.setField('role_ids', v)}
							feedback={form.feedback('role_ids')}
						/>
						<SelectField
							id='branch_ids'
							label='Branches'
							multiple
							required
							className='col-md-8'
							options={branches.options}
							loading={branches.loading}
							value={form.values.branch_ids}
							onChange={setBranches}
							feedback={form.feedback('branch_ids')}
						/>
						<SelectField
							id='primary_branch_id'
							label='Primary branch'
							required
							className='col-md-4'
							options={assignedBranches}
							disabled={assignedBranches.length === 0}
							placeholder={
								assignedBranches.length
									? 'Select primary branch'
									: 'Assign branches first'
							}
							value={form.values.primary_branch_id}
							onChange={(v) => form.setField('primary_branch_id', v)}
							feedback={form.feedback('primary_branch_id')}
						/>
						{isSelf && (
							<div className='col-12 form-text'>
								You cannot change your own roles.
							</div>
						)}
						{crud.mode === 'create' && (
							<>
								<TextField
									id='password'
									label='Password'
									type='password'
									required
									autoComplete='new-password'
									value={form.values.password}
									onChange={(v) => form.setField('password', v)}
									feedback={form.feedback('password')}
								/>
								<TextField
									id='password_confirmation'
									label='Confirm password'
									type='password'
									required
									autoComplete='new-password'
									value={form.values.password_confirmation}
									onChange={(v) => form.setField('password_confirmation', v)}
									feedback={form.feedback('password_confirmation')}
								/>
								<div className='col-12 form-text'>
									At least 8 characters, including letters and numbers.
								</div>
							</>
						)}
					</div>
				)}
			</FormModal>

			<FormModal
				id='reset-password-modal'
				size='sm'
				title={`Reset password${resetTarget ? ` — ${resetTarget.full_name}` : ''}`}
				isOpen={resetTarget !== null}
				onClose={() => setResetTarget(null)}
				submitLabel='Reset password'
				saving={reset.saving}
				onSubmit={async () => {
					if (!resetTarget) return;
					const ok = await reset.submit(
						() => resetUserPassword(resetTarget.id, reset.values),
						{
							title: 'Password reset',
							message: 'The user has been signed out of all sessions.',
						},
					);
					if (ok) setResetTarget(null);
				}}>
				<div className='row g-3'>
					<TextField
						id='reset-password'
						label='New password'
						type='password'
						required
						className='col-12'
						autoComplete='new-password'
						value={reset.values.password}
						onChange={(v) => reset.setField('password', v)}
						feedback={reset.feedback('password')}
					/>
					<TextField
						id='reset-password-confirmation'
						label='Confirm new password'
						type='password'
						required
						className='col-12'
						autoComplete='new-password'
						value={reset.values.password_confirmation}
						onChange={(v) => reset.setField('password_confirmation', v)}
						feedback={reset.feedback('password_confirmation')}
					/>
				</div>
			</FormModal>
		</CrudPage>
	);
};

export default UsersPage;
