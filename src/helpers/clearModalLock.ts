/** Drop leftover body scroll locks and orphaned backdrops. Do not remove `.modal` nodes React still owns. */
export function clearModalDocumentLock(): void {
	const { body, documentElement } = document;
	body.classList.remove('modal-open');
	documentElement.classList.remove('modal-open');
	body.style.removeProperty('overflow');
	documentElement.style.removeProperty('overflow');
	body.style.removeProperty('padding-right');
	document.querySelectorAll('.modal-backdrop').forEach((node) => {
		if (!node.closest('.cp-modal, .modal.show')) {
			node.remove();
		}
	});
}
