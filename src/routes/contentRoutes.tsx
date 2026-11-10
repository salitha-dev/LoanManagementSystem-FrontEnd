import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { appMenu, authPagesMenu } from '../menu';
import RequireRole from '../components/common/RequireRole';
import HomeRedirect from '../components/common/HomeRedirect';

const Login = lazy(() => import('../pages/auth/Login'));
const Page404 = lazy(() => import('../pages/auth/Page404'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ProvincesPage = lazy(() => import('../pages/admin/ProvincesPage'));
const DistrictsPage = lazy(() => import('../pages/admin/DistrictsPage'));
const DsdsPage = lazy(() => import('../pages/admin/DsdsPage'));
const GndsPage = lazy(() => import('../pages/admin/GndsPage'));
const BranchesPage = lazy(() => import('../pages/admin/BranchesPage'));
const RolesPage = lazy(() => import('../pages/admin/RolesPage'));
const DesignationsPage = lazy(() => import('../pages/admin/DesignationsPage'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
const ActivityLogsPage = lazy(() => import('../pages/admin/ActivityLogsPage'));

const MainSectorsPage = lazy(() => import('../pages/facility/MainSectorsPage'));
const SubSectorsPage = lazy(() => import('../pages/facility/SubSectorsPage'));
const SectorsPage = lazy(() => import('../pages/facility/SectorsPage'));
const TitlesPage = lazy(() => import('../pages/facility/TitlesPage'));
const RelationshipsPage = lazy(() => import('../pages/facility/RelationshipsPage'));
const EducationPage = lazy(() => import('../pages/facility/EducationPage'));
const BanksPage = lazy(() => import('../pages/finance/BanksPage'));
const BankBranchesPage = lazy(() => import('../pages/finance/BankBranchesPage'));
const BankAccountsPage = lazy(() => import('../pages/finance/BankAccountsPage'));
const ChequeBooksPage = lazy(() => import('../pages/finance/ChequeBooksPage'));
const ChequeReactivePage = lazy(() => import('../pages/finance/ChequeReactivePage'));

const admin = appMenu.admin.subMenu!;
const facility = admin.facility.subMenu!;
const finance = admin.finance.subMenu!;

const guarded = (path: string, element: React.ReactNode): RouteObject => ({
	path,
	element: <RequireRole path={path}>{element}</RequireRole>,
});

const contents: RouteObject[] = [
	{ path: '/', element: <HomeRedirect /> },
	{ path: authPagesMenu.login.path, element: <Login /> },
	{ path: authPagesMenu.page404.path, element: <Page404 /> },
	guarded(appMenu.dashboard.path, <DashboardPage />),
	guarded(admin.provinces.path, <ProvincesPage />),
	guarded(admin.districts.path, <DistrictsPage />),
	guarded(admin.dsds.path, <DsdsPage />),
	guarded(admin.gnds.path, <GndsPage />),
	guarded(admin.branches.path, <BranchesPage />),
	guarded(admin.roles.path, <RolesPage />),
	guarded(admin.designations.path, <DesignationsPage />),
	guarded(admin.users.path, <UsersPage />),
	guarded(admin.activityLogs.path, <ActivityLogsPage />),
	guarded(facility.mainSectors.path, <MainSectorsPage />),
	guarded(facility.subSectors.path, <SubSectorsPage />),
	guarded(facility.sectors.path, <SectorsPage />),
	guarded(facility.titles.path, <TitlesPage />),
	guarded(facility.relationships.path, <RelationshipsPage />),
	guarded(facility.educations.path, <EducationPage />),
	guarded(finance.banks.path, <BanksPage />),
	guarded(finance.bankBranches.path, <BankBranchesPage />),
	guarded(finance.bankAccounts.path, <BankAccountsPage />),
	guarded(finance.chequeBooks.path, <ChequeBooksPage />),
	guarded(finance.chequeReactive.path, <ChequeReactivePage />),
];

export default contents;
