import React, { FC } from 'react';
import FormGroup from '../bootstrap/forms/FormGroup';
import SearchableSelect from '../bootstrap/forms/SearchableSelect';
import useOptions from '../../hooks/useOptions';
import { OptionType } from '../../api/resource';
import { FieldErrors, fieldFeedback } from '../../helpers/formErrors';

export interface CascadeLevel {
	/** Form field holding this level's id, e.g. 'district_id'. */
	field: string;
	label: string;
	/** `/options/{type}` source. */
	optionType: OptionType;
	/** Query param naming the parent id (omitted for the top level). */
	parentParam?: string;
}

export type CascadeValue = Record<string, number | null>;

interface ICascadingSelectProps {
	idPrefix: string;
	/** Ordered top → bottom; only these levels are shown. */
	levels: CascadeLevel[];
	value: CascadeValue;
	onChange: (next: CascadeValue) => void;
	errors?: FieldErrors;
	required?: boolean;
	/** Bootstrap column class per selector. */
	colClassName?: string;
	isDisabled?: boolean;
}

interface ICascadeFieldProps {
	id: string;
	level: CascadeLevel;
	parentId: number | null | undefined;
	isTop: boolean;
	parentLabel?: string;
	selected: number | null;
	onSelect: (id: number | null) => void;
	errors: FieldErrors;
	required: boolean;
	colClassName: string;
	isDisabled: boolean;
}

/** Lower-case a label for running text, but keep acronyms such as DSD / GND. */
const inText = (label: string) => (label === label.toUpperCase() ? label : label.toLowerCase());

const CascadeField: FC<ICascadeFieldProps> = ({
	id,
	level,
	parentId,
	isTop,
	parentLabel,
	selected,
	onSelect,
	errors,
	required,
	colClassName,
	isDisabled,
}) => {
	const parentChosen = isTop || Boolean(parentId);
	const { options, loading } = useOptions(
		level.optionType,
		isTop ? {} : parentId && level.parentParam ? { [level.parentParam]: parentId } : null,
	);
	const fb = fieldFeedback(errors, level.field);

	return (
		<div className={colClassName}>
			<FormGroup id={id} label={level.label} required={required}>
				<SearchableSelect
					id={id}
					options={options.map((o) => ({
						value: String(o.id),
						label: `${o.name} (${o.code})`,
					}))}
					value={selected ? String(selected) : null}
					onChange={(raw) => onSelect(raw ? Number(raw) : null)}
					placeholder={
						parentChosen
							? `Select ${inText(level.label)}`
							: `Select a ${inText(parentLabel ?? 'parent')} first`
					}
					isDisabled={isDisabled || !parentChosen}
					isLoading={loading}
					isClearable={!required}
					isInvalid={!fb.isValid}
					isTouched={fb.isTouched}
					invalidFeedback={fb.invalidFeedback}
				/>
			</FormGroup>
		</div>
	);
};

/**
 * Dependent dropdowns over a parent → child hierarchy (geography, sectors, ...).
 * Changing a level clears every level below it; a child loads only once its parent
 * is chosen. The backend re-validates the chain; this is a convenience, not the authority.
 */
const CascadingSelect: FC<ICascadingSelectProps> = ({
	idPrefix,
	levels,
	value,
	onChange,
	errors = {},
	required = false,
	colClassName = 'col-md-6',
	isDisabled = false,
}) => {
	const select = (index: number, id: number | null) => {
		const next: CascadeValue = { ...value, [levels[index].field]: id };
		levels.slice(index + 1).forEach((child) => {
			next[child.field] = null;
		});
		onChange(next);
	};

	return (
		<>
			{levels.map((level, index) => (
				<CascadeField
					key={level.field}
					id={`${idPrefix}-${level.field}`}
					level={level}
					isTop={index === 0}
					parentId={index > 0 ? value[levels[index - 1].field] : null}
					parentLabel={index > 0 ? levels[index - 1].label : undefined}
					selected={value[level.field] ?? null}
					onSelect={(id) => select(index, id)}
					errors={errors}
					required={required}
					colClassName={colClassName}
					isDisabled={isDisabled}
				/>
			))}
		</>
	);
};

export default CascadingSelect;
