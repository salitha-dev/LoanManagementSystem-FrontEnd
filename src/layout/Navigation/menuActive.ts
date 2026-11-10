type MenuNode = {
	id?: string | number;
	path?: string;
	subMenu?: Record<string, MenuNode> | null;
};

export function normalizeMenuPath(path?: string): string {
	return String(path || '')
		.replace(/^\//, '')
		.replace(/\/$/, '');
}

export function menuPathMatches(currentPath: string, itemPath?: string): boolean {
	const path = normalizeMenuPath(itemPath);
	if (!path) return false;
	const current = normalizeMenuPath(currentPath);
	return current === path || current.startsWith(`${path}/`);
}

/** Maps every menu item id to the ids of the groups that contain it, outermost first. */
export function buildAncestorMap(menu: Record<string, MenuNode>): Record<string, string[]> {
	const map: Record<string, string[]> = {};
	const visit = (nodes: Record<string, MenuNode> | null | undefined, chain: string[]) => {
		if (!nodes) return;
		Object.values(nodes).forEach((node) => {
			if (!node?.id) return;
			map[String(node.id)] = chain;
			if (node.subMenu) visit(node.subMenu, [...chain, String(node.id)]);
		});
	};
	visit(menu, []);
	return map;
}

export function findOpenSectionIds(menu: Record<string, MenuNode>, pathname: string): string[] {
	const current = normalizeMenuPath(pathname);
	let best: { ids: string[]; length: number } = { ids: [], length: -1 };

	const visit = (nodes: Record<string, MenuNode> | null | undefined, ancestors: string[]) => {
		if (!nodes) return;
		for (const node of Object.values(nodes)) {
			if (!node?.id) continue;
			const chain = node.subMenu ? [...ancestors, String(node.id)] : ancestors;
			if (node.subMenu) visit(node.subMenu, chain);
			const path = normalizeMenuPath(node.path);
			if (
				path &&
				(current === path || current.startsWith(`${path}/`)) &&
				path.length > best.length
			) {
				best = { ids: chain, length: path.length };
			}
		}
	};

	visit(menu, []);
	return best.ids;
}

export function isMenuLeafActive(
	currentPath: string,
	itemPath: string | undefined,
	siblingPaths: string[],
): boolean {
	const current = normalizeMenuPath(currentPath);
	const path = normalizeMenuPath(itemPath);
	if (!path || !(current === path || current.startsWith(`${path}/`))) return false;
	return !siblingPaths.some((sibling) => {
		const other = normalizeMenuPath(sibling);
		return other.length > path.length && (current === other || current.startsWith(`${other}/`));
	});
}
