import React, {
	createContext,
	FC,
	ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import Button from '../components/bootstrap/Button';
import Icon from '../components/icon/Icon';
import { TIcons } from '../type/icons-type';

export type ConfirmColor = 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'dark';

export type ConfirmOptions = {
	title?: string;
	message?: string;
	subMessage?: string;
	confirmLabel?: string;
	confirmText?: string;
	cancelLabel?: string;
	confirmColor?: ConfirmColor;
	color?: ConfirmColor;
	icon?: TIcons | string;
};

type ConfirmFn = (opts?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

type PendingState = {
	options: {
		title: string;
		message: string;
		subMessage: string;
		confirmLabel: string;
		cancelLabel: string;
		confirmColor: ConfirmColor;
		icon: string;
	};
	resolve: (value: boolean) => void;
};

const defaults = {
	title: 'Confirm action',
	message: 'Are you sure you want to continue?',
	subMessage: '',
	confirmLabel: 'Yes, continue',
	cancelLabel: 'No, go back',
	confirmColor: 'primary' as ConfirmColor,
	icon: 'HelpOutline',
};

export const ConfirmProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const [pending, setPending] = useState<PendingState | null>(null);
	const pendingRef = useRef<PendingState | null>(null);

	const close = useCallback((result: boolean) => {
		const current = pendingRef.current;
		pendingRef.current = null;
		setPending(null);
		current?.resolve(result);
	}, []);

	const confirm = useCallback<ConfirmFn>((opts) => {
		return new Promise<boolean>((resolve) => {
			if (pendingRef.current) {
				pendingRef.current.resolve(false);
			}

			const next: PendingState = {
				options: {
					title: opts?.title || defaults.title,
					message: opts?.message || defaults.message,
					subMessage: opts?.subMessage || '',
					confirmLabel: opts?.confirmLabel || opts?.confirmText || defaults.confirmLabel,
					cancelLabel: opts?.cancelLabel || defaults.cancelLabel,
					confirmColor: opts?.confirmColor || opts?.color || defaults.confirmColor,
					icon: String(opts?.icon || defaults.icon),
				},
				resolve,
			};

			pendingRef.current = next;
			setPending(next);
		});
	}, []);

	const value = useMemo(() => confirm, [confirm]);

	const dialog =
		pending && typeof document !== 'undefined'
			? createPortal(
					<div
						className='app-confirm-overlay'
						role='presentation'
						onMouseDown={(event) => event.stopPropagation()}>
						<div
							className='app-confirm-dialog'
							role='alertdialog'
							aria-modal='true'
							aria-labelledby='app-confirm-title'
							aria-describedby='app-confirm-message'>
							<div className='app-confirm-dialog__header'>
								<Icon icon={pending.options.icon} />
								<h5 id='app-confirm-title' className='app-confirm-dialog__title'>
									{pending.options.title}
								</h5>
							</div>
							<div className='app-confirm-dialog__body'>
								<p id='app-confirm-message' className='mb-0'>
									{pending.options.message}
								</p>
								{pending.options.subMessage ? (
									<p className='text-muted small mt-2 mb-0'>
										{pending.options.subMessage}
									</p>
								) : null}
							</div>
							<div className='app-confirm-dialog__footer'>
								<Button action='close' type='button' onClick={() => close(false)}>
									{pending.options.cancelLabel}
								</Button>
								<Button
									action={
										pending.options.confirmColor === 'danger'
											? 'delete'
											: pending.options.confirmColor === 'success'
												? 'approve'
												: pending.options.confirmColor === 'warning'
													? 'cancel'
													: 'submit'
									}
									type='button'
									onClick={() => close(true)}>
									{pending.options.confirmLabel}
								</Button>
							</div>
						</div>
					</div>,
					document.body,
				)
			: null;

	return (
		<ConfirmContext.Provider value={value}>
			{children}
			{dialog}
		</ConfirmContext.Provider>
	);
};

/**
 * System-wide confirmation dialog. Use before Delete / Approve / Reject / Cancel
 * and other destructive actions. Do not use for View, Edit, or Save.
 */
export default function useConfirm(): ConfirmFn {
	const ctx = useContext(ConfirmContext);
	if (!ctx) {
		return async (opts) => window.confirm(opts?.message || 'Are you sure?');
	}
	return ctx;
}
