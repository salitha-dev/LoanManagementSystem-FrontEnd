import { TColor } from '../type/color-type';
import { TIcons } from '../type/icons-type';

/**
 * Shared button actions. Same action → same colour and icon everywhere.
 * Pass `action` on `<Button>`; only override colour/icon when there is no matching action.
 */
export type UiButtonAction =
	| 'view'
	| 'approve'
	| 'reject'
	| 'review'
	| 'request_information'
	| 'provide_information'
	| 'issue'
	| 'cancel'
	| 'create'
	| 'add'
	| 'edit'
	| 'save'
	| 'submit'
	| 'confirm'
	| 'close'
	| 'back'
	| 'delete'
	| 'refresh'
	| 'export_excel'
	| 'export_csv'
	| 'export_pdf';

export type UiButtonPreset = {
	color: TColor | 'link' | 'brand';
	icon: TIcons;
	isLight: boolean;
};

export const UI_BUTTON_ACTIONS: Record<UiButtonAction, UiButtonPreset> = {
	view: { color: 'info', icon: 'Visibility', isLight: true },
	approve: { color: 'success', icon: 'CheckCircle', isLight: false },
	reject: { color: 'danger', icon: 'Cancel', isLight: true },
	review: { color: 'info', icon: 'ManageSearch', isLight: true },
	request_information: { color: 'warning', icon: 'HelpOutline', isLight: true },
	provide_information: { color: 'primary', icon: 'Reply', isLight: false },
	issue: { color: 'primary', icon: 'Verified', isLight: false },
	cancel: { color: 'warning', icon: 'Close', isLight: true },
	create: { color: 'success', icon: 'Add', isLight: false },
	add: { color: 'success', icon: 'Add', isLight: false },
	edit: { color: 'warning', icon: 'Edit', isLight: true },
	save: { color: 'success', icon: 'Save', isLight: false },
	submit: { color: 'success', icon: 'Send', isLight: false },
	confirm: { color: 'success', icon: 'CheckCircle', isLight: false },
	close: { color: 'light', icon: 'Close', isLight: false },
	back: { color: 'light', icon: 'ArrowBack', isLight: false },
	delete: { color: 'danger', icon: 'Delete', isLight: true },
	refresh: { color: 'light', icon: 'Refresh', isLight: false },
	export_excel: { color: 'success', icon: 'GridOn', isLight: true },
	export_csv: { color: 'info', icon: 'Description', isLight: true },
	export_pdf: { color: 'danger', icon: 'PictureAsPdf', isLight: true },
};

export const requiredLabelText = (label?: string): { text: string; required: boolean } => {
	if (!label) return { text: '', required: false };
	const starred = /\s*\*\s*$/.test(label);
	return {
		text: starred ? label.replace(/\s*\*\s*$/, '').trimEnd() : label,
		required: starred,
	};
};
