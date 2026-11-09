import { ApiError } from '../api/types';

export type FieldErrors = Record<string, string>;

function firstMessage(messages: unknown): string | undefined {
	if (Array.isArray(messages)) {
		const unique: string[] = [];
		messages.forEach((item) => {
			const text = firstMessage(item);
			if (text && !unique.includes(text)) unique.push(text);
		});
		return unique[0];
	}
	if (messages == null) return undefined;
	const text = String(messages).trim();
	return text || undefined;
}

/**
 * Map Laravel validation keys onto flat form field names.
 * e.g. items.0.imei → items, imei, items.0.imei
 */
function fieldAliases(key: string): string[] {
	const aliases = new Set<string>([key]);
	const parts = key.split('.');

	// items.0.imei → imei (leaf) and items (collection)
	if (parts.length >= 2) {
		const leaf = parts[parts.length - 1];
		if (leaf && !/^\d+$/.test(leaf)) aliases.add(leaf);
		if (parts[0] && !/^\d+$/.test(parts[0])) aliases.add(parts[0]);
	}

	// items.0 → items
	const indexed = key.match(/^([A-Za-z_][A-Za-z0-9_]*)\.\d+/);
	if (indexed) aliases.add(indexed[1]);

	const field = key.replace(/\.\d+$/, '');
	aliases.add(field);

	aliases.forEach((alias) => {
		if (alias.endsWith('_cents')) aliases.add(alias.slice(0, -6));
		if (alias.endsWith('_bps')) aliases.add(alias.slice(0, -4));
	});

	return [...aliases];
}

export function toFieldErrors(error: unknown): FieldErrors {
	if (error instanceof ApiError && error.errors) {
		const out: FieldErrors = {};
		Object.entries(error.errors).forEach(([key, messages]) => {
			const text = firstMessage(messages);
			if (!text) return;
			fieldAliases(key).forEach((alias) => {
				if (!out[alias]) out[alias] = text;
			});
		});
		if (out.district_ids && !out.district_id) out.district_id = out.district_ids;
		if (out.name && !out.first_name) out.first_name = out.name;
		return out;
	}
	return {};
}

/** First validation message for toasts when field errors may be off-screen. */
export function firstFieldErrorMessage(errors: FieldErrors, fallback?: string): string | undefined {
	const values = Object.values(errors).filter(Boolean);
	if (values.length) return values[0];
	return fallback?.trim() || undefined;
}

export function fieldFeedback(errors: FieldErrors, key: string) {
	const raw = errors[key];
	const message = Array.isArray(raw) ? raw.find(Boolean) : raw;
	return {
		isTouched: Boolean(message),
		isValid: !message,
		invalidFeedback: message ? String(message) : undefined,
	};
}

export function clearFieldError(errors: FieldErrors, key: string): FieldErrors {
	if (!errors[key] && !errors[`${key}_cents`] && !errors[`${key}_bps`]) return errors;
	const next = { ...errors };
	delete next[key];
	delete next[`${key}_cents`];
	delete next[`${key}_bps`];
	return next;
}
