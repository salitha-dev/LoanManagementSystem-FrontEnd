import React, { FC, ReactNode } from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../layout/SubHeader/SubHeader';
import Page from '../../layout/Page/Page';
import Card, { CardBody } from '../bootstrap/Card';
import Button from '../bootstrap/Button';

interface ICrudPageProps {
	title: string;
	/** Shown when the user may create records. */
	onCreate?: () => void;
	createLabel?: string;
	/** Filters rendered above the table. */
	filters?: ReactNode;
	children: ReactNode;
}

/** Page frame for list screens: title, "Add" button, optional filters, table card. */
const CrudPage: FC<ICrudPageProps> = ({ title, onCreate, createLabel, filters, children }) => (
	<PageWrapper title={title}>
		<SubHeader>
			<SubHeaderLeft>
				<span className='h4 mb-0 fw-bold'>{title}</span>
			</SubHeaderLeft>
			<SubHeaderRight>
				{onCreate ? (
					<Button action='add' onClick={onCreate}>
						{createLabel ?? 'Add'}
					</Button>
				) : (
					<span />
				)}
			</SubHeaderRight>
		</SubHeader>
		<Page container='fluid'>
			<Card stretch={false}>
				<CardBody>
					{filters && <div className='row g-3 mb-3'>{filters}</div>}
					{children}
				</CardBody>
			</Card>
		</Page>
	</PageWrapper>
);

export default CrudPage;
