import { populateFolder, populateParents } from '../commonDrive/mocks/mockUtils';

export default function handleGetParentsRequest(req, res, ctx) {
	const { id } = req.variables;

	const { node: currentFolder } = populateParents(populateFolder(0, id), 2);

	return res(
		ctx.data({
			getNode: currentFolder
		})
	);
}
