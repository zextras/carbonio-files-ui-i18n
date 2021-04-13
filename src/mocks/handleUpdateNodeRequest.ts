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

import { GraphQLResponseResolver } from 'msw';

import buildClient from '../commonDrive/apollo';
import CHILD from '../commonDrive/graphql/fragments/child.graphql';
import {
	UpdateNodeMutation,
	UpdateNodeMutationVariables
} from '../commonDrive/types/graphql/types';

const handleUpdateNodeRequest: GraphQLResponseResolver<
	UpdateNodeMutation,
	UpdateNodeMutationVariables
> = (req, res, ctx) => {
	const { id, name, description } = req.variables;

	const apolloClient = buildClient();

	// try to read the node as a file
	let result = apolloClient.readFragment({
		fragmentName: 'Child',
		fragment: CHILD,
		id: `File:${id}`
	});

	if (!result) {
		// if result is null, try to read the node as a folder
		result = apolloClient.readFragment({
			fragmentName: 'Child',
			fragment: CHILD,
			id: `Folder:${id}`
		});
	}

	return res(
		ctx.data({
			updateNode: {
				...result,
				name: name || result.name,
				description
			}
		})
	);
};

export default handleUpdateNodeRequest;
