import React, { FC, memo, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { NavHashLink } from 'react-router-hash-link';
import { Manager, Popper, Reference } from 'react-popper';
// @ts-ignore
import useEventOutside from '@omtanke/react-use-event-outside';
import Collapse from '../../components/bootstrap/Collapse';
import Icon from '../../components/icon/Icon';
import ThemeContext from '../../contexts/themeContext';
import useDarkMode from '../../hooks/useDarkMode';
import { TIcons } from '../../type/icons-type';
import List from './List';
import { isMenuLeafActive, menuPathMatches } from './menuActive';

interface IItemProps {
	children?: ReactNode;
	to?: string;
	title?: string;
	icon?: TIcons;
	id?: string;
	parentId?: string;
	rootId: string;
	isHorizontal?: boolean;
	notification?: boolean | string;
	isMore?: boolean;
	hide?: boolean;
	activeItem?: string;
	setActiveItem?(...args: unknown[]): unknown;
	openIds?: string[];
	siblingPaths?: string[];
	/** Expand/collapse a group (accordion: other branches collapse). */
	onToggleSection?(id: string): void;
	/** A page link was chosen: collapse groups that do not contain it. */
	onSelectLeaf?(id: string): void;
}
const Item: FC<IItemProps> = ({
	children,
	to,
	title,
	icon,
	id,
	parentId,
	rootId,
	isHorizontal,
	notification,
	isMore,
	hide,
	openIds,
	siblingPaths = [],
	onToggleSection,
	onSelectLeaf,
	...props
}) => {
	const { darkModeStatus } = useDarkMode();
	const { width } = useWindowSize();
	const { setAsideStatus, setLeftMenuStatus, setRightMenuStatus } = useContext(ThemeContext);
	const navigate = useNavigate();

	const ACTIVE = props.activeItem === id;
	const isOpen = Boolean(id && openIds?.includes(id));

	const linkHandleClick = () => {
		if (id) onSelectLeaf?.(id);
		// For Mobile Design — close the drawer only after choosing a page, not when expanding a section
		if (width < (Number(import.meta.env.VITE_MOBILE_BREAKPOINT_SIZE) || 768))
			setAsideStatus(false);
		setLeftMenuStatus(false);
		setRightMenuStatus(false);
	};

	const ANCHOR_LINK_PATTERN = /^#/i;
	const location = useLocation();
	const collectChildPaths = (node: ReactNode): string[] =>
		React.Children.toArray(node).flatMap((child) => {
			if (!React.isValidElement<{ to?: string; children?: ReactNode }>(child)) {
				return [];
			}
			const own = child.props.to ? [String(child.props.to).replace(/^\//, '')] : [];
			return [...own, ...collectChildPaths(child.props.children)];
		});
	const childPaths = collectChildPaths(children);
	const currentPath = location.pathname.replace(/^\//, '');
	const inSection =
		Boolean(children) && childPaths.some((path) => menuPathMatches(currentPath, path));
	const leafActive = !children && isMenuLeafActive(currentPath, to, siblingPaths);

	// For aside menu
	const here = isHorizontal ? to !== '/' && location.pathname === to : leafActive;
	// For top menu
	const match = to !== '/' && location.pathname === to;

	const { t } = useTranslation('menu');

	const sectionExpanded = isHorizontal ? ACTIVE : isOpen;

	const LINK_CLASS = classNames('navigation-link', 'navigation-link-pill', {
		collapsed: !!children && !isHorizontal && !sectionExpanded,
		active: isHorizontal ? match : here,
	});

	const INNER = (
		<>
			<span className='navigation-link-info'>
				{icon && <Icon className='navigation-icon' icon={icon} />}
				{title && <span className='navigation-text'>{t(title) as ReactNode}</span>}
			</span>
			{(!!children || !!notification) && (
				<span className='navigation-link-extra'>
					{!!notification && (
						<Icon
							icon='Circle'
							className={classNames(
								'navigation-notification',
								{
									[`text-${notification}`]: typeof notification === 'string',
									'text-danger': typeof notification !== 'string',
								},
								'animate__animated animate__heartBeat animate__infinite animate__slower',
							)}
						/>
					)}
					{!!children && <Icon className='navigation-arrow' icon='ChevronRight' />}
				</span>
			)}
		</>
	);

	const WITHOUT_CHILD =
		!children &&
		!hide &&
		((typeof to === 'string' && ANCHOR_LINK_PATTERN.test(to) && (
			<NavHashLink className={LINK_CLASS} to={to} onClick={linkHandleClick}>
				{INNER}
			</NavHashLink>
		)) || (
			<NavLink
				className={() =>
					classNames('navigation-link', 'navigation-link-pill', { active: leafActive })
				}
				aria-current={leafActive ? 'page' : undefined}
				to={typeof to === 'string' && to.startsWith('/') ? to : `/${to || ''}`}
				onClick={linkHandleClick}>
				{INNER}
			</NavLink>
		));

	// Dropdown
	const dropdownRef = useRef(null);

	const dropdownButtonRef = useRef(null);
	const setButtonRef = useCallback((node: null, ref: (arg0: any) => any) => {
		dropdownButtonRef.current = node;
		return ref(node);
	}, []);

	const dropdownListRef = useRef(null);
	const setListRef = useCallback((node: null, ref: (arg0: any) => any) => {
		dropdownListRef.current = node;
		return ref(node);
	}, []);

	const [dropdownStatus, setDropdownStatus] = useState(false);

	const dropdownButtonHandleClick = () => {
		setDropdownStatus(!dropdownStatus);
	};

	// Clicking outside to close
	const closeMenu = useCallback(() => {
		setDropdownStatus(false);
	}, []);
	useEventOutside(dropdownRef, 'mousedown', closeMenu);
	useEventOutside(dropdownRef, 'touchstart', closeMenu);

	if (children) {
		// submenu && in header
		if (isHorizontal) {
			return (
				<Manager>
					<li
						ref={dropdownRef}
						className={classNames('navigation-item', 'dropdown', {
							'navigation-item-more': isMore,
						})}>
						<Reference>
							{({ ref }) => (
								<span
									// @ts-ignore
									ref={(node) => setButtonRef(node, ref)}
									id={`${rootId}__${id}--link`}
									className={LINK_CLASS}
									aria-expanded={dropdownStatus}
									aria-controls={`${rootId}__${id}`}
									role='button'
									tabIndex={-1}
									onClick={dropdownButtonHandleClick}
									onKeyDown={dropdownButtonHandleClick}>
									{INNER}
								</span>
							)}
						</Reference>
						{dropdownStatus && (
							<Popper
								placement='bottom-start'
								modifiers={[
									{
										name: 'flip',
										options: {
											fallbackPlacements: [`bottom-end`, `bottom-start`],
										},
									},
								]}>
								{({ ref, style, placement }) => (
									<List
										// @ts-ignore
										ref={(node) => setListRef(node, ref)}
										style={style}
										data-placement={placement}
										id={`${rootId}__${id}`}
										className={classNames(
											'dropdown-menu',
											{
												'dropdown-menu-dark': darkModeStatus,
											},
											'show',
										)}
										ariaLabelledby={`${rootId}__${id}--link`}
										rootId={rootId}
										parentId={`${rootId}__${parentId}`}
										onMouseLeave={() => setDropdownStatus(false)}>
										{children}
									</List>
								)}
							</Popper>
						)}
					</li>
				</Manager>
			);
		}
		// submenu && in aside
		const parentTo = typeof to === 'string' && to.startsWith('/') ? to : `/${to || ''}`;
		const toggleSection = () => {
			if (id && onToggleSection) {
				onToggleSection(id);
			} else if (typeof props.setActiveItem !== 'undefined') {
				props.setActiveItem(ACTIVE ? undefined : id);
			}
		};
		const onSectionClick = () => {
			const wasOpen = isOpen;
			toggleSection();
			if (!wasOpen && to && !inSection) {
				navigate(parentTo);
			}
		};
		const onSectionKeyDown = (event: React.KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				onSectionClick();
			}
		};
		return (
			<li className='navigation-item'>
				<span
					id={`${rootId}__${id}--link`}
					className={LINK_CLASS}
					aria-expanded={sectionExpanded}
					aria-controls={`${rootId}__${id}`}
					role='button'
					tabIndex={0}
					onClick={onSectionClick}
					onKeyDown={onSectionKeyDown}>
					{INNER}
				</span>
				<Collapse isOpen={sectionExpanded} isChildClone>
					<List
						id={`${rootId}__${id}`}
						ariaLabelledby={`${rootId}__${id}--link`}
						rootId={rootId}
						parentId={`${rootId}__${parentId}`}
						onMouseLeave={closeMenu}>
						{children}
					</List>
				</Collapse>
			</li>
		);
	}
	// without submenu
	return <li className='navigation-item'>{WITHOUT_CHILD}</li>;
};

export default memo(Item);
