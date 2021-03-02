import faker from 'faker';
import { File, Folder, Node, NodeSort, Permissions, User } from '../commonDrive/graphql/types';

export function populateUser(): User {
	return {
		id: faker.random.uuid(),
		email: faker.internet.exampleEmail(),
		full_name: faker.name.findName(),
		__typename: 'User',
	};
}

export function populatePermissions(): Permissions {
	return {
		can_rename: faker.random.boolean(),
		can_move: faker.random.boolean(),
		can_copy: faker.random.boolean(),
		can_upload: faker.random.boolean(),
		can_delete: faker.random.boolean(),
		can_mark_for_deletion: faker.random.boolean(),
		can_change_description: faker.random.boolean(),
		can_change_star: faker.random.boolean(),
		can_add_version: faker.random.boolean(),
		can_read_link: faker.random.boolean(),
		can_change_link: faker.random.boolean(),
		can_share: faker.random.boolean(),
		can_read_share: faker.random.boolean(),
		can_change_share: faker.random.boolean(),
		__typename: 'Permissions',
	};
}

export function populateNode(type?: string, id?: string, name?: string): Node {
	const nodeType = type || faker.random.arrayElement(['Folder', 'File']);
	return {
		id: id || faker.random.uuid(),
		creator: populateUser(),
		owner: populateUser(),
		last_editor: populateUser(),
		created_at: faker.date.past().getTime(),
		updated_at: faker.date.recent().getTime(),
		permissions: populatePermissions(),
		name: name || faker.random.words(),
		description: '',
		type: nodeType,
		starred: faker.random.boolean(),
		marked_for_deletion: false,
		parent: null,
		share: null,
		shares: [],
		link: null,
	};
}

export function populateParents(node: Node, limit = 1): Node {
	let currentNode = node;
	for (let i = 0; i < limit; i += 1) {
		currentNode.parent = populateNode('Folder');
		currentNode = currentNode.parent;
	}
	return node;
}

export function populateFolder(childrenLimit = 0, id?: string, name?: string): Folder {
	const children: Node[] = [];
	const folder: Folder = {
		...populateNode('Folder', id, name),
		children,
		__typename: 'Folder',
	};
	for (let i = 0; i < childrenLimit; i += 1) {
		const child = populateNode();
		child.parent = folder;
		children.push(child);
	}
	return folder;
}

export function populateFile(id?: string, name?: string): File {
	return {
		...populateNode('File', id, name),
		mime_type: faker.system.mimeType(),
		size: faker.random.number(),
		version: 1,
		parent: populateFolder(),
		__typename: 'File',
	};
}

function propertyComparator(a: any, b: any, property: string): number {
	if ((a == null || a[property] == null) && (b == null || b[property] == null)) {
		return 0;
	}
	if (a == null || a[property] == null) {
		return -1;
	}
	if (b == null || b[property] == null) {
		return 1;
	}
	return a[property] < b[property] ? -1 : 1;
}

export function sortNodes(nodes: Node[], sorts: NodeSort): void {
	nodes.sort((a, b) => {
		let result = 0;
		let i = 0;
		while (result === 0 && i < sorts.length) {
			switch (sorts[i]) {
				case NodeSort.LastEditorAsc:
					result = propertyComparator(a, b, 'last_editor');
					break;
				case NodeSort.LastEditorDesc:
					result = propertyComparator(b, a, 'last_editor');
					break;
				case NodeSort.MarkForDeletionAsc:
					result = propertyComparator(a, b, 'marked_for_deletion');
					break;
				case NodeSort.MarkForDeletionDesc:
					result = propertyComparator(b, a, 'marked_for_deletion');
					break;
				case NodeSort.NameAsc:
					result = propertyComparator(a, b, 'name');
					break;
				case NodeSort.NameDesc:
					result = propertyComparator(b, a, 'name');
					break;
				case NodeSort.OwnerAsc:
					if (a.owner != null || b.owner != null) {
						if (a.owner == null) {
							result = -1;
						}
						else if (b.owner == null) {
							result = 1;
						}
						else {
							result = propertyComparator(a.owner, b.owner, 'full_name');
						}
					}
					break;
				case NodeSort.OwnerDesc:
					if (a.owner != null || b.owner != null) {
						if (a.owner == null) {
							result = 1;
						}
						else if (b.owner == null) {
							result = -1;
						}
						else {
							result = propertyComparator(b.owner, a.owner, 'full_name');
						}
					}
					break;
				case NodeSort.TypeAsc:
					result = propertyComparator(a, b, 'type');
					break;
				case NodeSort.TypeDesc:
					result = propertyComparator(b, a, 'type');
					break;
				case NodeSort.UpdatedAtAsc:
					result = propertyComparator(a, b, 'updated_at');
					break;
				case NodeSort.UpdatedAtDesc:
					result = propertyComparator(b, a, 'updated_at');
					break;
				default:
					result = propertyComparator(a, b, 'name');
					break;
			}
			i += 1;
		}
		return result;
	});
}


