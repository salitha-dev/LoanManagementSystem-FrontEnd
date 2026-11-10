import React, { FC } from 'react';
import CascadingSelect, { CascadeLevel, CascadeValue } from './CascadingSelect';
import { FieldErrors } from '../../helpers/formErrors';

export interface SectorValue {
	main_sector_id: number | null;
	sub_sector_id: number | null;
	sector_id: number | null;
}

export const EMPTY_SECTOR: SectorValue = {
	main_sector_id: null,
	sub_sector_id: null,
	sector_id: null,
};

const LEVELS: Record<'main' | 'sub' | 'sector', CascadeLevel> = {
	main: { field: 'main_sector_id', label: 'Main Sector', optionType: 'main-sectors' },
	sub: {
		field: 'sub_sector_id',
		label: 'Sub Sector',
		optionType: 'sub-sectors',
		parentParam: 'main_sector_id',
	},
	sector: {
		field: 'sector_id',
		label: 'Sector',
		optionType: 'sectors',
		parentParam: 'sub_sector_id',
	},
};
const ORDER = ['main', 'sub', 'sector'] as const;

interface ISectorSelectProps {
	idPrefix: string;
	value: SectorValue;
	/** Deepest level shown. 'sub' shows Main Sector + Sub Sector. */
	depth: (typeof ORDER)[number];
	onChange: (next: SectorValue) => void;
	errors?: FieldErrors;
	required?: boolean;
	colClassName?: string;
	isDisabled?: boolean;
}

/** Main Sector → Sub Sector → Sector cascading dropdowns (reusable in facility forms). */
const SectorSelect: FC<ISectorSelectProps> = ({ value, depth, onChange, ...rest }) => (
	<CascadingSelect
		// eslint-disable-next-line react/jsx-props-no-spreading
		{...rest}
		levels={ORDER.slice(0, ORDER.indexOf(depth) + 1).map((level) => LEVELS[level])}
		value={value as unknown as CascadeValue}
		onChange={(next) => onChange({ ...value, ...(next as unknown as SectorValue) })}
	/>
);

export default SectorSelect;
