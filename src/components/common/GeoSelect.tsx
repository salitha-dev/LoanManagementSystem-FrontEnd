import React, { FC } from 'react';
import CascadingSelect, { CascadeLevel, CascadeValue } from './CascadingSelect';
import { FieldErrors } from '../../helpers/formErrors';

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

const LEVELS: Record<'province' | 'district' | 'dsd' | 'gnd', CascadeLevel> = {
	province: { field: 'province_id', label: 'Province', optionType: 'provinces' },
	district: {
		field: 'district_id',
		label: 'District',
		optionType: 'districts',
		parentParam: 'province_id',
	},
	dsd: { field: 'dsd_id', label: 'DSD', optionType: 'dsds', parentParam: 'district_id' },
	gnd: { field: 'gnd_id', label: 'GND', optionType: 'gnds', parentParam: 'dsd_id' },
};
const ORDER = ['province', 'district', 'dsd', 'gnd'] as const;

interface IGeoSelectProps {
	idPrefix: string;
	value: GeoValue;
	/** Deepest level shown. 'district' shows Province + District, etc. */
	depth: (typeof ORDER)[number];
	onChange: (next: GeoValue) => void;
	errors?: FieldErrors;
	required?: boolean;
	colClassName?: string;
	isDisabled?: boolean;
}

/** Province → District → DSD → GND cascading dropdowns. */
const GeoSelect: FC<IGeoSelectProps> = ({ value, depth, onChange, ...rest }) => (
	<CascadingSelect
		// eslint-disable-next-line react/jsx-props-no-spreading
		{...rest}
		levels={ORDER.slice(0, ORDER.indexOf(depth) + 1).map((level) => LEVELS[level])}
		value={value as unknown as CascadeValue}
		onChange={(next) => onChange({ ...value, ...(next as unknown as GeoValue) })}
	/>
);

export default GeoSelect;
