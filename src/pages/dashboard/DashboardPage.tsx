import React, { useContext } from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft } from '../../layout/SubHeader/SubHeader';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../components/bootstrap/Card';
import AuthContext from '../../contexts/authContext';
import { APP_NAME } from '../../config/app';
import { appMenu } from '../../menu';

/** Stage 01 landing page. Replaced by the real dashboard in a later stage. */
const DashboardPage = () => {
	const { user } = useContext(AuthContext);

	return (
		<PageWrapper title={appMenu.dashboard.text}>
			<SubHeader>
				<SubHeaderLeft>
					<span className='h4 mb-0 fw-bold'>{appMenu.dashboard.text}</span>
				</SubHeaderLeft>
			</SubHeader>
			<Page container='fluid'>
				<Card>
					<CardHeader>
						<CardLabel icon='Dashboard' iconColor='primary'>
							<CardTitle tag='h4'>
								Welcome{user?.full_name ? `, ${user.full_name}` : ''}
							</CardTitle>
						</CardLabel>
					</CardHeader>
					<CardBody>
						<p className='mb-0 text-muted'>
							{APP_NAME} is set up. Loan modules will appear in the side menu as they
							are delivered.
						</p>
					</CardBody>
				</Card>
			</Page>
		</PageWrapper>
	);
};

export default DashboardPage;
