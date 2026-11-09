import { useEffect, useState } from 'react';
import { fetchOptions, OptionType } from '../api/resource';
import { Reference } from '../api/types';

/**
 * Loads dropdown options. Pass `params = null` to skip (e.g. no parent selected yet).
 */
export default function useOptions(type: OptionType, params: Record<string, number> | null = {}) {
	const key = params === null ? null : JSON.stringify(params);
	const [state, setState] = useState<{ key: string | null; options: Reference[] }>({
		key: null,
		options: [],
	});

	useEffect(() => {
		if (key === null) return undefined;
		let active = true;
		fetchOptions(type, JSON.parse(key) as Record<string, number>)
			.then((options) => {
				if (active) setState({ key, options });
			})
			.catch(() => {
				if (active) setState({ key, options: [] });
			});
		return () => {
			active = false;
		};
	}, [type, key]);

	const loaded = key !== null && state.key === key;
	return {
		options: loaded ? state.options : [],
		loading: key !== null && !loaded,
	};
}
