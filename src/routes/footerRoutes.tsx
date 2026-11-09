import React from 'react';
import { RouteProps } from 'react-router-dom';
import { authPagesMenu } from '../menu';
import DefaultFooter from '../pages/_layout/_footers/DefaultFooter';

const footers: RouteProps[] = [
	{ path: authPagesMenu.login.path, element: null },
	{ path: authPagesMenu.page404.path, element: null },
	{ path: '*', element: <DefaultFooter /> },
];

export default footers;
