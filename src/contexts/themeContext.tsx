import React, { createContext, useLayoutEffect, useState, useMemo, FC, ReactNode } from 'react';
import useDeviceScreen from '../hooks/useDeviceScreen';

export interface IThemeContextProps {
	asideStatus: boolean;
	darkModeStatus: boolean;
	fullScreenStatus: boolean;
	leftMenuStatus: boolean;
	mobileDesign: boolean;
	rightMenuStatus: boolean;
	rightPanel: boolean;
	setAsideStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setDarkModeStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setFullScreenStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setLeftMenuStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setRightMenuStatus: (value: ((prevState: boolean) => boolean) | boolean) => void;
	setRightPanel: (value: ((prevState: boolean) => boolean) | boolean) => void;
}
const ThemeContext = createContext<IThemeContextProps>({} as IThemeContextProps);

interface IThemeContextProviderProps {
	children: ReactNode;
}
export const ThemeContextProvider: FC<IThemeContextProviderProps> = ({ children }) => {
	const deviceScreen = useDeviceScreen();
	const mobileBreakpoint = Number(import.meta.env.VITE_MOBILE_BREAKPOINT_SIZE) || 768;
	const asideMinimizeBreakpoint =
		Number(import.meta.env.VITE_ASIDE_MINIMIZE_BREAKPOINT_SIZE) || 1200;
	const mobileDesign =
		typeof deviceScreen?.width !== 'undefined' && deviceScreen.width <= mobileBreakpoint;

	const [darkModeStatus, setDarkModeStatus] = useState(
		localStorage.getItem('facit_darkModeStatus')
			? localStorage.getItem('facit_darkModeStatus') === 'true'
			: import.meta.env.VITE_DARK_MODE === 'true',
	);

	useLayoutEffect(() => {
		localStorage.setItem('facit_darkModeStatus', darkModeStatus.toString());
	}, [darkModeStatus]);

	const [fullScreenStatus, setFullScreenStatus] = useState(false);

	const [leftMenuStatus, setLeftMenuStatus] = useState(false);
	const [rightMenuStatus, setRightMenuStatus] = useState(false);
	const [asideStatus, setAsideStatus] = useState(() => {
		const isMobile =
			typeof deviceScreen?.width !== 'undefined'
				? deviceScreen.width <= mobileBreakpoint
				: typeof window !== 'undefined' && window.innerWidth <= mobileBreakpoint;
		if (isMobile) {
			return false;
		}
		const saved =
			typeof window !== 'undefined' ? localStorage.getItem('facit_asideStatus') : null;
		if (saved !== null) {
			return saved === 'true';
		}
		return true;
	});
	useLayoutEffect(() => {
		localStorage.setItem('facit_asideStatus', asideStatus?.toString());
	}, [asideStatus]);

	const [rightPanel, setRightPanel] = useState(false);

	useLayoutEffect(() => {
		if (deviceScreen?.width && deviceScreen.width >= asideMinimizeBreakpoint) {
			if (localStorage.getItem('facit_asideStatus') === null) {
				setAsideStatus(true);
			}
			setLeftMenuStatus(false);
			setRightMenuStatus(false);
		}
	}, [deviceScreen.width, asideMinimizeBreakpoint]);

	const values: IThemeContextProps = useMemo(
		() => ({
			mobileDesign,
			darkModeStatus,
			setDarkModeStatus,
			fullScreenStatus,
			setFullScreenStatus,
			asideStatus,
			setAsideStatus,
			leftMenuStatus,
			setLeftMenuStatus,
			rightMenuStatus,
			setRightMenuStatus,
			rightPanel,
			setRightPanel,
		}),
		[
			asideStatus,
			darkModeStatus,
			fullScreenStatus,
			leftMenuStatus,
			mobileDesign,
			rightMenuStatus,
			rightPanel,
		],
	);

	return <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
