import faker from 'faker';

export default function handleGetParentsRequest(req, res, ctx) {
	const { id } = req.variables;

	let lastNode = {
		id: 'LOCAL_ROOT',
		name: 'ROOT',
		parent: null,
		__typename: 'Folder',
	}

	if (id !== 'LOCAL_ROOT') {
		for (let i = 0; i < faker.random.number({ min: 0, max: 20 }); i += 1) {
			lastNode = {
				id: faker.random.uuid(),
				name: faker.random.words(),
				parent: lastNode,
				__typename: 'Folder',
			};
		}
	}

	lastNode.id = id;

	return res(
		ctx.data({
			getNode: lastNode,
		}));

}
