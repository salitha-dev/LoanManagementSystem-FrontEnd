import React, { cloneElement, FC, HTMLAttributes, ReactElement, ReactNode } from 'react';
import classNames from 'classnames';
import TagWrapper from '../../TagWrapper';
import { requiredLabelText } from '../../../helpers/uiActions';
import Label from './Label';
import FormText from './FormText';

interface IFormGroupProps extends HTMLAttributes<HTMLElement> {
	children: ReactElement | ReactElement[];
	className?: string;
	labelClassName?: string;
	childWrapperClassName?: string;
	tag?: 'div' | 'section';
	isFloating?: boolean;
	id?: string;
	label?: string;
	size?: 'lg' | 'sm' | null;
	isHiddenLabel?: boolean;
	isColForLabel?: boolean;
	formText?: ReactNode;
	required?: boolean;
}
const FormGroup: FC<IFormGroupProps> = ({
	children,
	tag = 'div',
	className,
	labelClassName,
	childWrapperClassName,
	label,
	id,
	isFloating,
	size,
	isColForLabel,
	isHiddenLabel,
	formText,
	required,
	...props
}) => {
	const parsed = requiredLabelText(label);
	const childRequired =
		!Array.isArray(children) &&
		Boolean((children as ReactElement<{ required?: boolean }>)?.props?.required);
	const isRequired = Boolean(required || parsed.required || childRequired);
	const labelText = parsed.text || label;

	const LABEL = (
		<Label
			className={labelClassName}
			htmlFor={id}
			isHidden={isHiddenLabel}
			isColForLabel={isColForLabel}
			size={size}
			required={isRequired}>
			{labelText}
		</Label>
	);

	const childProps =
		(!Array.isArray(children)
			? (children as ReactElement<Record<string, unknown>>)?.props
			: undefined) ?? {};
	const CHILDREN =
		id && !Array.isArray(children)
			? cloneElement(children as ReactElement<Record<string, unknown>>, {
					id,
					size: size || childProps.size,
					placeholder: isFloating ? labelText : childProps.placeholder,
					required: isRequired || childProps.required,
					'aria-required': isRequired || undefined,
					'aria-describedby': formText ? `${id}-text` : null,
					...((children.type as { displayName?: string })?.displayName === 'Input'
						? { isFloating }
						: {}),
				})
			: children;

	const FORM_TEXT = formText && <FormText id={`${id}-text`}>{formText}</FormText>;
	return (
		<TagWrapper
			tag={tag}
			className={classNames({ 'form-floating': isFloating, row: isColForLabel }, className)}
			// eslint-disable-next-line react/jsx-props-no-spreading
			{...props}>
			{label && !isFloating && LABEL}

			{childWrapperClassName ? (
				<div className={childWrapperClassName}>
					{CHILDREN}
					{FORM_TEXT}
				</div>
			) : (
				CHILDREN
			)}

			{label && isFloating && LABEL}

			{!childWrapperClassName && FORM_TEXT}
		</TagWrapper>
	);
};

export default FormGroup;
