import React, { FC, FormEvent, ReactNode } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../bootstrap/Modal';
import Button from '../bootstrap/Button';
import Spinner from '../bootstrap/Spinner';

interface IFormModalProps {
	id: string;
	title: string;
	isOpen: boolean;
	onClose: () => void;
	/** Omit for read-only (view) modals. */
	onSubmit?: () => void;
	saving?: boolean;
	submitLabel?: string;
	size?: 'sm' | 'lg' | 'xl' | null;
	children: ReactNode;
}

/** Standard create / edit / view dialog used by every admin page. */
const FormModal: FC<IFormModalProps> = ({
	id,
	title,
	isOpen,
	onClose,
	onSubmit,
	saving = false,
	submitLabel = 'Save',
	size = 'lg',
	children,
}) => {
	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		if (!saving) onSubmit?.();
	};

	return (
		<Modal
			id={id}
			titleId={`${id}-title`}
			isOpen={isOpen}
			setIsOpen={(open: unknown) => {
				if (!open && !saving) onClose();
			}}
			size={size}
			isStaticBackdrop={saving}
			isCentered>
			<ModalHeader setIsOpen={() => !saving && onClose()}>
				<ModalTitle id={`${id}-title`}>{title}</ModalTitle>
			</ModalHeader>
			<ModalBody>
				{/* Enter submits; the footer button submits the same handler. */}
				<form id={`${id}-form`} noValidate onSubmit={handleSubmit}>
					{children}
					<button type='submit' className='d-none' aria-hidden='true' tabIndex={-1} />
				</form>
			</ModalBody>
			<ModalFooter>
				<Button action='close' isDisable={saving} onClick={onClose}>
					{onSubmit ? 'Cancel' : 'Close'}
				</Button>
				{onSubmit && (
					<Button action='save' isDisable={saving} onClick={() => !saving && onSubmit()}>
						{saving && <Spinner isSmall inButton isGrow />}
						{submitLabel}
					</Button>
				)}
			</ModalFooter>
		</Modal>
	);
};

export default FormModal;
