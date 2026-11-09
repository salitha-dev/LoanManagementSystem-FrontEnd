import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import contents from '../../routes/contentRoutes';

const PAGE_404 = lazy(() => import('../../pages/auth/Page404'));

const ContentRoutes = () => {
	return (
		<Suspense fallback={<div className='p-4'>Loading…</div>}>
			<Routes>
				{contents.map((page) => (
					<Route key={page.path} path={page.path} element={page.element} />
				))}
				<Route path='*' element={<PAGE_404 />} />
			</Routes>
		</Suspense>
	);
};

export default ContentRoutes;
