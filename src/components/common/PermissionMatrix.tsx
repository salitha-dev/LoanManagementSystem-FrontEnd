import React, { FC, useMemo, useState } from 'react';
import Badge from '../bootstrap/Badge';
import Button from '../bootstrap/Button';
import Input from '../bootstrap/forms/Input';
import Icon from '../icon/Icon';
import { PermissionCatalog } from '../../api/admin.service';

type Group = PermissionCatalog['groups'][number];

interface IPermissionMatrixProps {
	catalog: PermissionCatalog;
	value: string[];
	onChange?: (next: string[]) => void;
	/** Permissions the signed-in user may grant; others show a lock (the API enforces too). */
	grantable?: (permission: string) => boolean;
	readOnly?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
	view: 'View',
	create: 'Create',
	update: 'Update',
	delete: 'Delete',
	approve: 'Approve',
	reject: 'Reject',
};
const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;

/** Native checkbox with an indeterminate ("some selected") state. */
const TriCheckbox: FC<{
	id: string;
	label: string;
	checked: boolean;
	indeterminate?: boolean;
	disabled?: boolean;
	onChange: (checked: boolean) => void;
}> = ({ id, label, checked, indeterminate = false, disabled = false, onChange }) => (
	<input
		id={id}
		type='checkbox'
		className='form-check-input m-0'
		aria-label={label}
		title={label}
		checked={checked}
		disabled={disabled}
		ref={(el) => {
			if (el) el.indeterminate = indeterminate && !checked;
		}}
		onChange={(e) => onChange(e.target.checked)}
	/>
);

const sectionsOf = (groups: Group[]) =>
	groups.reduce<{ name: string; groups: Group[] }[]>((acc, group) => {
		const section = acc.find((s) => s.name === group.section);
		if (section) section.groups.push(group);
		else acc.push({ name: group.section, groups: [group] });
		return acc;
	}, []);

/**
 * Role permission editor, grouped by sidebar section.
 * - Row, column, section and global toggles (partial selections show as indeterminate).
 * - Granting Create/Update/Delete also grants View; removing View removes the others,
 *   because the page cannot be opened without View.
 * - Read-only mode shows a compact summary of what the role allows.
 */
