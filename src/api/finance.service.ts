import { apiPayload, apiRequest } from './client';
import { createResourceService, ListParams } from './resource';
import { PaginatedResponse, Reference } from './types';
import { AuditFields } from './admin.service';

export interface Bank extends AuditFields {
	id: number;
	bank_code: string;
	bank_name: string;
	short_name: string | null;
	branches_count?: number;
}

export interface BankBranch extends AuditFields {
	id: number;
	bank_id: number;
	bank?: Reference | null;
	branch_code: string;
	branch_name: string;
	address: string | null;
	contact_number: string | null;
	accounts_count?: number;
}

export const BANK_ACCOUNT_TYPES = [
	{ value: 'savings', label: 'Savings' },
	{ value: 'current', label: 'Current' },
	{ value: 'other', label: 'Other' },
] as const;

/** account_number is masked (****1234) unless account_number_revealed is true. */
export interface BankAccount extends AuditFields {
	id: number;
	bank_branch_id: number;
	bank_branch?: Reference | null;
	bank?: Reference | null;
	account_number: string;
	account_number_masked: string;
	account_number_revealed: boolean;
	account_name: string;
	account_type: string;
	account_type_label: string;
	currency_code: string;
	/** Decimal string, e.g. "150000.50" — never parsed for arithmetic in the UI. */
	opening_balance: string;
	opening_date: string | null;
	description: string | null;
	cheque_books_count?: number;
	has_financial_activity?: boolean;
}

export type ChequeLeafState =
	'available' | 'issued' | 'presented' | 'cleared' | 'returned' | 'cancelled';

export interface ChequeBook extends AuditFields {
	id: number;
	bank_account_id: number;
	bank_account?: Reference | null;
	bank?: Reference | null;
	cheque_book_number: string | null;
	start_cheque_number: string;
	end_cheque_number: string;
	total_leaves: number;
	issued_date: string | null;
	received_date: string | null;
	available_leaves?: number;
	state_counts?: Record<ChequeLeafState, number>;
	is_used?: boolean;
}

export interface ChequeLeafHistory {
	id: number;
	from_state: ChequeLeafState;
	to_state: ChequeLeafState;
	reason: string | null;
	user: { id: number; full_name: string } | null;
	cheque_reactivation_id: number | null;
	created_at: string | null;
}

export interface ChequeLeaf {
	id: number;
	cheque_book_id: number;
	bank_account_id: number;
	bank_account?: Reference | null;
	cheque_number: string;
	state: ChequeLeafState;
	state_label: string;
	state_changed_at: string | null;
	history?: ChequeLeafHistory[];
}

export interface ChequeReactivation {
	id: number;
	cheque_leaf_id: number;
	cheque_leaf?: ChequeLeaf;
	previous_state: ChequeLeafState;
	requested_state: ChequeLeafState;
	status: 'pending' | 'approved' | 'rejected';
	reason: string;
	requested_by?: { id: number; full_name: string } | null;
	approved_by?: { id: number; full_name: string } | null;
	approved_at: string | null;
	rejected_by?: { id: number; full_name: string } | null;
	rejected_at: string | null;
	rejection_reason: string | null;
	can_decide: boolean;
	created_at: string | null;
}

export type BankPayload = Pick<Bank, 'bank_code' | 'bank_name' | 'short_name'>;
export type BankBranchPayload = Pick<
	BankBranch,
	'bank_id' | 'branch_code' | 'branch_name' | 'address' | 'contact_number'
>;
export type BankAccountPayload = {
	bank_id: number | null;
	bank_branch_id: number | null;
	account_number: string;
	account_name: string;
	account_type: string;
	currency_code: string;
	opening_balance: string;
	opening_date: string | null;
	description: string | null;
};
export type ChequeBookPayload = {
	bank_account_id: number | null;
	cheque_book_number: string | null;
	start_cheque_number: string;
	end_cheque_number: string;
	issued_date: string;
	received_date: string | null;
};

export const bankService = createResourceService<Bank, BankPayload>('/banks');
export const bankBranchService = createResourceService<BankBranch, BankBranchPayload>(
	'/bank-branches',
);
export const bankAccountService = createResourceService<BankAccount, BankAccountPayload>(
	'/bank-accounts',
);
export const chequeBookService = createResourceService<ChequeBook, ChequeBookPayload>(
	'/cheque-books',
);

const clean = (params: ListParams) =>
	Object.fromEntries(
		Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
	);

export const chequeLeafService = {
	listForBook: (bookId: number, params: ListParams = {}) =>
		apiPayload<PaginatedResponse<ChequeLeaf>>(
			'get',
			`/cheque-books/${bookId}/leaves`,
			undefined,
			clean(params),
		),
	get: (id: number) => apiRequest<ChequeLeaf>('get', `/cheque-leaves/${id}`),
	cancel: (id: number, reason: string) =>
		apiRequest<ChequeLeaf>('post', `/cheque-leaves/${id}/cancel`, { reason }),
};

/** "Cheque Reactive": maker-checker requests; no edit or delete by design. */
export const chequeReactivationService = {
	list: (params: ListParams = {}) =>
		apiPayload<PaginatedResponse<ChequeReactivation>>(
			'get',
			'/cheque-reactivations',
			undefined,
			clean(params),
		),
	get: (id: number) => apiRequest<ChequeReactivation>('get', `/cheque-reactivations/${id}`),
	eligibleLeaves: (bankAccountId: number) =>
		apiRequest<ChequeLeaf[]>('get', '/cheque-reactivations/eligible-leaves', undefined, {
			bank_account_id: bankAccountId,
		}),
	create: (payload: { cheque_leaf_id: number; reason: string }) =>
		apiRequest<ChequeReactivation>('post', '/cheque-reactivations', payload),
	approve: (id: number) =>
		apiRequest<ChequeReactivation>('post', `/cheque-reactivations/${id}/approve`),
	reject: (id: number, reason: string) =>
		apiRequest<ChequeReactivation>('post', `/cheque-reactivations/${id}/reject`, { reason }),
};

/** Display only: formats a decimal string as money without float arithmetic on the value. */
export const formatMoney = (amount: string | null | undefined, currency = 'LKR') => {
	if (amount === null || amount === undefined || amount === '') return '—';
	const [whole, fraction = ''] = amount.replace('-', '').split('.');
	const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return `${amount.startsWith('-') ? '-' : ''}${currency} ${grouped}.${fraction.padEnd(2, '0').slice(0, 2)}`;
};

export const CHEQUE_STATE_COLORS: Record<
	ChequeLeafState,
	'success' | 'info' | 'primary' | 'secondary' | 'warning' | 'danger'
> = {
	available: 'success',
	issued: 'info',
	presented: 'primary',
	cleared: 'secondary',
	returned: 'warning',
	cancelled: 'danger',
};
