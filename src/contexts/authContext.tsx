import React, {
	createContext,
	FC,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	getCurrentUser,
	login as apiLogin,
	logout as apiLogout,
	parseStoredUser,
} from '../api/auth.service';
import { getStoredToken, setStoredAuth, setUnauthorizedHandler } from '../api/client';
import { AuthUser } from '../api/types';
import { mediaUrl } from '../helpers/media';
import { normalizeAuthUser } from '../helpers/permissions';
import { AUTH_MODE, STORAGE_KEYS } from '../config/app';

export interface IUserDisplay {
	name: string;
	surname: string;
	position: string;
	email: string;
	src: string;
	srcSet: string;
}

export interface IAuthContextProps {
	user: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	userData: Partial<IUserDisplay>;
	login(email: string, password: string): Promise<AuthUser>;
	logout(): void;
	refreshUser(): Promise<AuthUser | null>;
	setUser?(...args: unknown[]): unknown;
}

const toUserDisplay = (user: AuthUser | null): Partial<IUserDisplay> => {
	if (!user) return {};
	const parts = (user.full_name || '').trim().split(/\s+/);
	const first = parts[0] || user.full_name;
	const last = parts.slice(1).join(' ');
	const avatar = mediaUrl(user.avatar_url) || '';
	return {
		name: first,
		surname: last,
		position: user.role || '',
		email: user.email,
		src: avatar,
		srcSet: avatar,
	};
};

const AuthContext = createContext<IAuthContextProps>({} as IAuthContextProps);

interface IAuthContextProviderProps {
	children: ReactNode;
}

export const AuthContextProvider: FC<IAuthContextProviderProps> = ({ children }) => {
	const [user, setUserState] = useState<AuthUser | null>(() => parseStoredUser());
	const [token, setToken] = useState<string | null>(() => getStoredToken());

	const logout = useCallback(() => {
		apiLogout();
		localStorage.removeItem(STORAGE_KEYS.lastActivity);
		setToken(null);
		setUserState(null);
	}, []);

	useEffect(() => {
		setUnauthorizedHandler(logout);
	}, [logout]);

	const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
		const data = await apiLogin(email, password);
		localStorage.setItem(STORAGE_KEYS.lastActivity, String(Date.now()));
		setToken(data.token);
		setUserState(normalizeAuthUser(data));
		return data;
	}, []);

	const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
		const currentToken = getStoredToken();
		if (!currentToken) return null;
		const fresh = await getCurrentUser();
		setStoredAuth(currentToken, fresh);
		setUserState(fresh);
		return fresh;
	}, []);

	const setUser = useCallback(
		(...args: unknown[]) => {
			if (typeof args[0] === 'string' && args[0] === '') {
				logout();
				return;
			}
			if (args[0] && typeof args[0] === 'object') {
				const next = normalizeAuthUser(args[0] as AuthUser);
				const currentToken = getStoredToken();
				if (currentToken) setStoredAuth(currentToken, next);
				setUserState(next);
			}
		},
		[logout],
	);

	useEffect(() => {
		if (!token) return;
		if (AUTH_MODE === 'api') {
			refreshUser().catch(() => logout());
		}
	}, [token, refreshUser, logout]);

	useEffect(() => {
		if (!token || AUTH_MODE !== 'api') return undefined;
		let lastRefresh = Date.now();
		const refreshIfStale = () => {
			if (document.visibilityState !== 'visible' || Date.now() - lastRefresh < 60_000) return;
			lastRefresh = Date.now();
			refreshUser().catch(() => null);
		};
		window.addEventListener('focus', refreshIfStale);
		document.addEventListener('visibilitychange', refreshIfStale);
		return () => {
			window.removeEventListener('focus', refreshIfStale);
			document.removeEventListener('visibilitychange', refreshIfStale);
		};
	}, [token, refreshUser]);

	const value = useMemo(
		() => ({
			user,
			token,
			isAuthenticated: !!token && !!user,
			userData: toUserDisplay(user),
			login,
			logout,
			refreshUser,
			setUser,
		}),
		[user, token, login, logout, refreshUser, setUser],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
