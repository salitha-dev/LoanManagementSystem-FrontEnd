import { useEffect, useState } from 'react';

const DEFAULT_DELAY = 350;

/** Debounced search value for live table search. */
export function useDebouncedSearch(
	initialValue = '',
	delay = DEFAULT_DELAY,
): [string, (value: string) => void, string] {
	const [value, setValue] = useState(initialValue);
	const [debouncedValue, setDebouncedValue] = useState(initialValue);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return [value, setValue, debouncedValue];
}

export default useDebouncedSearch;
