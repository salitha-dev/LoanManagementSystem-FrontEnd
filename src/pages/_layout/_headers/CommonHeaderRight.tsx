import React, { FC, ReactNode, useContext } from 'react';
import Button, { IButtonProps } from '../../../components/bootstrap/Button';
import { HeaderRight } from '../../../layout/Header/Header';
import ThemeContext from '../../../contexts/themeContext';
import useDarkMode from '../../../hooks/useDarkMode';
import HeaderUserProfile from '../../../components/common/HeaderUserProfile';

interface ICommonHeaderRightProps {
	beforeChildren?: ReactNode;
	afterChildren?: ReactNode;
}

const CommonHeaderRight: FC<ICommonHeaderRightProps> = ({ beforeChildren, afterChildren }) => {
	const { darkModeStatus, setDarkModeStatus } = useDarkMode();
	const { fullScreenStatus, setFullScreenStatus } = useContext(ThemeContext);

	const styledBtn: IButtonProps = {
		color: darkModeStatus ? 'dark' : 'light',
		hoverShadow: 'default',
		isLight: !darkModeStatus,
		size: 'lg',
	};

	return (
		<HeaderRight>
			<div className='row g-3 align-items-center'>
				{beforeChildren}
				<div className='col-auto'>
					<Button
						color={styledBtn.color}
						hoverShadow={styledBtn.hoverShadow}
						isLight={styledBtn.isLight}
						size={styledBtn.size}
						icon={darkModeStatus ? 'DarkMode' : 'LightMode'}
						onClick={() => setDarkModeStatus(!darkModeStatus)}
						aria-label='Toggle dark mode'
					/>
				</div>
				<div className='col-auto'>
					<Button
						color={styledBtn.color}
						hoverShadow={styledBtn.hoverShadow}
						isLight={styledBtn.isLight}
						size={styledBtn.size}
						icon={fullScreenStatus ? 'FullscreenExit' : 'Fullscreen'}
						onClick={() => setFullScreenStatus(!fullScreenStatus)}
						aria-label='Toggle fullscreen'
					/>
				</div>
				<div className='col-auto'>
					<HeaderUserProfile />
				</div>
				{afterChildren}
			</div>
		</HeaderRight>
	);
};

export default CommonHeaderRight;
