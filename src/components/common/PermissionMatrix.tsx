import React, { FC } from 'react';
import Checks from '../bootstrap/forms/Checks';
import { PermissionCatalog } from '../../api/admin.service';

interface IPermissionMatrixProps {
	catalog: PermissionCatalog;
	value: string[];
	onChange?: (next: string[]) => void;
	/** Permissions the signed-in user may grant; others are disabled (server enforces too). */
	grantable?: (permission: string) => boolean;
	readOnly?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
	view: 'View',
	create: 'Create',
	update: 'Update',
	delete: 'Delete',
};

/** Resource × action checkbox grid with row toggles. */
const PermissionMatrix: FC<IPermissionMatrixProps> = ({
	catalog,
	value,
	onChange,
	grantable = () => true,
	readOnly = false,
}) => {
	const selected = new Set(value);
	// Unticking is always allowed; ticking needs the permission to be grantable.
	const canToggle = (name: string) => !readOnly && (selected.has(name) || grantable(name));

	const toggle = (names: string[], on: boolean) => {
		const next = new Set(selected);
		names.filter(canToggle).forEach((name) => (on ? next.add(name) : next.delete(name)));
		onChange?.([...next].sort());
	};

	return (
		<div className='table-responsive'>
			<table className='table table-sm align-middle mb-0'>
				<thead>
					<tr>
						<th scope='col'>Module</th>
						{catalog.actions.map((action) => (
							<th key={action} scope='col' className='text-center'>
								{ACTION_LABELS[action] ?? action}
							</th>
						))}
						{!readOnly && (
							<th scope='col' className='text-center'>
								All
							</th>
						)}
					</tr>
				</thead>
				<tbody>
					{catalog.groups.map((group) => {
						const names = group.permissions.map((p) => p.name);
						const allOn = names.every((n) => selected.has(n));
						return (
							<tr key={group.resource}>
								<th scope='row' className='fw-semibold'>
									{group.label}
								</th>
								{catalog.actions.map((action) => {
									const permission = group.permissions.find(
										(p) => p.action === action,
									);
									if (!permission) return <td key={action} />;
									return (
										<td key={action} className='text-center'>
											<Checks
												id={`perm-${permission.name}`}
												ariaLabel={`${group.label} ${action}`}
												checked={selected.has(permission.name)}
												disabled={!canToggle(permission.name)}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>,
												) => toggle([permission.name], e.target.checked)}
												isInline
											/>
										</td>
									);
								})}
								{!readOnly && (
									<td className='text-center'>
										<Checks
											type='switch'
											id={`perm-all-${group.resource}`}
											ariaLabel={`All ${group.label} permissions`}
											checked={allOn}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												toggle(names, e.target.checked)
											}
											isInline
										/>
									</td>
								)}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export default PermissionMatrix;
