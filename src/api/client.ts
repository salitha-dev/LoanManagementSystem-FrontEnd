import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiResponse } from './types';
import { API_BASE_URL, STORAGE_KEYS } from '../config/app';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export const getStoredToken = (): string | null => localStorage.getItem(STORAGE_KEYS.token);
export const getStoredUser = (): string | null => localStorage.getItem(STORAGE_KEYS.user);

export const setStoredAuth = (token: string, user: unknown): void => {
	localStorage.setItem(STORAGE_KEYS.token, token);
	localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
};

export const clearStoredAuth = (): void => {
	localStorage.removeItem(STORAGE_KEYS.token);
	localStorage.removeItem(STORAGE_KEYS.user);
};

/** The single axios instance. Services call `apiRequest` / `apiPayload`, never axios directly. */
export const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		Accept: 'application/json',
		'X-Client-Type': 'web',
	},
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const token = getStoredToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
		config.headers.delete('Content-Type');
	}
	return config;
});

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void): void => {
	onUnauthorized = handler;
};

apiClient.interceptors.response.use(
	(response) => response,
	(error: AxiosError<ApiResponse<unknown>>) => {
		if (error.response?.status === 401 && getStoredToken()) {
			clearStoredAuth();
			onUnauthorized?.();
		}
		return Promise.reject(error);
	},
);

async function send<T>(
	method: HttpMethod,
	url: string,
	data?: unknown,
	params?: Record<string, unknown>,
): Promise<T> {
	try {
		const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
		const response = await apiClient.request<T>({
			method,
			url,
			data,
			params,
			headers: isFormData ? {} : { 'Content-Type': 'application/json' },
		});
		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (!error.response) {
				throw new ApiError('Cannot reach the API. Check that the backend is running.', 0);
			}
			const status = error.response.status;
			const body = error.response.data;
			const payload =
				typeof body === 'object' && body ? (body as ApiResponse<unknown>) : null;
			const errors =
				payload?.errors && typeof payload.errors === 'object' ? payload.errors : undefined;

			throw new ApiError(
				(typeof payload?.message === 'string' && payload.message) ||
					error.message ||
					'Request failed',
				status,
				errors,
			);
		}
		throw error;
	}
}

/** Full JSON body. Use for paginated lists (`data` + `meta`). */
export async function apiPayload<T>(
	method: HttpMethod,
	url: string,
	data?: unknown,
	params?: Record<string, unknown>,
): Promise<T> {
	return send<T>(method, url, data, params);
}

/** Unwraps `{ data: T }` from API Resources. */
export async function apiRequest<T>(
	method: HttpMethod,
	url: string,
	data?: unknown,
	params?: Record<string, unknown>,
): Promise<T> {
	const body = await send<ApiResponse<T> | T>(method, url, data, params);
	if (
		body &&
		typeof body === 'object' &&
		'data' in body &&
		(body as ApiResponse<T>).data !== undefined
	) {
		return (body as ApiResponse<T>).data as T;
	}
	return body as T;
}
