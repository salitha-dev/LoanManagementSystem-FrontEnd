import React, { FC, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../contexts/authContext';
import { authPagesMenu, homePathForUser } from '../../menu';

const HomeRedirect: FC = () => {
	const { user } = useContext(AuthContext);
	if (!user) {
		return <Navigate to={`/${authPagesMenu.login.path}`} replace />;
	}

	return <Navigate to={`/${homePathForUser(user)}`} replace />;
};

export default HomeRedirect;
