import React, {
	FC,
	forwardRef,
	HTMLAttributes,
	ReactNode,
	useCallback,
	useEffect,
	useState,
} from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { TIcons } from '../../type/icons-type';
import Item from './Item';
import List from './List';
import { collectDescendantIds, findOpenSectionIds } from './menuActive';

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

		useEffect(() => {
			if (horizontal) return;
			setOpenIds(routeOpenKey ? routeOpenKey.split('|') : []);
		}, [horizontal, routeOpenKey]);

		const onToggleSection = useCallback(
			(sectionId: string, siblingIds: string[], descendantIds: string[]) => {
				setOpenIds((current) => {
					if (current.includes(sectionId)) {
						return current.filter(
							(itemId) => itemId !== sectionId && !descendantIds.includes(itemId),
						);
					}
					const remove = new Set(siblingIds.filter((itemId) => itemId !== sectionId));
					return [...current.filter((itemId) => !remove.has(itemId)), sectionId];
				});
			},
			[],
		);

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
			const siblingCloseIds = entries
				.filter((item) => item.subMenu)
				.flatMap((item) => [String(item.id), ...collectDescendantIds(item)]);

			return Object.keys(data).map((item) =>
				data[item].path ? (
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
						siblingIds={siblingCloseIds}
						descendantIds={collectDescendantIds(data[item])}
						siblingPaths={siblingPaths}
						onToggleSection={onToggleSection}
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
