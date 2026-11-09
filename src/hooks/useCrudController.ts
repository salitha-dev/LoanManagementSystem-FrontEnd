import { useCallback, useContext, useState } from 'react';
import AuthContext from '../contexts/authContext';
import { ApiError } from '../api/types';
import { hasPermission } from '../helpers/permissions';
import { showAppError, showAppSuccess } from '../helpers/appNotify';
import { deleteConfirmOptions } from '../helpers/confirmOptions';
import useConfirm from './useConfirm';
import useFormState from './useFormState';

type Mode = 'create' | 'edit' | 'view';

interface CrudService<T, P> {
	get: (id: number) => Promise<T>;
	create: (payload: P) => Promise<T>;
	update: (id: number, payload: P) => Promise<T>;
	remove: (id: number) => Promise<{ message: string }>;
}

/**
 * Shared create / edit / view / delete flow for admin list pages:
 * permission flags, modal state, form state, save and confirmed delete.
 */
export default function useCrudController<T extends { id: number }, F extends object, P>(options: {
	service: CrudService<T, P>;
	/** Permission prefix, e.g. 'province' → province.create/update/delete. */
	permission: string;
	entity: string;
	emptyForm: F;
	toForm: (record: T) => F;
	toPayload: (form: F, mode: Mode) => P;
	onChanged: () => void;
}) {
	const { service, permission, entity, emptyForm, toForm, toPayload, onChanged } = options;
	const { user } = useContext(AuthContext);
	const confirm = useConfirm();
	const form = useFormState<F>(emptyForm);
	const [mode, setMode] = useState<Mode | null>(null);
	const [record, setRecord] = useState<T | null>(null);
	const [loadingRecord, setLoadingRecord] = useState(false);

	const can = {
		view: hasPermission(user, `${permission}.view`),
		create: hasPermission(user, `${permission}.create`),
		update: hasPermission(user, `${permission}.update`),
		delete: hasPermission(user, `${permission}.delete`),
	};

	const { reset } = form;
	const open = useCallback(
		async (nextMode: Mode, row?: T) => {
			if (!row) {
				setRecord(null);
				reset(emptyForm);
				setMode(nextMode);
				return;
			}
			setLoadingRecord(true);
			try {
				// Fresh copy with relations and audit fields.
				const fresh = await service.get(row.id);
				setRecord(fresh);
				reset(toForm(fresh));
				setMode(nextMode);
			} catch (error) {
				showAppError(`Could not open ${entity.toLowerCase()}`, (error as Error).message);
			} finally {
				setLoadingRecord(false);
			}
		},
		[emptyForm, entity, reset, service, toForm],
	);

	const close = useCallback(() => setMode(null), []);

	const save = useCallback(async () => {
		if (mode !== 'create' && mode !== 'edit') return;
		const payload = toPayload(form.values, mode);
		const ok = await form.submit(
			() =>
				mode === 'create' ? service.create(payload) : service.update(record!.id, payload),
			{
				title: mode === 'create' ? `${entity} created` : `${entity} updated`,
				message: `The ${entity.toLowerCase()} was saved successfully.`,
			},
		);
		if (ok) {
			setMode(null);
			onChanged();
		}
	}, [entity, form, mode, onChanged, record, service, toPayload]);

	const remove = useCallback(
		async (row: T) => {
			if (!(await confirm(deleteConfirmOptions(entity)))) return;
			try {
				await service.remove(row.id);
				showAppSuccess(`${entity} deleted`, `The ${entity.toLowerCase()} was deleted.`);
				onChanged();
			} catch (error) {
				showAppError(
					`Could not delete ${entity.toLowerCase()}`,
					error instanceof ApiError ? error.message : 'Please try again.',
				);
			}
		},
		[confirm, entity, onChanged, service],
	);

	return { can, form, mode, record, loadingRecord, open, close, save, remove };
}
