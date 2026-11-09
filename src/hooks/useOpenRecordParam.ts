import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Opens a record named in `?open=<id>` (used by notification links), then drops the parameter so
 * a refresh or a later notification for the same record opens it again cleanly.
 */
export default function useOpenRecordParam(open: (id: number) => void): void {
	const [params, setParams] = useSearchParams();
	const id = Number(params.get('open')) || 0;
	const handled = useRef(0);

	useEffect(() => {
		if (id <= 0) {
			handled.current = 0;
			return;
		}
		if (handled.current === id) return;
		handled.current = id;
		open(id);
		setParams(
			(current) => {
				const next = new URLSearchParams(current);
				next.delete('open');
				return next;
			},
			{ replace: true },
		);
	}, [id, open, setParams]);
}
