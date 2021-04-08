import { GraphQLResponseResolver } from 'msw';
import { populateFolder, populateParents } from '../commonDrive/mocks/mockUtils';
import { GetParentQuery, GetParentQueryVariables } from '../commonDrive/types/graphql/types';

const handleGetParentsRequest: GraphQLResponseResolver<GetParentQuery, GetParentQueryVariables> = (
	req,
	res,
	ctx
) => {
	const { id } = req.variables;

	const { node: currentFolder } = populateParents(populateFolder(0, id), 2);

	return res(
		ctx.data({
			getNode: currentFolder
		})
	);
};

export default handleGetParentsRequest;
