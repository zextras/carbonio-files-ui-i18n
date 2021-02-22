import faker from 'faker';
import { populateFile, populateFolder, sortNodes } from './mockUtils';

export default function handleGetChildrenRequest(req, res, ctx) {
	const { parentNode, childrenLimit, sorts } = req.variables;

	let parentNodeName = faker.random.words();
	if (parentNode.trim() === 'LOCAL_ROOT') {
		parentNodeName = 'ROOT';
	}

	const children = [];
	const childrenNum = faker.random.number({ min: 0, max: childrenLimit });
	for (let i = 0; i < childrenNum; i += 1) {
		const type = faker.random.arrayElement(['Folder', 'File']);
		let node;
		if (type === 'File') {
			node = populateFile();
		}
		else if (type === 'Folder') {
			node = populateFolder();
		}

		children.push(node);
	}
	if (sorts) {
		sortNodes(children, sorts);
	}

	return res(
		ctx.data({
			getNode: {
				id: parentNode,
				name: parentNodeName,
				children,
				__typename: 'Folder',
			},
		}),
	)
}
