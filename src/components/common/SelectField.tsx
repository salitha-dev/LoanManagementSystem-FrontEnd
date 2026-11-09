import React, { FC } from 'react';
import FormGroup from '../bootstrap/forms/FormGroup';
import SearchableSelect from '../bootstrap/forms/SearchableSelect';
import { Reference } from '../../api/types';

type Feedback = { isTouched: boolean; isValid: boolean; invalidFeedback?: string };

interface IBaseProps {
	id: string;
	label: string;
	options: Reference[];
	loading?: boolean;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	feedback?: Feedback;
	className?: string;
	/** Option text. Defaults to "Name (CODE)". */
	optionLabel?: (option: Reference) => string;
}

interface ISingleProps extends IBaseProps {
	multiple?: false;
	value: number | null;
	onChange: (value: number | null) => void;
}

interface IMultiProps extends IBaseProps {
	multiple: true;
	value: number[];
	onChange: (value: number[]) => void;
}

const defaultLabel = (o: Reference) =>
	o.code && o.code !== o.name ? `${o.name} (${o.code})` : o.name;

/** Labelled searchable select over {id, code, name} options (single or multiple). */
const SelectField: FC<ISingleProps | IMultiProps> = (props) => {
	const {
		id,
		label,
		options,
		loading,
		required = false,
		disabled = false,
		placeholder,
		feedback,
		className = 'col-md-6',
		optionLabel = defaultLabel,
	} = props;
	const items = options.map((o) => ({ value: String(o.id), label: optionLabel(o) }));
	const common = {
		id,
		options: items,
		isLoading: loading,
		isDisabled: disabled,
		placeholder: placeholder ?? `Select ${label.toLowerCase()}`,
		isInvalid: feedback ? !feedback.isValid : false,
		isTouched: feedback?.isTouched,
		invalidFeedback: feedback?.invalidFeedback,
	};

	return (
		<div className={className}>
			<FormGroup id={id} label={label} required={required}>
				{props.multiple ? (
					<SearchableSelect
						// eslint-disable-next-line react/jsx-props-no-spreading
						{...common}
						isMulti
						value={props.value.map(String)}
						onChange={(values) => props.onChange(values.map(Number))}
					/>
				) : (
					<SearchableSelect
						// eslint-disable-next-line react/jsx-props-no-spreading
						{...common}
						isClearable={!required}
						value={props.value ? String(props.value) : null}
						onChange={(value) => props.onChange(value ? Number(value) : null)}
					/>
				)}
			</FormGroup>
		</div>
	);
};

export default SelectField;
