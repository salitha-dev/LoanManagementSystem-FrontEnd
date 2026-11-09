import React, { forwardRef, ReactElement, useContext, useEffect, useLayoutEffect } from 'react';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { ISubHeaderProps } from '../SubHeader/SubHeader';
import { IPageProps } from '../Page/Page';
import AuthContext from '../../contexts/authContext';
import { authPagesMenu } from '../../menu';
import { APP_NAME } from '../../config/app';

interface IPageWrapperProps {
	isProtected?: boolean;
	title?: string;
	description?: string;
	children:
		ReactElement<ISubHeaderProps>[] | ReactElement<IPageProps> | ReactElement<IPageProps>[];
	className?: string;
}
const PageWrapper = forwardRef<HTMLDivElement, IPageWrapperProps>(
	({ isProtected = true, title, description, className, children }, ref) => {
		useLayoutEffect(() => {
			// @ts-ignore
			document.getElementsByTagName('TITLE')[0].text =
				`${title ? `${title} | ` : ''}${APP_NAME}`;
			// @ts-ignore
			document
				?.querySelector('meta[name="description"]')
				.setAttribute('content', description || import.meta.env.VITE_META_DESC || '');
		});

		const { isAuthenticated } = useContext(AuthContext);

		const navigate = useNavigate();
		useEffect(() => {
			if (isProtected && !isAuthenticated) {
				navigate(`/${authPagesMenu.login.path}`, { replace: true });
			}
		}, [isProtected, isAuthenticated, navigate]);

		return (
			<div ref={ref} className={classNames('page-wrapper', 'container-fluid', className)}>
				{children}
			</div>
		);
	},
);
PageWrapper.displayName = 'PageWrapper';

export default PageWrapper;
