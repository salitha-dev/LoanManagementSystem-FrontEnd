import React, { FC, ReactNode, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../contexts/authContext';
import { authPagesMenu, canAccessPath, homePathForUser } from '../../menu';

type RequireRoleProps = {
	path?: string;
	children: ReactNode;
};

const RequireRole: FC<RequireRoleProps> = ({ path, children }) => {
	const { user } = useContext(AuthContext);

	if (!user) {
		return <Navigate to={`/${authPagesMenu.login.path}`} replace />;
	}

	if (path && !canAccessPath(path, user)) {
		return <Navigate to={`/${homePathForUser(user)}`} replace />;
	}

	return <>{children}</>;
};

export default RequireRole;
