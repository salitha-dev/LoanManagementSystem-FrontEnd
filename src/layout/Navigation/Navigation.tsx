import React, {
	FC,
	forwardRef,
	HTMLAttributes,
	ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { TIcons } from '../../type/icons-type';
import Item from './Item';
import List from './List';
import { buildAncestorMap, findOpenSectionIds } from './menuActive';

interface INavigationLineProps {
	className?: string;
}
export const NavigationLine: FC<INavigationLineProps> = ({ className }) => {
	return <hr className={classNames('navigation-line', className)} />;
};

interface INavigationTitleProps extends HTMLAttributes<HTMLSpanElement> {
	className?: string;
	children: ReactNode;
}
export const NavigationTitle: FC<INavigationTitleProps> = ({ className, children, ...props }) => {
	return (
		<li className='navigation-item'>
			<span className={classNames('navigation-title', className)} {...props}>
				{children}
			</span>
		</li>
	);
};

interface INavigationProps {
	horizontal?: boolean;
	menu: {
		[key: string]: {
			id?: string | number;
			text?: string;
			path?: string;
			icon?: TIcons;
			isDisable?: boolean;
			subMenu?: {
				[key: string]: {
					id?: string | number;
					text?: string;
					path?: string;
					icon?: TIcons;
					isDisable?: boolean;
				};
			} | null;
		};
	};
	id: string;
	className?: string;
}
const Navigation = forwardRef<HTMLElement, INavigationProps>(
	({ menu, horizontal, id, className, ...props }, ref) => {
		const location = useLocation();
		const [activeItem, setActiveItem] = useState(undefined);
		const routeOpenIds = horizontal ? [] : findOpenSectionIds(menu, location.pathname);
		const routeOpenKey = routeOpenIds.join('|');
		const [openIds, setOpenIds] = useState<string[]>(routeOpenIds);

		const { t } = useTranslation('menu');

		// Accordion rule: only the groups on the path to the selected item are expanded.
		// Every navigation (sidebar, link, back button) re-applies it for the current page,
		// even when the page stays inside the same group.
		useEffect(() => {
			if (horizontal) return;
			setOpenIds(routeOpenKey ? routeOpenKey.split('|') : []);
		}, [horizontal, routeOpenKey, location.pathname]);

		// Kept in a ref (updated after render) so the click handlers stay stable for memoised items.
		const ancestorsRef = useRef<Record<string, string[]>>({});
		useEffect(() => {
			ancestorsRef.current = buildAncestorMap(menu);
		}, [menu]);

		/**
		 * Opening a group collapses everything outside its path. Clicking an open group that has
		 * an open sub-group steps back to it (sub-group closes, its links show again); otherwise
		 * the group closes, keeping only its parents.
		 */
		const onToggleSection = useCallback((sectionId: string) => {
			const ancestors = ancestorsRef.current;
			const chain = ancestors[sectionId] ?? [];
			setOpenIds((current) => {
				if (!current.includes(sectionId)) return [...chain, sectionId];
				const hasOpenSubGroup = current.some((id) => ancestors[id]?.includes(sectionId));
				return hasOpenSubGroup ? [...chain, sectionId] : chain;
			});
		}, []);

		/** Choosing a page collapses every group that does not contain it. */
		const onSelectLeaf = useCallback((itemId: string) => {
			setOpenIds(ancestorsRef.current[itemId] ?? []);
		}, []);

		function fillMenu(
			data:
				| {
						id?: string | number;
						text?: string;
						path?: string;
						icon?: TIcons;
						isDisable?: boolean;
						subMenu?:
							| {
									id?: string | number;
									text?: string;
									path?: string;
									icon?: TIcons;
									isDisable?: boolean;
							  }[]
							| undefined;
				  }[]
				| any,
			parentId: string,
			rootId: string,
			isHorizontal: boolean | undefined,
			isMore: boolean | undefined,
		) {
			const entries = Object.keys(data)
				.map((key) => data[key])
				.filter((item) => item?.path);
			const siblingPaths = entries.map((item) => String(item.path));
			// Drill-in: inside a group, an open sub-group replaces its sibling links
			// (e.g. Admin › Facility Management shows only the Facility links).
			const isNested = parentId !== rootId && !isHorizontal;
			const openSubGroup = isNested
				? entries.find((entry) => entry.subMenu && openIds.includes(String(entry.id)))
				: undefined;

			return Object.keys(data).map((item) =>
				openSubGroup && data[item] !== openSubGroup ? null : data[item].path ? (
					<Item
						key={data[item].id}
						rootId={rootId}
						id={String(data[item].id)}
						title={data[item].text}
						icon={data[item].icon}
						to={`${data[item].path}`}
						parentId={parentId}
						isHorizontal={isHorizontal}
						setActiveItem={setActiveItem}
						activeItem={activeItem}
						openIds={openIds}
						siblingPaths={siblingPaths}
						onToggleSection={onToggleSection}
						onSelectLeaf={onSelectLeaf}
						notification={data[item].notification}
						hide={data[item].hide}>
						{!!data[item].subMenu &&
							fillMenu(
								data[item].subMenu,
								data[item].id,
								rootId,
								isHorizontal,
								undefined,
							)}
					</Item>
				) : (
					!isMore &&
					!isHorizontal && (
						<NavigationTitle key={data[item].id}>
							{t(data[item].text) as ReactNode}
						</NavigationTitle>
					)
				),
			);
		}

		return (
			// @ts-ignore

			<nav ref={ref} aria-label={id} className={className} {...props}>
				<List id={id} horizontal={horizontal}>
					{fillMenu(menu, id, id, horizontal, undefined)}
					{horizontal && (
						<Item
							rootId={`other-${id}`}
							title={t('More') as string}
							icon='MoreHoriz'
							isHorizontal
							isMore>
							{fillMenu(menu, `other-${id}`, `other-${id}`, false, true)}
						</Item>
					)}
				</List>
			</nav>
		);
	},
);
Navigation.displayName = 'Navigation';

export default Navigation;
