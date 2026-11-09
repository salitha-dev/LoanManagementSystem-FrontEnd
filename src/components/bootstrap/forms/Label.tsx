import React, { FC, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';

interface ILabelProps extends HTMLAttributes<HTMLLabelElement> {
	htmlFor?: string;
	className?: string;
	children?: ReactNode;
	isColForLabel?: boolean;
	isHidden?: boolean;
	size?: 'sm' | null | 'lg';
	title?: string;
	ariaLabelledby?: string;
	ariaLabel?: string;
	required?: boolean;
}
const Label: FC<ILabelProps> = ({
	htmlFor,
	className,
	children,
	isColForLabel,
	isHidden,
	size,
	title,
	ariaLabelledby,
	ariaLabel,
	required,
	...props
}) => {
	return (
		<label
			htmlFor={htmlFor}
			className={classNames(
				'form-label',
				{
					'col-form-label': isColForLabel,
					[`col-form-label-${size}`]: isColForLabel && !!size,
					'visually-hidden': isHidden,
				},
				className,
			)}
			title={title}
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledby}
			{...props}>
			{children}
			{required ? (
				<span className='cp-required' aria-hidden='true'>
					*
				</span>
			) : null}
		</label>
	);
};

export default Label;
