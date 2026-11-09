import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { appMenu, authPagesMenu } from '../menu';
import RequireRole from '../components/common/RequireRole';
import HomeRedirect from '../components/common/HomeRedirect';

const Login = lazy(() => import('../pages/auth/Login'));
const Page404 = lazy(() => import('../pages/auth/Page404'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));

const guarded = (path: string, element: React.ReactNode): RouteObject => ({
	path,
	element: <RequireRole path={path}>{element}</RequireRole>,
});

const contents: RouteObject[] = [
	{ path: '/', element: <HomeRedirect /> },
	{ path: authPagesMenu.login.path, element: <Login /> },
	{ path: authPagesMenu.page404.path, element: <Page404 /> },
	guarded(appMenu.dashboard.path, <DashboardPage />),
];

export default contents;
