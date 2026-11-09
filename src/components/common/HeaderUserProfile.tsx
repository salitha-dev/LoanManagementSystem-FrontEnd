import React, { FC, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import AuthContext from '../../contexts/authContext';
import Dropdown, { DropdownMenu, DropdownToggle } from '../bootstrap/Dropdown';
import { criticalConfirmOptions } from '../../helpers/confirmOptions';
import useConfirm from '../../hooks/useConfirm';
import { authPagesMenu } from '../../menu';

const HeaderUserProfile: FC = () => {
	const { user, userData, logout } = useContext(AuthContext);
	const confirm = useConfirm();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [avatarFailed, setAvatarFailed] = useState(false);

	const fullName =
		`${userData?.name || ''} ${userData?.surname || ''}`.trim() || user?.name || 'User';
	const role = user?.role || userData?.position || '';
	const email = user?.email || userData?.email || '';
	const avatarSrc = userData?.src || '';
	const initials = fullName
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() || '')
		.join('');
	const showPhoto = Boolean(avatarSrc) && !avatarFailed;

	useEffect(() => {
		setAvatarFailed(false);
	}, [avatarSrc]);

	const onLogout = async () => {
		const ok = await confirm(
			criticalConfirmOptions('Sign out', 'Are you sure you want to sign out?', {
				confirmLabel: 'Yes, sign out',
				confirmColor: 'warning',
				icon: 'Logout',
			}),
		);
		if (!ok) return;
		setIsOpen(false);
		logout();
		navigate(`/${authPagesMenu.login.path}`);
	};

	return (
		<Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
			<DropdownToggle hasIcon={false}>
				<button
					type='button'
					className={classNames('gps-user-trigger', { 'is-open': isOpen })}
					aria-label={`Account menu for ${fullName}`}
					title={fullName}>
					<span className='gps-user-trigger__tooltip' role='tooltip'>
						{fullName}
					</span>
					<span className='gps-user-avatar'>
						{showPhoto ? (
							<img
								src={avatarSrc}
								alt={fullName}
								onError={() => setAvatarFailed(true)}
							/>
						) : (
							<span className='gps-user-avatar__fallback'>{initials || 'U'}</span>
						)}
					</span>
				</button>
			</DropdownToggle>
			<DropdownMenu isAlignmentEnd isCloseAfterLeave={false} className='gps-user-dropdown'>
				<li className='gps-user-menu'>
					<div className='gps-user-menu__header'>
						<span className='gps-user-avatar gps-user-avatar--lg'>
							{showPhoto ? (
								<img
									src={avatarSrc}
									alt={fullName}
									onError={() => setAvatarFailed(true)}
								/>
							) : (
								<span className='gps-user-avatar__fallback'>{initials || 'U'}</span>
							)}
						</span>
						<div className='gps-user-menu__identity'>
							<div className='gps-user-menu__name'>{fullName}</div>
							<div className='gps-user-menu__role'>{role}</div>
							<div className='gps-user-menu__email'>{email}</div>
						</div>
					</div>
					<div className='gps-user-menu__footer'>
						<button
							type='button'
							className='gps-user-menu__logout'
							onClick={() => void onLogout()}>
							Sign out
						</button>
					</div>
				</li>
			</DropdownMenu>
		</Dropdown>
	);
};

export default HeaderUserProfile;
