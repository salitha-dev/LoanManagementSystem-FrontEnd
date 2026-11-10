import React, { FC } from 'react';
import CascadingSelect, { CascadeLevel, CascadeValue } from './CascadingSelect';
import { FieldErrors } from '../../helpers/formErrors';

export interface BankValue {
	bank_id: number | null;
	bank_branch_id: number | null;
	bank_account_id: number | null;
}

export const EMPTY_BANK: BankValue = { bank_id: null, bank_branch_id: null, bank_account_id: null };

const LEVELS: Record<'bank' | 'branch' | 'account', CascadeLevel> = {
	bank: { field: 'bank_id', label: 'Bank', optionType: 'banks' },
	branch: {
		field: 'bank_branch_id',
		label: 'Bank Branch',
		optionType: 'bank-branches',
		parentParam: 'bank_id',
	},
	account: {
		field: 'bank_account_id',
		label: 'Bank Account',
		optionType: 'bank-accounts',
		parentParam: 'bank_branch_id',
	},
};
const ORDER = ['bank', 'branch', 'account'] as const;

interface IBankSelectProps {
	idPrefix: string;
	value: BankValue;
	/** Deepest level shown. 'branch' shows Bank + Bank Branch. */
	depth: (typeof ORDER)[number];
	onChange: (next: BankValue) => void;
	errors?: FieldErrors;
	required?: boolean;
	colClassName?: string;
	isDisabled?: boolean;
}

/** Bank → Bank Branch → Bank Account cascading dropdowns (account numbers masked). */
const BankSelect: FC<IBankSelectProps> = ({ value, depth, onChange, ...rest }) => (
	<CascadingSelect
		// eslint-disable-next-line react/jsx-props-no-spreading
		{...rest}
		levels={ORDER.slice(0, ORDER.indexOf(depth) + 1).map((level) => LEVELS[level])}
		value={value as unknown as CascadeValue}
		onChange={(next) => onChange({ ...value, ...(next as unknown as BankValue) })}
	/>
);

export default BankSelect;
