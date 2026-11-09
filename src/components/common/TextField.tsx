import React, { FC } from 'react';
import FormGroup from '../bootstrap/forms/FormGroup';
import Input from '../bootstrap/forms/Input';
import Textarea from '../bootstrap/forms/Textarea';
import { TInputTypes } from '../../type/input-type';

interface ITextFieldProps {
	id: string;
	label: string;
	value: string | null | undefined;
	onChange: (value: string) => void;
	feedback?: { isTouched: boolean; isValid: boolean; invalidFeedback?: string };
	required?: boolean;
	type?: TInputTypes;
	multiline?: boolean;
	autoComplete?: string;
	disabled?: boolean;
	className?: string;
}

/** Labelled text input with server validation feedback. */
const TextField: FC<ITextFieldProps> = ({
	id,
	label,
	value,
	onChange,
	feedback,
	required = false,
	type = 'text',
	multiline = false,
	autoComplete,
	disabled = false,
	className = 'col-md-6',
}) => (
	<div className={className}>
		<FormGroup id={id} label={label} required={required}>
			{multiline ? (
				<Textarea
					value={value ?? ''}
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
						onChange(e.target.value)
					}
					disabled={disabled}
					isTouched={feedback?.isTouched}
					isValid={feedback?.isValid}
					invalidFeedback={feedback?.invalidFeedback}
				/>
			) : (
				<Input
					type={type}
					value={value ?? ''}
					autoComplete={autoComplete}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
					disabled={disabled}
					isTouched={feedback?.isTouched}
					isValid={feedback?.isValid}
					invalidFeedback={feedback?.invalidFeedback}
				/>
			)}
		</FormGroup>
	</div>
);

export default TextField;
