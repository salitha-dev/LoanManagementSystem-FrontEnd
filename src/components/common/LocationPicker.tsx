import React, { FC, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import Button from '../bootstrap/Button';
import Spinner from '../bootstrap/Spinner';
import Input from '../bootstrap/forms/Input';
import TextField from './TextField';
import { DEFAULT_MAP_CENTER, MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from '../../config/app';
import { mapUrl, PlaceResult, searchPlaces } from '../../helpers/geocoding';

type Feedback = { isTouched: boolean; isValid: boolean; invalidFeedback?: string };

interface ILocationPickerProps {
	idPrefix: string;
	latitude: number | null;
	longitude: number | null;
	onChange?: (latitude: number | null, longitude: number | null) => void;
	readOnly?: boolean;
	latitudeFeedback?: Feedback;
	longitudeFeedback?: Feedback;
	height?: number;
}

// Vite bundles the images, so give Leaflet explicit icon URLs.
const pinIcon = L.icon({
	iconUrl: markerIcon,
	iconRetinaUrl: markerIcon2x,
	shadowUrl: markerShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

/** WGS84 to 7 decimal places (~1 cm), matching the DECIMAL(10,7) columns. */
const round7 = (value: number) => Math.round(value * 1e7) / 1e7;
const formatCoord = (value: number | null) => (value === null ? '' : String(value));
const key = (lat: number, lng: number) => `${lat},${lng}`;

/**
 * Free map pin picker (OpenStreetMap + Leaflet, Nominatim search; no API key).
 * Search a place, click the map or drag the pin to set latitude/longitude, or type
 * the coordinates. Reusable for any record with a location.
 */
const LocationPicker: FC<ILocationPickerProps> = ({
	idPrefix,
	latitude,
	longitude,
	onChange,
	readOnly = false,
	latitudeFeedback,
	longitudeFeedback,
	height = 320,
}) => {
	const mapDivRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<L.Map | null>(null);
	const markerRef = useRef<L.Marker | null>(null);
	const lastEmittedRef = useRef<string | null>(null);
	const onChangeRef = useRef(onChange);
	const initialRef = useRef({ latitude, longitude });
	const [ready, setReady] = useState(false);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	const hasPin = latitude !== null && longitude !== null;

	// Create the map once per mount.
	useEffect(() => {
		const container = mapDivRef.current;
		if (!container) return undefined;

		const emit = (lat: number, lng: number) => {
			const next = { lat: round7(lat), lng: round7(lng) };
			lastEmittedRef.current = key(next.lat, next.lng);
			onChangeRef.current?.(next.lat, next.lng);
		};

		const { latitude: lat0, longitude: lng0 } = initialRef.current;
		const start: L.LatLngExpression | null =
			lat0 !== null && lng0 !== null ? [lat0, lng0] : null;
		const map = L.map(container, { scrollWheelZoom: false }).setView(
			start ?? [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
			start ? 16 : 7,
		);
		L.tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

		const marker = L.marker(start ?? [0, 0], {
			icon: pinIcon,
			draggable: !readOnly,
			title: readOnly ? 'Location' : 'Drag to adjust the location',
			keyboard: !readOnly,
		});
		if (start) marker.addTo(map);

		if (!readOnly) {
			marker.on('dragend', () => {
				const position = marker.getLatLng();
				emit(position.lat, position.lng);
			});
			map.on('click', (event: L.LeafletMouseEvent) =>
				emit(event.latlng.lat, event.latlng.lng),
			);
		}

		// Modals animate in: recompute the size whenever the container resizes.
		const observer = new ResizeObserver(() => map.invalidateSize());
		observer.observe(container);

		mapRef.current = map;
		markerRef.current = marker;
		setReady(true);

		return () => {
			observer.disconnect();
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
			setReady(false);
		};
	}, [readOnly]);

	// Keep the pin in sync with the form value (search, manual entry, edit load, clear).
	useEffect(() => {
		const map = mapRef.current;
		const marker = markerRef.current;
		if (!ready || !map || !marker) return;
		if (latitude === null || longitude === null) {
			marker.remove();
			return;
		}
		marker.setLatLng([latitude, longitude]);
		if (!map.hasLayer(marker)) marker.addTo(map);
		// Recentre only for changes that did not come from clicking/dragging on the map.
		if (lastEmittedRef.current !== key(latitude, longitude)) {
			map.setView([latitude, longitude], Math.max(map.getZoom(), 16));
		}
		lastEmittedRef.current = null;
	}, [latitude, longitude, ready]);

	// Place search (explicit action only, per the Nominatim usage policy).
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<PlaceResult[] | null>(null);
	const [searching, setSearching] = useState(false);
	const [searchError, setSearchError] = useState('');

	const runSearch = async () => {
		const text = query.trim();
		if (text.length < 3 || searching) return;
		setSearching(true);
		setSearchError('');
		try {
			setResults(await searchPlaces(text));
		} catch (error) {
			setResults(null);
			setSearchError((error as Error).message);
		} finally {
			setSearching(false);
		}
	};

	const choose = (place: PlaceResult) => {
		setResults(null);
		setQuery(place.label);
		if (place.bounds && mapRef.current) mapRef.current.fitBounds(place.bounds, { maxZoom: 17 });
		const lat = round7(place.latitude);
		const lng = round7(place.longitude);
		lastEmittedRef.current = key(lat, lng); // fitBounds already framed it
		onChangeRef.current?.(lat, lng);
	};

	// Manual entry keeps the typed text (e.g. "-", "6.") and emits only valid numbers.
	const [draft, setDraft] = useState({ lat: formatCoord(latitude), lng: formatCoord(longitude) });
	const [synced, setSynced] = useState({ latitude, longitude });
	if (synced.latitude !== latitude || synced.longitude !== longitude) {
		setSynced({ latitude, longitude });
		setDraft({ lat: formatCoord(latitude), lng: formatCoord(longitude) });
	}

	const typeCoordinate = (field: 'lat' | 'lng', text: string) => {
		const next = { ...draft, [field]: text };
		setDraft(next);
		const parse = (value: string) =>
			value.trim() === '' ? null : Number.isNaN(Number(value)) ? undefined : Number(value);
		const lat = parse(next.lat);
		const lng = parse(next.lng);
		if (lat === undefined || lng === undefined) return; // wait until both parse
		setSynced({ latitude: lat, longitude: lng });
		onChange?.(lat, lng);
	};

	return (
		<div className='row g-3'>
			{!readOnly && (
				<div className='col-12'>
					{/* Not a <form>: this sits inside the record's form. Enter runs the search. */}
					<div className='d-flex gap-2'>
						<div className='flex-grow-1'>
							<Input
								id={`${idPrefix}-search`}
								ariaLabel='Search for a place or address'
								placeholder='Search for a place or address, then press Enter'
								value={query}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setQuery(e.target.value)
								}
								onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
									if (e.key !== 'Enter') return;
									e.preventDefault(); // don't submit the surrounding record form
									void runSearch();
								}}
							/>
						</div>
						<Button
							color='primary'
							isLight
							icon='Search'
							isDisable={searching || query.trim().length < 3}
							onClick={() => void runSearch()}>
							{searching ? <Spinner isSmall inButton /> : 'Search'}
						</Button>
					</div>
					{searchError && <div className='text-danger small mt-1'>{searchError}</div>}
					{results && (
						<div className='list-group mt-2' role='listbox' aria-label='Search results'>
							{results.length === 0 ? (
								<div className='list-group-item small text-muted'>
									No places found.
								</div>
							) : (
								results.map((place) => (
									<button
										key={`${place.latitude},${place.longitude},${place.label}`}
										type='button'
										role='option'
										aria-selected={false}
										className='list-group-item list-group-item-action small'
										onClick={() => choose(place)}>
										{place.label}
									</button>
								))
							)}
						</div>
					)}
				</div>
			)}
			<div className='col-12'>
				<div
					ref={mapDivRef}
					className='rounded border'
					style={{ height, width: '100%', zIndex: 0 }}
					role='application'
					aria-label='Map location picker'
				/>
				{!readOnly && (
					<div className='form-text'>
						Search for a place, click the map to drop the pin, or drag the pin to adjust
						it.
					</div>
				)}
			</div>
			{readOnly ? (
				<div className='col-12 small'>
					{hasPin ? (
						<>
							<span className='me-3'>
								Latitude <strong>{latitude}</strong>
							</span>
							<span className='me-3'>
								Longitude <strong>{longitude}</strong>
							</span>
							<a
								href={mapUrl(latitude as number, longitude as number)}
								target='_blank'
								rel='noreferrer'>
								Open map
							</a>
						</>
					) : (
						<span className='text-muted'>No location set.</span>
					)}
				</div>
			) : (
				<>
					<TextField
						id={`${idPrefix}-latitude`}
						label='Latitude'
						type='number'
						className='col-md-5'
						value={draft.lat}
						onChange={(value) => typeCoordinate('lat', value)}
						feedback={latitudeFeedback}
					/>
					<TextField
						id={`${idPrefix}-longitude`}
						label='Longitude'
						type='number'
						className='col-md-5'
						value={draft.lng}
						onChange={(value) => typeCoordinate('lng', value)}
						feedback={longitudeFeedback}
					/>
					<div className='col-md-2 d-flex align-items-end'>
						<Button
							color='light'
							className='w-100'
							icon='LocationOff'
							isDisable={!hasPin && draft.lat === '' && draft.lng === ''}
							onClick={() => {
								setDraft({ lat: '', lng: '' });
								setSynced({ latitude: null, longitude: null });
								onChange?.(null, null);
							}}>
							Clear
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default LocationPicker;
