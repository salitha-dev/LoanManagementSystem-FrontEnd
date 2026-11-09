import { useCallback, useState } from 'react';
import { ApiError } from '../api/types';
import { clearFieldError, FieldErrors, fieldFeedback, toFieldErrors } from '../helpers/formErrors';
import { showAppError, showAppSuccess } from '../helpers/appNotify';

/**
 * Small controlled-form state: values, server validation errors, and a submit wrapper
 * that maps 422 responses onto fields and shows notifications.
 */
export default function useFormState<T extends object>(initial: T) {
	const [values, setValues] = useState<T>(initial);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [saving, setSaving] = useState(false);

	const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
		setValues((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => clearFieldError(prev, String(field)));
	}, []);

	const patch = useCallback((next: Partial<T>) => {
		setValues((prev) => ({ ...prev, ...next }));
		setErrors((prev) =>
			Object.keys(next).reduce((acc, key) => clearFieldError(acc, key), prev),
		);
	}, []);

	const reset = useCallback((next: T) => {
		setValues(next);
		setErrors({});
	}, []);

	const submit = useCallback(
		async (action: () => Promise<unknown>, success: { title: string; message: string }) => {
			setSaving(true);
			try {
				await action();
				showAppSuccess(success.title, success.message);
				return true;
			} catch (error) {
				const fieldErrors = toFieldErrors(error);
				setErrors(fieldErrors);
				showAppError(
					'Could not save',
					error instanceof ApiError ? error.message : 'Please try again.',
				);
				return false;
			} finally {
				setSaving(false);
			}
		},
		[],
	);

	return {
		values,
		errors,
		saving,
		setField,
		patch,
		reset,
		submit,
		feedback: (field: string) => fieldFeedback(errors, field),
	};
}
