import React, { FC } from 'react';
import classNames from 'classnames';
import { APP_NAME, APP_SHORT_NAME } from '../config/app';

type TLogoVariant = 'mark' | 'lockup' | 'stack';

interface ILogoProps {
	variant?: TLogoVariant;
	size?: number;
	width?: number;
	showWordmark?: boolean;
	className?: string;
}

/** Placeholder brand mark (inline SVG, uses the theme primary colour). Replace with the final logo. */
const Mark: FC<{ px: number; title?: string }> = ({ px, title }) => (
	<svg
		width={px}
		height={px}
		viewBox='0 0 48 48'
		role={title ? 'img' : 'presentation'}
		aria-label={title}
		aria-hidden={title ? undefined : true}>
		<rect width='48' height='48' rx='12' fill='var(--bs-primary)' />
		<path d='M14 33V15h4v14.5h9V33H14Zm16.5 0V15h4v18h-4Z' fill='#fff' fillRule='evenodd' />
	</svg>
);

const Wordmark: FC = () => (
	<span className='gps-logo__wordmark gps-logo__wordmark--inline'>
		<span className='gps-logo__title'>{APP_SHORT_NAME}</span>
	</span>
);

const Logo: FC<ILogoProps> = ({
	variant = 'mark',
	size = 40,
	width,
	showWordmark = true,
	className,
}) => {
	const px = width ?? size;

	if (variant === 'lockup' || variant === 'stack') {
		const markPx = Math.round(px / 2.5);
		return (
			<span
				className={classNames(
					'gps-logo',
					'gps-logo--lockup',
					'd-inline-flex flex-column align-items-center gap-2',
					variant === 'stack' && 'gps-logo--stack',
					className,
				)}>
				<Mark px={markPx} />
				<span className='fw-bold fs-4'>{APP_NAME}</span>
			</span>
		);
	}

	return (
		<span className={classNames('gps-logo', 'gps-logo--mark', className)}>
			<span className='gps-logo__mark' style={{ width: px, height: px }}>
				<Mark px={px} title={showWordmark ? undefined : APP_NAME} />
			</span>
			{showWordmark && <Wordmark />}
		</span>
	);
};

export default Logo;
