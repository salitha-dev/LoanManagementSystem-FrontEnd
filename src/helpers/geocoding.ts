import { GEOCODER_URL, MAP_SEARCH_COUNTRIES } from '../config/app';

export interface PlaceResult {
	label: string;
	latitude: number;
	longitude: number;
	/** [[south, west], [north, east]] when the place has an area. */
	bounds: [[number, number], [number, number]] | null;
}

interface NominatimRow {
	display_name: string;
	lat: string;
	lon: string;
	boundingbox?: [string, string, string, string];
}

/**
 * Free place search via Nominatim (OpenStreetMap). Usage policy: call on explicit user
 * action (not on every keystroke) and at most ~1 request per second.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
	const params = new URLSearchParams({
		q: query,
		format: 'jsonv2',
		limit: '5',
		'accept-language': 'en',
	});
	if (MAP_SEARCH_COUNTRIES.length) params.set('countrycodes', MAP_SEARCH_COUNTRIES.join(','));

	const response = await fetch(`${GEOCODER_URL}/search?${params.toString()}`, {
		signal,
		headers: { Accept: 'application/json' },
	});
	if (!response.ok) {
		throw new Error(`Place search failed (${response.status}). Try again in a moment.`);
	}
	const rows = (await response.json()) as NominatimRow[];
	return rows.map((row) => ({
		label: row.display_name,
		latitude: Number(row.lat),
		longitude: Number(row.lon),
		bounds: row.boundingbox
			? [
					[Number(row.boundingbox[0]), Number(row.boundingbox[2])],
					[Number(row.boundingbox[1]), Number(row.boundingbox[3])],
				]
			: null,
	}));
}

/** Link that opens the coordinates on openstreetmap.org. */
export const mapUrl = (latitude: number, longitude: number): string =>
	`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