const PermissionMatrix: FC<IPermissionMatrixProps> = ({
	catalog,
	value,
	onChange,
	grantable = () => true,
	readOnly = false,
}) => {
	const [search, setSearch] = useState('');
	const selected = useMemo(() => new Set(value), [value]);

	const { allNames, viewOf, siblingsOf } = useMemo(() => {
		const names: string[] = [];
		const view: Record<string, string | undefined> = {};
		const siblings: Record<string, string[]> = {};
		catalog.groups.forEach((group) => {
			const groupNames = group.permissions.map((p) => p.name);
			const viewName = group.permissions.find((p) => p.action === 'view')?.name;
			groupNames.forEach((name) => {
				names.push(name);
				view[name] = viewName;
				siblings[name] = groupNames;
			});
		});
		return { allNames: names, viewOf: view, siblingsOf: siblings };
	}, [catalog]);

	const canToggle = (name: string) => !readOnly && (selected.has(name) || grantable(name));

	const apply = (names: string[], on: boolean) => {
		const next = new Set(selected);
		names.filter(canToggle).forEach((name) => {
			if (on) {
				next.add(name);
				const view = viewOf[name];
				if (view && view !== name && (next.has(view) || grantable(view))) next.add(view);
			} else {
				next.delete(name);
				// Without View the module cannot be opened, so the other actions go too.
				if (viewOf[name] === name)
					siblingsOf[name].forEach((sibling) => next.delete(sibling));
			}
		});
		onChange?.([...next].sort());
	};

	const state = (names: string[]) => {
		const toggleable = names.filter(canToggle);
		const on = names.filter((n) => selected.has(n)).length;
		return {
			checked: names.length > 0 && on === names.length,
			indeterminate: on > 0 && on < names.length,
			disabled: toggleable.length === 0,
			on,
		};
	};

	const totalSelected = allNames.filter((n) => selected.has(n)).length;
	const query = search.trim().toLowerCase();
	const sections = sectionsOf(catalog.groups)
		.map((section) => ({
			...section,
			groups: section.groups.filter((g) => !query || g.label.toLowerCase().includes(query)),
		}))
		.filter((section) => section.groups.length > 0);

	if (readOnly) {
		const granted = sectionsOf(catalog.groups)
			.map((section) => ({
				...section,
				groups: section.groups
					.map((g) => ({
						...g,
						permissions: g.permissions.filter((p) => selected.has(p.name)),
					}))
					.filter((g) => g.permissions.length > 0),
			}))
			.filter((section) => section.groups.length > 0);

		if (!granted.length) {
			return <p className='text-muted mb-0'>This role has no permissions.</p>;
		}
		return (
			<div className='d-flex flex-column gap-3'>
				<div className='small text-muted'>
					{totalSelected} of {allNames.length} permissions granted
				</div>
				{granted.map((section) => (
					<div key={section.name}>
						<div className='fw-semibold text-uppercase small text-muted mb-2'>
							{section.name}
						</div>
						<div className='list-group'>
							{section.groups.map((g) => (
								<div
									key={g.resource}
									className='list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2'>
									<span className='fw-semibold'>{g.label}</span>
									<span className='d-flex flex-wrap gap-1'>
										{g.permissions.map((p) => (
											<Badge key={p.name} color='primary' isLight>
												{actionLabel(p.action)}
											</Badge>
										))}
									</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className='d-flex flex-column gap-3'>
			{/* Toolbar */}
			<div className='d-flex flex-wrap align-items-center gap-2'>
				<div className='flex-grow-1' style={{ minWidth: 200 }}>
					<Input
						id='permission-search'
						ariaLabel='Filter modules'
						placeholder='Filter modules…'
						value={search}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setSearch(e.target.value)
						}
					/>
				</div>
				<Badge
					color={totalSelected ? 'primary' : 'secondary'}
					isLight
					className='py-2 px-3'>
					{totalSelected} / {allNames.length} selected
				</Badge>
				<Button
					color='primary'
					isLight
					size='sm'
					icon='DoneAll'
					isDisable={state(allNames).disabled || state(allNames).checked}
					onClick={() => apply(allNames, true)}>
					Select all
				</Button>
				<Button
					color='light'
					size='sm'
					icon='ClearAll'
					isDisable={totalSelected === 0}
					onClick={() => apply(allNames, false)}>
					Clear
				</Button>
			</div>

			{sections.length === 0 && (
				<p className='text-muted mb-0'>No modules match “{search}”.</p>
			)}

			{sections.map((section) => {
				const sectionNames = section.groups.flatMap((g) =>
					g.permissions.map((p) => p.name),
				);
				const sectionState = state(sectionNames);
				const sectionId = section.name.replace(/\W+/g, '-').toLowerCase();
				return (
					<div key={section.name} className='border rounded-3 overflow-hidden'>
						<div className='d-flex align-items-center justify-content-between gap-2 px-3 py-2 bg-light bg-opacity-50 border-bottom'>
							<div className='d-flex align-items-center gap-2'>
								<TriCheckbox
									id={`perm-section-${sectionId}`}
									label={`All ${section.name} permissions`}
									checked={sectionState.checked}
									indeterminate={sectionState.indeterminate}
									disabled={sectionState.disabled}
									onChange={(on) => apply(sectionNames, on)}
								/>
								<label
									htmlFor={`perm-section-${sectionId}`}
									className='fw-bold mb-0'>
									{section.name}
								</label>
							</div>
							<span className='small text-muted'>
								{sectionState.on} / {sectionNames.length}
							</span>
						</div>
						<div className='table-responsive'>
							<table className='table table-sm table-hover align-middle mb-0'>
								<thead>
									<tr>
										<th scope='col' className='ps-3'>
											Module
										</th>
										{catalog.actions.map((action) => {
											const columnNames = section.groups
												.map(
													(g) =>
														g.permissions.find(
															(p) => p.action === action,
														)?.name,
												)
												.filter((n): n is string => Boolean(n));
											const columnState = state(columnNames);
											return (
												<th
													key={action}
													scope='col'
													className='text-center'
													style={{ width: 90 }}>
													<div className='d-flex flex-column align-items-center gap-1'>
														<span className='small'>
															{actionLabel(action)}
														</span>
														<TriCheckbox
															id={`perm-col-${sectionId}-${action}`}
															label={`${actionLabel(action)} for all ${section.name} modules`}
															checked={columnState.checked}
															indeterminate={
																columnState.indeterminate
															}
															disabled={columnState.disabled}
															onChange={(on) =>
																apply(columnNames, on)
															}
														/>
													</div>
												</th>
											);
										})}
										<th
											scope='col'
											className='text-center'
											style={{ width: 70 }}>
											<span className='small'>All</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{section.groups.map((group) => {
										const rowNames = group.permissions.map((p) => p.name);
										const rowState = state(rowNames);
										return (
											<tr key={group.resource}>
												<th scope='row' className='ps-3 fw-semibold'>
													{group.label}
												</th>
												{catalog.actions.map((action) => {
													const permission = group.permissions.find(
														(p) => p.action === action,
													);
													if (!permission) {
														return (
															<td
																key={action}
																className='text-center text-muted'>
																—
															</td>
														);
													}
													const locked = !canToggle(permission.name);
													return (
														<td key={action} className='text-center'>
															{locked ? (
																<span title='You cannot grant a permission you do not hold'>
																	<Icon
																		icon='Lock'
																		className='text-muted'
																	/>
																</span>
															) : (
																<TriCheckbox
																	id={`perm-${permission.name}`}
																	label={`${group.label}: ${actionLabel(action)}`}
																	checked={selected.has(
																		permission.name,
																	)}
																	onChange={(on) =>
																		apply([permission.name], on)
																	}
																/>
															)}
														</td>
													);
												})}
												<td className='text-center'>
													<TriCheckbox
														id={`perm-row-${group.resource}`}
														label={`All ${group.label} permissions`}
														checked={rowState.checked}
														indeterminate={rowState.indeterminate}
														disabled={rowState.disabled}
														onChange={(on) => apply(rowNames, on)}
													/>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				);
			})}

			<div className='form-text mt-0'>
				Granting Create, Update or Delete also grants View; removing View removes the
				others.
			</div>
		</div>
	);
};

export default PermissionMatrix;
