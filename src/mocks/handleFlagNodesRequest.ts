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

import { FlagNodesMutation, FlagNodesMutationVariables } from '../commonDrive/types/graphql/types';

const handleFlagNodesRequest: GraphQLResponseResolver<
	FlagNodesMutation,
	FlagNodesMutationVariables
> = (req, res, ctx) => {
	const { nodes_ids: ids } = req.variables;
	return res(
		ctx.data({
			flagNodes: (ids as string[]) || []
		})
	);
};

export default handleFlagNodesRequest;
