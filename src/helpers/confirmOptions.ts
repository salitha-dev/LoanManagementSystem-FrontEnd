import { ConfirmOptions } from '../hooks/useConfirm';

/** Required before Delete, Confirm, Reject, Approve, and Cancel. Not for View, Edit, or Save. */

export function confirmConfirmOptions(entity: string): ConfirmOptions {
	const label = entity.toLowerCase();
	return {
		title: `Confirm ${entity}`,
		message: `Are you sure you want to confirm this ${label}?`,
		subMessage: 'This will apply the change in the system.',
		confirmLabel: 'Yes, confirm',
		cancelLabel: 'No, go back',
		confirmColor: 'success',
		icon: 'CheckCircle',
	};
}

export function discardConfirmOptions(): ConfirmOptions {
	return {
		title: 'Cancel',
		message: 'Are you sure you want to cancel? Unsaved changes will be lost.',
		confirmLabel: 'Yes, cancel',
		cancelLabel: 'No, go back',
		confirmColor: 'warning',
		icon: 'Warning',
	};
}

export function deleteConfirmOptions(entity: string): ConfirmOptions {
	const label = entity.toLowerCase();
	return {
		title: `Delete ${entity}`,
		message: `Are you sure you want to delete this ${label}?`,
		subMessage: 'This action cannot be undone.',
		confirmLabel: 'Yes, delete',
		cancelLabel: 'No, keep it',
		confirmColor: 'danger',
		icon: 'Delete',
	};
}

export function approveConfirmOptions(entity: string, subMessage?: string): ConfirmOptions {
	const label = entity.toLowerCase();
	return {
		title: `Approve ${entity}`,
		message: `Are you sure you want to approve this ${label}?`,
		subMessage: subMessage || 'This will apply the change in the system.',
		confirmLabel: 'Yes, approve',
		cancelLabel: 'No, go back',
		confirmColor: 'success',
		icon: 'CheckCircle',
	};
}

export function rejectConfirmOptions(entity: string): ConfirmOptions {
	const label = entity.toLowerCase();
	return {
		title: `Reject ${entity}`,
		message: `Are you sure you want to reject this ${label}?`,
		subMessage: 'The requester will be notified.',
		confirmLabel: 'Yes, reject',
		cancelLabel: 'No, go back',
		confirmColor: 'danger',
		icon: 'Cancel',
	};
}

export function cancelConfirmOptions(entity: string): ConfirmOptions {
	const label = entity.toLowerCase();
	return {
		title: `Cancel ${entity}`,
		message: `Are you sure you want to cancel this ${label}?`,
		subMessage: 'This action cannot be undone.',
		confirmLabel: 'Yes, cancel',
		cancelLabel: 'No, keep it',
		confirmColor: 'warning',
		icon: 'Warning',
	};
}

export function saveConfirmOptions(entity: string, isNew = false): ConfirmOptions {
	return {
		title: isNew ? `Create ${entity}` : `Save ${entity}`,
		message: isNew
			? `Create this ${entity.toLowerCase()} now?`
			: `Save changes to this ${entity.toLowerCase()}?`,
		confirmLabel: isNew ? 'Yes, create' : 'Yes, save',
		cancelLabel: 'No, go back',
		confirmColor: 'primary',
		icon: isNew ? 'Add' : 'Save',
	};
}

export function revokeConfirmOptions(entity: string): ConfirmOptions {
	const label = entity.toLowerCase();
	return {
		title: `Revoke ${entity}`,
		message: `Are you sure you want to revoke this ${label}?`,
		subMessage: 'Access may be blocked immediately.',
		confirmLabel: 'Yes, revoke',
		cancelLabel: 'No, keep it',
		confirmColor: 'danger',
		icon: 'Block',
	};
}

export function completeConfirmOptions(entity: string): ConfirmOptions {
	const label = entity.toLowerCase();
	return {
		title: `Complete ${entity}`,
		message: `Mark this ${label} as completed?`,
		confirmLabel: 'Yes, complete',
		cancelLabel: 'No, go back',
		confirmColor: 'success',
		icon: 'CheckCircle',
	};
}

export function criticalConfirmOptions(
	title: string,
	message: string,
	opts?: Partial<ConfirmOptions>,
): ConfirmOptions {
	return {
		title,
		message,
		confirmLabel: 'Yes, continue',
		cancelLabel: 'No, go back',
		confirmColor: 'warning',
		icon: 'HelpOutline',
		...opts,
	};
}
