/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2021 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */
import faker from 'faker';
import { GraphQLError } from 'graphql';
import { GraphQLResponseResolver } from 'msw';

import { populateNode, sortNodes } from '../commonDrive/mocks/mockUtils';
import { FindNodesQuery, FindNodesQueryVariables } from '../commonDrive/types/graphql/types';

const handleFindNodesRequest: GraphQLResponseResolver<FindNodesQuery, FindNodesQueryVariables> = (
	req,
	res,
	ctx
) => {
	const { flagged, sharedWithMe, sharedByMe, limit, sorts } = req.variables;

	const nodes = [];

	if (!flagged && !sharedWithMe && !sharedByMe) {
		return res(ctx.errors([new GraphQLError('Invalid parameters in findNodes request')]));
	}

	for (let i = 0; i < faker.random.number(limit); i += 1) {
		const node = populateNode();
		if (flagged) {
			node.flagged = true;
		}
		nodes.push(node);
	}

	if (sorts) {
		sortNodes(nodes, sorts);
	}

	return res(
		ctx.data({
			findNodes: nodes
		})
	);
};

export default handleFindNodesRequest;
