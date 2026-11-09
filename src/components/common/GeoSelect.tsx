import React, { FC } from 'react';
import FormGroup from '../bootstrap/forms/FormGroup';
import SearchableSelect from '../bootstrap/forms/SearchableSelect';
import useOptions from '../../hooks/useOptions';
import { FieldErrors, fieldFeedback } from '../../helpers/formErrors';

export interface GeoValue {
	province_id: number | null;
	district_id: number | null;
	dsd_id: number | null;
	gnd_id: number | null;
}

export const EMPTY_GEO: GeoValue = {
	province_id: null,
	district_id: null,
	dsd_id: null,
	gnd_id: null,
};

type Level = 'province' | 'district' | 'dsd' | 'gnd';
const ORDER: Level[] = ['province', 'district', 'dsd', 'gnd'];

interface IGeoSelectProps {
	idPrefix: string;
	value: GeoValue;
	/** Deepest level shown. 'district' shows Province + District, etc. */
	depth: Level;
	onChange: (next: GeoValue) => void;
	errors?: FieldErrors;
	required?: boolean;
	/** Bootstrap column class per selector. */
	colClassName?: string;
	isDisabled?: boolean;
}

const toOptions = (items: { id: number; code: string; name: string }[]) =>
	items.map((item) => ({ value: String(item.id), label: `${item.name} (${item.code})` }));

/**
 * Province → District → DSD → GND cascading dropdowns. Changing a parent clears every
 * child selection; children load only once their parent is chosen. The backend
 * re-validates the chain, so this is a convenience, not the authority.
 */
const GeoSelect: FC<IGeoSelectProps> = ({
	idPrefix,
	value,
	depth,
	onChange,
	errors = {},
	required = false,
	colClassName = 'col-md-6',
	isDisabled = false,
}) => {
	const shown = (level: Level) => ORDER.indexOf(level) <= ORDER.indexOf(depth);

	const provinces = useOptions('provinces');
	const districts = useOptions(
		'districts',
		shown('district') && value.province_id ? { province_id: value.province_id } : null,
	);
	const dsds = useOptions(
		'dsds',
		shown('dsd') && value.district_id ? { district_id: value.district_id } : null,
	);
	const gnds = useOptions('gnds', shown('gnd') && value.dsd_id ? { dsd_id: value.dsd_id } : null);

	const set = (level: Level, raw: string) => {
		const id = raw ? Number(raw) : null;
		const next: GeoValue = { ...value, [`${level}_id`]: id };
		ORDER.slice(ORDER.indexOf(level) + 1).forEach((child) => {
			next[`${child}_id` as keyof GeoValue] = null;
		});
		onChange(next);
	};

	const field = (
		level: Level,
		label: string,
		state: { options: { id: number; code: string; name: string }[]; loading: boolean },
		parentChosen: boolean,
		placeholder: string,
	) => {
		const key = `${level}_id`;
		const fb = fieldFeedback(errors, key);
		return (
			<div className={colClassName} key={level}>
				<FormGroup id={`${idPrefix}-${level}`} label={label} required={required}>
					<SearchableSelect
						id={`${idPrefix}-${level}`}
						options={toOptions(state.options)}
						value={
							value[key as keyof GeoValue]
								? String(value[key as keyof GeoValue])
								: null
						}
						onChange={(raw) => set(level, raw)}
						placeholder={parentChosen ? `Select ${label.toLowerCase()}` : placeholder}
						isDisabled={isDisabled || !parentChosen}
						isLoading={state.loading}
						isClearable={!required}
						isInvalid={!fb.isValid}
						isTouched={fb.isTouched}
						invalidFeedback={fb.invalidFeedback}
					/>
				</FormGroup>
			</div>
		);
	};

	return (
		<>
			{field('province', 'Province', provinces, true, '')}
			{shown('district') &&
				field(
					'district',
					'District',
					districts,
					Boolean(value.province_id),
					'Select a province first',
				)}
			{shown('dsd') &&
				field('dsd', 'DSD', dsds, Boolean(value.district_id), 'Select a district first')}
			{shown('gnd') && field('gnd', 'GND', gnds, Boolean(value.dsd_id), 'Select a DSD first')}
		</>
	);
};

export default GeoSelect;
