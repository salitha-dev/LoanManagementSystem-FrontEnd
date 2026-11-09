import React, { FC, ReactNode } from 'react';
import Button from '../bootstrap/Button';

interface IRowActionsProps {
	label: string;
	onView?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
	/** Extra buttons rendered before edit/delete (e.g. reset password). */
	extra?: ReactNode;
}

/** View / edit / delete icon buttons. Omit a handler to hide that action (e.g. no permission). */
const RowActions: FC<IRowActionsProps> = ({ label, onView, onEdit, onDelete, extra }) => (
	<div className='d-flex gap-1 justify-content-end flex-nowrap'>
		{onView && <Button action='view' size='sm' onClick={onView} aria-label={`View ${label}`} />}
		{extra}
		{onEdit && <Button action='edit' size='sm' onClick={onEdit} aria-label={`Edit ${label}`} />}
		{onDelete && (
			<Button action='delete' size='sm' onClick={onDelete} aria-label={`Delete ${label}`} />
		)}
	</div>
);

export default RowActions;
