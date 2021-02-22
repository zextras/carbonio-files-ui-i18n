import moment, { Moment } from 'moment';
import { Node } from '../types/graphqlSchema';

/**
 * Format a size in byte as human readable
 * @param size
 */
export const humanFileSize: (size: number) => string = (size) => {
	if (size === 0) {
		return '0 B';
	}
	const i = Math.floor(Math.log(size) / Math.log(1024));
	return `${(size / 1024 ** i).toFixed(2).toString()} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
};

/**
 * Given a file type returns the DS icon name
 * @param type
 */
export const getIconByFileType: (type: string) => string = (type) => {
	switch (type) {
		case 'Folder':
			return 'Folder';
		default:
			return 'File';
	}
};

/**
 * Build the crumbs for a node formatted as required by @zextras/zapp-ui Breadcrumb.
 * @param node - should contain properties id, name and parent (optional)
 * @param clickHandler - callback that handles the click on the breadcrumb item. It receives the node id as a param
 */
export const buildCrumbs: (node: Node, clickHandler?: (id?: string) => void) => {
	id: string; label: string; click?: (id?: string) => void
}[] = (node, clickHandler) => {
	let result: { id: string; label: string; click?: (id?: string) => void }[] = [];
	if (node.parent) {
		result = buildCrumbs(node.parent, clickHandler);
	}

	let handlerFunction;
	if (clickHandler) {
		handlerFunction = (): void => clickHandler(node.id);
	}
	result.push({
		id: node.id,
		label: node.name,
		click: handlerFunction,
	});
	return result;
}

/**
 * Given a date format it based on user locale preference
 * @param date
 */
export const formatDate: (date: Moment | Date | string | number) => string = (date) => {
	// TODO manage locale
	return moment(date).format('DD/MM/YY');
}
