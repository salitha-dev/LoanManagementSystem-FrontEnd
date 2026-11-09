import React, { FC } from 'react';
import Select, { MultiValue, SingleValue, StylesConfig } from 'react-select';
import Validation from './Validation';

export type SearchableOption = {
	value: string;
	label: string;
};

type BaseProps = {
	id?: string;
	options: SearchableOption[];
	placeholder?: string;
	isDisabled?: boolean;
	isClearable?: boolean;
	isInvalid?: boolean;
	required?: boolean;
	/** Same shape as `fieldFeedback()` so it can be spread like on `Input`. */
	isTouched?: boolean;
	isValid?: boolean;
	invalidFeedback?: string;
	isLoading?: boolean;
	/** Called with the typed text, e.g. to search the server. */
	onInputChange?: (value: string) => void;
};

type SingleProps = BaseProps & {
	isMulti?: false;
	value?: string | null;
	onChange: (value: string) => void;
};

type MultiProps = BaseProps & {
	isMulti: true;
	value?: string[];
	onChange: (value: string[]) => void;
};

type Props = SingleProps | MultiProps;

const selectStyles = (isInvalid?: boolean): StylesConfig<SearchableOption, boolean> => ({
	control: (base, state) => ({
		...base,
		minHeight: 42,
		backgroundColor: 'var(--gps-control-bg, var(--bs-body-bg))',
		borderColor: isInvalid
			? 'var(--bs-danger)'
			: state.isFocused
				? 'var(--bs-primary)'
				: 'var(--gps-border, var(--bs-border-color))',
		boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(15, 118, 110, 0.15)' : 'none',
		color: 'var(--gps-text, var(--bs-body-color))',
	}),
	menu: (base) => ({
		...base,
		zIndex: 20000,
		backgroundColor: 'var(--gps-surface-solid, var(--bs-body-bg))',
		color: 'var(--gps-text, var(--bs-body-color))',
		boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
	}),
	menuList: (base) => ({
		...base,
		maxHeight: 280,
		paddingTop: 4,
		paddingBottom: 4,
	}),
	menuPortal: (base) => ({
		...base,
		zIndex: 20000,
		pointerEvents: 'auto',
	}),
	option: (base, state) => ({
		...base,
		backgroundColor: state.isSelected
			? 'var(--gps-accent-soft, rgba(15,118,110,0.16))'
			: state.isFocused
				? 'var(--gps-row-hover, rgba(15,118,110,0.08))'
				: 'transparent',
		color: 'var(--gps-text, var(--bs-body-color))',
	}),
	singleValue: (base) => ({
		...base,
		color: 'var(--gps-text, var(--bs-body-color))',
	}),
	input: (base) => ({
		...base,
		color: 'var(--gps-text, var(--bs-body-color))',
	}),
	placeholder: (base) => ({
		...base,
		color: 'var(--gps-text-muted, var(--bs-secondary-color))',
	}),
	multiValue: (base) => ({
		...base,
		backgroundColor: 'var(--gps-accent-soft, rgba(15,118,110,0.16))',
	}),
	multiValueLabel: (base) => ({
		...base,
		color: 'var(--gps-text, var(--bs-body-color))',
	}),
});

const menuProps = {
	isSearchable: true as const,
	classNamePrefix: 'gps-select',
	className: 'gps-select',
	menuPlacement: 'auto' as const,
	menuPosition: 'fixed' as const,
	menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
	menuShouldScrollIntoView: false,
	blurInputOnSelect: false,
	closeMenuOnSelect: true,
};

const SearchableSelect: FC<Props> = (props) => {
	const feedback = props.isTouched === false ? undefined : props.invalidFeedback;
	const styles = selectStyles(Boolean(props.isInvalid || feedback));
	const validation = feedback ? <Validation isTouched invalidFeedback={feedback} /> : null;

	if (props.isMulti) {
		const selected = props.options.filter((option) =>
			(props.value ?? []).includes(option.value),
		);

		return (
			<>
				<Select<SearchableOption, true>
					inputId={props.id}
					options={props.options}
					value={selected}
					onChange={(options: MultiValue<SearchableOption>) =>
						props.onChange((options ?? []).map((option) => option.value))
					}
					placeholder={props.placeholder ?? 'Search…'}
					isDisabled={props.isDisabled}
					isClearable={props.isClearable}
					isMulti
					required={props.required}
					aria-required={props.required || undefined}
					aria-invalid={Boolean(props.isInvalid || feedback) || undefined}
					styles={styles}
					{...menuProps}
				/>
				{validation}
			</>
		);
	}

	const selected =
		props.options.find((option) => option.value === String(props.value ?? '')) || null;

	return (
		<>
			<Select<SearchableOption, false>
				inputId={props.id}
				options={props.options}
				value={selected}
				onChange={(option: SingleValue<SearchableOption>) =>
					props.onChange(option ? option.value : '')
				}
				placeholder={props.placeholder ?? 'Search…'}
				isDisabled={props.isDisabled}
				isClearable={props.isClearable}
				isLoading={props.isLoading}
				onInputChange={(value, meta) => {
					if (meta.action === 'input-change') props.onInputChange?.(value);
				}}
				required={props.required}
				aria-required={props.required || undefined}
				aria-invalid={Boolean(props.isInvalid || feedback) || undefined}
				styles={styles}
				{...menuProps}
			/>
			{validation}
		</>
	);
};

export default SearchableSelect;
