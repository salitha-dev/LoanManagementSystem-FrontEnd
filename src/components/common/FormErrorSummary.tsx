import React, { FC, useLayoutEffect, useRef, useState } from 'react';
import Alert from '../bootstrap/Alert';

const FEEDBACK = '.invalid-feedback, .invalid-tooltip';

const shownInline = (scope: Element | null, summary: Element | null): Set<string> => {
	const texts = new Set<string>();
	scope?.querySelectorAll(FEEDBACK).forEach((element) => {
		if (summary?.contains(element)) return;
		if (element.classList.contains('d-none') || getComputedStyle(element).display === 'none')
			return;
		const text = element.textContent?.trim();
		if (text) texts.add(text);
	});
	return texts;
};

/**
 * Form-level messages that no field shows inline: general errors plus any validation key
 * without a matching control. Messages already rendered under a field are left out.
 */
const FormErrorSummary: FC<{
	errors?: Record<string, string | undefined>;
	messages?: string[];
	title?: string;
	className?: string;
}> = ({ errors = {}, messages = [], title, className = 'mb-3' }) => {
	const ref = useRef<HTMLDivElement>(null);
	const [inline, setInline] = useState<string[]>([]);
	const all = [
		...new Set(
			[...messages, ...Object.values(errors)].map((text) => text?.trim()).filter(Boolean),
		),
	] as string[];

	// Inline feedback elsewhere in the form can change without these props changing.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useLayoutEffect(() => {
		const scope =
			ref.current?.closest('form, .modal-content') ?? ref.current?.parentElement ?? null;
		const shown = shownInline(scope, ref.current);
		const next = all.filter((text) => shown.has(text));
		if (next.join('\n') !== inline.join('\n')) setInline(next);
	});

	const pending = all.filter((text) => !inline.includes(text));

	return (
		<div ref={ref} className={pending.length ? className : undefined}>
			{pending.length > 0 && (
				<Alert color='danger' isLight icon='ErrorOutline' className='mb-0'>
					<div>
						{title && <div className='fw-semibold mb-1'>{title}</div>}
						{pending.length === 1 ? (
							<div>{pending[0]}</div>
						) : (
							<ul className='mb-0 ps-3'>
								{pending.map((text) => (
									<li key={text}>{text}</li>
								))}
							</ul>
						)}
					</div>
				</Alert>
			)}
		</div>
	);
};

export default FormErrorSummary;
