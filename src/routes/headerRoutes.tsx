import React from 'react';
import { RouteProps } from 'react-router-dom';
import { authPagesMenu } from '../menu';
import DefaultHeader from '../pages/_layout/_headers/DefaultHeader';

const headers: RouteProps[] = [
	{ path: authPagesMenu.login.path, element: null },
	{ path: authPagesMenu.page404.path, element: null },
	{ path: '*', element: <DefaultHeader /> },
];

export default headers;
