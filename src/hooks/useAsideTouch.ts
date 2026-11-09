import { useContext, useEffect, useState } from 'react';
import { useMotionValue, useTransform } from 'framer-motion';
import ThemeContext from '../contexts/themeContext';
import useDeviceScreen from './useDeviceScreen';

const useAsideTouch = () => {
	const { asideStatus } = useContext(ThemeContext);
	const deviceScreen = useDeviceScreen();

	const asideMinimizeBreakpoint =
		Number(import.meta.env.VITE_ASIDE_MINIMIZE_BREAKPOINT_SIZE) || 1200;
	const asideWidthPx = parseInt(String(import.meta.env.VITE_ASIDE_WIDTH_PX || 240), 10);
	const spacerPx = parseInt(String(import.meta.env.VITE_SPACER_PX || 16), 10);

	const isModernDesign = import.meta.env.VITE_MODERN_DESGIN === 'true';

	const hasTouchButton =
		isModernDesign &&
		typeof deviceScreen?.width !== 'undefined' &&
		deviceScreen?.width > asideMinimizeBreakpoint;

	const asideWidthWithSpace = (asideWidthPx + spacerPx) * -1;

	const x = useMotionValue(
		import.meta.env.VITE_ASIDE_TOUCH_STATUS === 'true' ? 0 : asideWidthWithSpace,
	);
	const [touchStatus, setTouchStatus] = useState(!x.get());
	const left = useTransform(
		x,
		[-100, -90, -10, 0],
		[asideWidthWithSpace, asideWidthWithSpace, 0, 0],
	);

	// X value get
	useEffect(() => {
		function updateX() {
			const X = x.get();
			setTouchStatus(!X);
		}

		// @ts-ignore
		const unsubscribeX = x.on('change', updateX);

		return () => {
			unsubscribeX();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Set Aside & Touch Button value
	useEffect(() => {
		if (!hasTouchButton) {
			x.set(0);
		}
		return () => {};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasTouchButton, deviceScreen.width]);

	//  for start minimize aside
	useEffect(() => {
		if (!asideStatus) {
			x.set(0);
			setTouchStatus(false);
		}
		return () => {};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [asideStatus]);

	const asideStyle = hasTouchButton ? { left } : undefined;

	return { asideStyle, touchStatus, hasTouchButton, asideWidthWithSpace, x };
};

export default useAsideTouch;
