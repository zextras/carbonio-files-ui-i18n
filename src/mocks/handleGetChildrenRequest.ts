import faker from 'faker';
import { GraphQLResponseResolver } from 'msw';

import { populateFolder, sortNodes } from '../commonDrive/mocks/mockUtils';
import { GetChildrenQuery, GetChildrenQueryVariables } from '../commonDrive/types/graphql/types';

const handleGetChildrenRequest: GraphQLResponseResolver<
	GetChildrenQuery,
	GetChildrenQueryVariables
> = (req, res, ctx) => {
	const { parentNode, childrenLimit, sorts } = req.variables;

	let parentNodeName = faker.random.words();
	if (parentNode.trim() === 'LOCAL_ROOT') {
		parentNodeName = 'ROOT';
	}

	const childrenNum = faker.random.number({ min: 0, max: childrenLimit });

	const folder = populateFolder(childrenNum, parentNode, parentNodeName);

	if (sorts) {
		sortNodes(folder.children, sorts);
	}

	return res(
		ctx.data({
			getNode: folder
		})
	);
};

export default handleGetChildrenRequest;
