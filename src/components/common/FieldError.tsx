import React, { FC, useLayoutEffect, useRef, useState } from 'react';

const FEEDBACK = '.invalid-feedback, .invalid-tooltip';

const isShown = (element: Element): boolean =>
	!element.classList.contains('d-none') && getComputedStyle(element).display !== 'none';

/** True when a control earlier in the same container already shows this message. */
export const shownByPreviousField = (node: HTMLElement | null, text: string): boolean => {
	const wanted = text.trim();
	for (
		let sibling = node?.previousElementSibling;
		sibling;
		sibling = sibling.previousElementSibling
	) {
		const feedback = sibling.matches(FEEDBACK)
			? [sibling]
			: Array.from(sibling.querySelectorAll(FEEDBACK));
		if (
			feedback.some((element) => isShown(element) && element.textContent?.trim() === wanted)
		) {
			return true;
		}
	}
	return false;
};

const FieldError: FC<{ message?: string | string[] }> = ({ message }) => {
	const text = Array.isArray(message) ? message.find(Boolean) : message;
	const ref = useRef<HTMLDivElement>(null);
	const [duplicate, setDuplicate] = useState(false);

	// Sibling feedback can change without this message changing, so re-check every render.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useLayoutEffect(() => {
		const next = Boolean(text) && shownByPreviousField(ref.current, String(text));
		if (next !== duplicate) setDuplicate(next);
	});

	if (!text) return null;
	return (
		<div ref={ref} className={duplicate ? 'd-none' : 'invalid-feedback d-block'}>
			{String(text)}
		</div>
	);
};

export default FieldError;
