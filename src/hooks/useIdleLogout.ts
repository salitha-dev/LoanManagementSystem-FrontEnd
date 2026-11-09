import { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/authContext';
import { authPagesMenu } from '../menu';
import { showAppInfo } from '../helpers/appNotify';
import { IDLE_TIMEOUT_MINUTES, STORAGE_KEYS } from '../config/app';

const ACTIVITY_KEY = STORAGE_KEYS.lastActivity;
const CHECK_INTERVAL_MS = 15_000;
const ACTIVITY_WRITE_THROTTLE_MS = 5_000;

const idleMinutes = (): number => IDLE_TIMEOUT_MINUTES;

const ACTIVITY_EVENTS: (keyof WindowEventMap | 'visibilitychange')[] = [
	'mousemove',
	'mousedown',
	'keydown',
	'wheel',
	'scroll',
	'touchstart',
	'visibilitychange',
];

/**
 * Signs the user out after a period with no interaction. Activity is shared
 * through localStorage so several open tabs count as one session.
 */
const useIdleLogout = (): void => {
	const { isAuthenticated, logout } = useContext(AuthContext);
	const navigate = useNavigate();
	const lastWriteRef = useRef(0);

	useEffect(() => {
		if (!isAuthenticated) return undefined;

		const timeoutMs = idleMinutes() * 60_000;

		const markActive = () => {
			const now = Date.now();
			if (now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;
			lastWriteRef.current = now;
			localStorage.setItem(ACTIVITY_KEY, String(now));
		};

		const readLastActivity = (): number => {
			const stored = Number(localStorage.getItem(ACTIVITY_KEY));
			return Number.isFinite(stored) && stored > 0 ? stored : Date.now();
		};

		if (!localStorage.getItem(ACTIVITY_KEY)) {
			localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
		}

		ACTIVITY_EVENTS.forEach((event) =>
			window.addEventListener(event, markActive, { passive: true }),
		);

		const timer = window.setInterval(() => {
			if (Date.now() - readLastActivity() < timeoutMs) return;

			localStorage.removeItem(ACTIVITY_KEY);
			logout();
			showAppInfo(
				'Signed out',
				`You were inactive for ${idleMinutes()} minutes, so we ended the session.`,
			);
			navigate(`/${authPagesMenu.login.path}`, { replace: true });
		}, CHECK_INTERVAL_MS);

		return () => {
			ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
			window.clearInterval(timer);
		};
	}, [isAuthenticated, logout, navigate]);
};

export default useIdleLogout;
