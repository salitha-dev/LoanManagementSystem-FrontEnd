import { AuthUser } from './api/types';
import { hasAnyPermission } from './helpers/permissions';

/**
 * Single source of truth for navigation and route permissions.
 * Add a module: add its menu entry here (with `permissions`), then its lazy route in
 * `routes/contentRoutes.tsx` wrapped in <RequireRole path=...>.
 */
export type AppMenuItem = {
	id: string;
	text: string;
	path: string;
	icon: string;
	/** Visible when the user holds at least one. Empty/undefined = any signed-in user. */
	permissions?: string[];
	/** Left out of the side bar; the page and its permission check stay. */
	hide?: boolean;
	subMenu?: Record<string, AppMenuItem>;
};

type MenuUser = AuthUser | null | undefined;

export const authPagesMenu = {
	login: { id: 'login', text: 'Login', path: 'auth-pages/login', icon: 'Login' },
	page404: {
		id: 'Page404',
		text: '404 Page',
		path: 'auth-pages/404',
		icon: 'ReportGmailerrorred',
	},
};

export const appMenu: Record<string, AppMenuItem> = {
	dashboard: { id: 'dashboard', text: 'Dashboard', path: 'dashboard', icon: 'Dashboard' },
	// Stage 02+: loan modules are added here.
};

const userHasMenuAccess = (item: AppMenuItem, user: MenuUser): boolean =>
	!item.permissions?.length || hasAnyPermission(user, item.permissions);

const filterMenuTree = (
	items: Record<string, AppMenuItem>,
	user: MenuUser,
): Record<string, AppMenuItem> => {
	const result: Record<string, AppMenuItem> = {};
	Object.entries(items).forEach(([key, item]) => {
		if (item.hide) return;
		if (item.subMenu) {
			const sub = filterMenuTree(item.subMenu, user);
			if (Object.keys(sub).length) {
				result[key] = { ...item, subMenu: sub, path: Object.values(sub)[0].path };
			}
			return;
		}
		if (userHasMenuAccess(item, user)) result[key] = item;
	});
	return result;
};

const flatten = (items: Record<string, AppMenuItem>): AppMenuItem[] =>
	Object.values(items).flatMap((item) => [item, ...(item.subMenu ? flatten(item.subMenu) : [])]);

export const filterMenuByRole = (user?: MenuUser): Record<string, AppMenuItem> =>
	filterMenuTree(appMenu, user);

export const findMenuItem = (path: string): AppMenuItem | undefined => {
	const clean = path.replace(/^\//, '');
	return flatten(appMenu).find((item) => !item.subMenu && item.path === clean);
};

/** Route guard check. Paths not in the menu are allowed for any signed-in user. */
export const canAccessPath = (path: string, user?: MenuUser): boolean => {
	if (!user) return false;
	const item = findMenuItem(path);
	return item ? userHasMenuAccess(item, user) : true;
};

export const homePathForUser = (user?: MenuUser): string => {
	if (canAccessPath(appMenu.dashboard.path, user)) return appMenu.dashboard.path;
	return (
		flatten(filterMenuByRole(user)).find((item) => !item.subMenu)?.path ??
		appMenu.dashboard.path
	);
};
