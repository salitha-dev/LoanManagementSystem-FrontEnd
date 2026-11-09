import React from 'react';
import { RouteProps } from 'react-router-dom';
import { authPagesMenu } from '../menu';
import DefaultAside from '../pages/_layout/_asides/DefaultAside';

const asides: RouteProps[] = [
	{ path: authPagesMenu.login.path, element: null },
	{ path: '*', element: <DefaultAside /> },
];

export default asides;
