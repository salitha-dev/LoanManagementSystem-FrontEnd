import React, { useContext, useEffect, useState } from 'react';
import DataTable, { DataTableColumn } from '../../components/common/DataTable';
import CrudPage from '../../components/common/CrudPage';
import FormModal from '../../components/common/FormModal';
import RowActions from '../../components/common/RowActions';
import TextField from '../../components/common/TextField';
import PermissionMatrix from '../../components/common/PermissionMatrix';
import Badge from '../../components/bootstrap/Badge';
import Spinner from '../../components/bootstrap/Spinner';
import Icon from '../../components/icon/Icon';
import useServerList from '../../hooks/useServerList';
import useCrudController from '../../hooks/useCrudController';
import AuthContext from '../../contexts/authContext';
import { grantedPermissions, hasUnrestrictedAccess } from '../../helpers/permissions';
import { formatDateTime } from '../../helpers/datetime';
import {
	fetchPermissionCatalog,
	PermissionCatalog,
	Role,
	RolePayload,
	roleService,
} from '../../api/admin.service';

const EMPTY: RolePayload = { name: '', permissions: [] };
const toForm = (r: Role): RolePayload => ({ name: r.name, permissions: r.permissions ?? [] });
const toPayload = (f: RolePayload): RolePayload => f;

/** Role = system access (permissions). Separate from Designation (organisational position). */
const RolesPage = () => {
	const { user } = useContext(AuthContext);
	const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
	const list = useServerList(roleService.list, { defaultSort: 'name', entity: 'roles' });
	const crud = useCrudController({
		service: roleService,
		permission: 'role',
		entity: 'Role',
		emptyForm: EMPTY,
		toForm,
		toPayload,
		onChanged: list.reload,
	});
	const { form } = crud;
	const readOnly = crud.mode === 'view';

	useEffect(() => {
		if (crud.mode === null || catalog) return;
		fetchPermissionCatalog()
			.then(setCatalog)
			.catch(() => setCatalog({ actions: [], groups: [] }));
	}, [crud.mode, catalog]);

	const unrestricted = hasUnrestrictedAccess(user);
	const held = new Set(grantedPermissions(user));
	const grantable = (permission: string) => unrestricted || held.has(permission);

	const columns: DataTableColumn<Role>[] = [
		{
			id: 'name',
			label: 'Role',
			sortable: true,
			cell: (r) => (
				<span className='d-inline-flex align-items-center gap-2'>
					{r.name}
					{r.is_protected && (
						<Badge color='warning' isLight>
							Protected
						</Badge>
					)}
				</span>
			),
		},
		{
			id: 'permissions_count',
			label: 'Permissions',
			cell: (r) => (r.is_protected ? 'All' : (r.permissions_count ?? 0)),
		},
		{ id: 'users_count', label: 'Users', cell: (r) => r.users_count ?? 0, hideBelow: 'md' },
		{
			id: 'created_at',
			label: 'Created',
			sortable: true,
			cell: (r) => (r.created_at ? formatDateTime(r.created_at) : '—'),
			hideBelow: 'lg',
		},
		{
			id: 'actions',
			label: '',
			exportable: false,
			cell: (r) => (
				<RowActions
					label={r.name}
					onView={() => crud.open('view', r)}
					onEdit={
						crud.can.update && !r.is_protected ? () => crud.open('edit', r) : undefined
					}
					onDelete={crud.can.delete && !r.is_protected ? () => crud.remove(r) : undefined}
				/>
			),
		},
	];

	const permissionsError = form.errors.permissions;

	return (
		<CrudPage
			title='Roles & Permissions'
			createLabel='Add role'
			onCreate={crud.can.create ? () => crud.open('create') : undefined}>
			<DataTable
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...list.tableProps}
				columns={columns}
				label='roles'
				getRowId={(r) => r.id}
				exportFileName='roles'
				emptyMessage='No roles found.'
			/>
			<FormModal
				id='role-modal'
				size='xl'
				title={
					{ create: 'Add role', edit: 'Edit role', view: crud.record?.name ?? 'Role' }[
						crud.mode ?? 'view'
					]
				}
				isOpen={crud.mode !== null}
				onClose={crud.close}
				onSubmit={readOnly ? undefined : crud.save}
				submitLabel={crud.mode === 'create' ? 'Create role' : 'Save changes'}
				saving={form.saving}>
				<div className='row g-3'>
					{readOnly ? (
						crud.record && (
							<div className='col-12 d-flex flex-wrap gap-2 align-items-center'>
								{crud.record.is_protected && (
									<Badge color='warning' isLight>
										Protected
									</Badge>
								)}
								<Badge color='info' isLight>
									{crud.record.users_count ?? 0} user(s)
								</Badge>
							</div>
						)
					) : (
						<>
							<TextField
								id='role-name'
								label='Role name'
								required
								className='col-md-6'
								value={form.values.name}
								onChange={(v) => form.setField('name', v)}
								feedback={form.feedback('name')}
							/>
							<div className='col-md-6 d-flex align-items-end'>
								<div className='form-text mb-2'>
									A role is a set of system permissions. Assign it to users in
									Admin › Users. (Organisational positions are Designations.)
								</div>
							</div>
						</>
					)}
					<div className='col-12'>
						<div className='fw-semibold mb-2'>Permissions</div>
						{crud.record?.is_protected && readOnly ? (
							<p className='text-muted mb-0'>
								Super Admin has every permission and passes all checks. This role is
								protected and cannot be edited or deleted.
							</p>
						) : catalog ? (
							<PermissionMatrix
								catalog={catalog}
								value={form.values.permissions}
								onChange={(next) => form.setField('permissions', next)}
								grantable={grantable}
								readOnly={readOnly}
							/>
						) : (
							<Spinner isSmall />
						)}
						{permissionsError && (
							<div className='text-danger small mt-2'>{permissionsError}</div>
						)}
						{!readOnly && !unrestricted && (
							<div className='form-text'>
								<Icon icon='Lock' size='sm' /> Locked permissions are ones you do
								not hold; only a Super Admin can grant them.
							</div>
						)}
					</div>
				</div>
			</FormModal>
		</CrudPage>
	);
};

export default RolesPage;
