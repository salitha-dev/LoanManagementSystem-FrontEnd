import React, { Suspense, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Card, { CardBody } from '../../components/bootstrap/Card';
import PageWrapper from '../PageWrapper/PageWrapper';
import Page from '../Page/Page';
import SubHeader from '../SubHeader/SubHeader';
import ContentRoutes from './ContentRoutes';
import { clearModalDocumentLock } from '../../helpers/clearModalLock';

const LOADING = (
	<PageWrapper>
		<SubHeader>
			<div />
		</SubHeader>
		<Page>
			<div className='row h-100'>
				<div className='col-lg-6'>
					<Card stretch>
						<CardBody>
							<div />
						</CardBody>
					</Card>
				</div>
				<div className='col-lg-6'>
					<Card stretch='semi'>
						<CardBody>
							<div />
						</CardBody>
					</Card>
					<Card stretch='semi'>
						<CardBody>
							<div />
						</CardBody>
					</Card>
				</div>
			</div>
		</Page>
	</PageWrapper>
);

const Content = () => {
	const location = useLocation();

	useLayoutEffect(() => {
		clearModalDocumentLock();
	}, [location.pathname, location.key]);

	return (
		<main className='content'>
			<Suspense fallback={LOADING}>
				<ContentRoutes />
			</Suspense>
		</main>
	);
};

export default Content;
