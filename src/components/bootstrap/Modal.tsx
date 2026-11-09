import React, {
	FC,
	forwardRef,
	HTMLAttributes,
	ReactElement,
	ReactNode,
	useLayoutEffect,
	useRef,
} from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import Portal from '../../layout/Portal/Portal';
import TagWrapper from '../TagWrapper';
import useEventListener from '../../hooks/useEventListener';
import { TModalFullScreen, TModalSize } from '../../type/modal-type';

interface IModalTitleProps extends HTMLAttributes<HTMLElement> {
	id: string;
	children: ReactNode;
	className?: string;
	tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span';
}
export const ModalTitle = forwardRef<HTMLHeadingElement, IModalTitleProps>(
	({ tag = 'h5', id, children, className, ...props }, ref) => {
		return (
			<TagWrapper
				tag={tag}
				ref={ref}
				id={id}
				className={classNames('modal-title', className)}
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...props}>
				{children}
			</TagWrapper>
		);
	},
);
ModalTitle.displayName = 'ModalTitle';

interface IModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactElement<IModalTitleProps> | ReactNode;
	className?: string;
	setIsOpen?(...args: unknown[]): unknown | undefined;
}
export const ModalHeader = forwardRef<HTMLDivElement, IModalHeaderProps>(
	({ children, className, setIsOpen, ...props }, ref) => {
		return (
			<div ref={ref} className={classNames('modal-header', className)} {...props}>
				{children}
				{setIsOpen && (
					<button
						type='button'
						className='btn-close'
						data-bs-dismiss='modal'
						aria-label='Close'
						onClick={() => setIsOpen(false)}
					/>
				)}
			</div>
		);
	},
);
ModalHeader.displayName = 'ModalHeader';

interface IModalBodyProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
export const ModalBody = forwardRef<HTMLDivElement, IModalBodyProps>(
	({ children, className, ...props }, ref) => {
		return (
			<div ref={ref} className={classNames('modal-body', className)} {...props}>
				{children}
			</div>
		);
	},
);
ModalBody.displayName = 'ModalBody';

interface IModalFooterProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
export const ModalFooter = forwardRef<HTMLDivElement, IModalFooterProps>(
	({ children, className, ...props }, ref) => {
		return (
			<div ref={ref} className={classNames('modal-footer', className)} {...props}>
				{children}
			</div>
		);
	},
);
ModalFooter.displayName = 'ModalFooter';

interface IModalProps extends Record<string, any> {
	children:
		| ReactElement<IModalHeaderProps>[]
		| ReactElement<IModalBodyProps>[]
		| ReactElement<IModalFooterProps>[];
	isOpen: boolean;
	setIsOpen(...args: unknown[]): unknown;
	id?: string | undefined;
	titleId?: string;
	isStaticBackdrop?: boolean;
	isScrollable?: boolean;
	isCentered?: boolean;
	size?: TModalSize;
	fullScreen?: TModalFullScreen;
	isAnimation?: boolean;
}
const Modal: FC<IModalProps> = ({
	children,
	isOpen,
	setIsOpen,
	id,
	titleId,
	isStaticBackdrop,
	isScrollable = true,
	isCentered,
	size,
	fullScreen,
	isAnimation = true,
	...props
}) => {
	const refModal = useRef(null);
	const ref = useRef(null);

	useLayoutEffect(() => {
		if (!isOpen) {
			document.body.classList.remove('modal-open');
			document.documentElement.classList.remove('modal-open');
			document.body.style.removeProperty('overflow');
			document.documentElement.style.removeProperty('overflow');
			document.body.style.removeProperty('padding-right');
			return undefined;
		}

		const { body, documentElement } = document;
		const scrollbarGap = window.innerWidth - documentElement.clientWidth;

		body.classList.add('modal-open');
		documentElement.classList.add('modal-open');
		body.style.overflow = 'hidden';
		documentElement.style.overflow = 'hidden';
		if (scrollbarGap > 0) {
			body.style.paddingRight = `${scrollbarGap}px`;
		}

		return () => {
			body.classList.remove('modal-open');
			documentElement.classList.remove('modal-open');
			body.style.removeProperty('overflow');
			documentElement.style.removeProperty('overflow');
			body.style.removeProperty('padding-right');
		};
	}, [isOpen]);

	useLayoutEffect(() => {
		return () => {
			document.body.classList.remove('modal-open');
			document.documentElement.classList.remove('modal-open');
			document.body.style.removeProperty('overflow');
			document.documentElement.style.removeProperty('overflow');
			document.body.style.removeProperty('padding-right');
		};
	}, []);

	const isOverlayClick = (event: { target: any }) => {
		const target = event.target as HTMLElement | null;
		if (!target) return false;
		if (
			target.closest?.(
				'.gps-select__menu, .gps-select__menu-portal, .gps-select__option, .gps-select__menu-list',
			)
		) {
			return false;
		}
		if (target.classList?.contains('modal-backdrop')) return true;
		return target === refModal.current;
	};

	const closeModal = (event: { target: any }) => {
		if (!isStaticBackdrop && isOverlayClick(event)) {
			setIsOpen(false);
		}
	};
	useEventListener('mousedown', closeModal);
	useEventListener('touchstart', closeModal); // Touchscreen

	const modalStatic = (event: { target: any }) => {
		if (isStaticBackdrop && isOverlayClick(event)) {
			// @ts-ignore
			refModal.current.classList.add('modal-static');
			// @ts-ignore
			setTimeout(() => refModal.current.classList.remove('modal-static'), 300);
		}
	};
	useEventListener('mousedown', modalStatic);
	useEventListener('touchstart', modalStatic); // Touchscreen

	// Keypress close function
	const escFunction = (event: { key: string }) => {
		if (event.key === 'Escape' && !isStaticBackdrop) {
			setIsOpen(false);
		}
	};
	useEventListener('keydown', escFunction);

	const ANIMATION_PROPS = isAnimation
		? {
				initial: { opacity: 0, y: 24 },
				animate: { opacity: 1, y: 0 },
				exit: { opacity: 0, y: 16 },
				transition: { ease: 'easeInOut' as const, duration: 0.28 },
			}
		: null;

	return (
		<Portal>
			<AnimatePresence mode='wait'>
				{isOpen && (
					<>
						<motion.div
							ref={refModal}
							key='modal'
							className={classNames(
								'modal',
								'cp-modal',
								{ fade: isAnimation },
								'show',
							)}
							role='dialog'
							style={{
								display: 'flex',
								alignItems: isCentered ? 'center' : 'flex-start',
								justifyContent: 'center',
							}}
							id={id}
							tabIndex={-1}
							aria-labelledby={titleId}
							aria-hidden='true'
							data-bs-backdrop={isStaticBackdrop ? 'static' : null}
							data-bs-keyboard={isStaticBackdrop ? 'false' : null}
							{...ANIMATION_PROPS}
							{...props}>
							<div
								ref={ref}
								className={classNames('modal-dialog', {
									'modal-dialog-scrollable': isScrollable,
									'modal-dialog-centered': isCentered,
									[`modal-${size}`]: size,
									[`modal-fullscreen${
										typeof fullScreen === 'string' ? `-${fullScreen}-down` : ''
									}`]: fullScreen,
								})}>
								<div className='modal-content'>{children}</div>
							</div>
						</motion.div>
						<div
							className={classNames('modal-backdrop', { fade: isAnimation }, 'show')}
						/>
					</>
				)}
			</AnimatePresence>
		</Portal>
	);
};

export default Modal;
