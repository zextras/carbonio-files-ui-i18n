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
import { GraphQLResponseResolver } from 'msw';
import { populateFolder, populateLocalRoot, populateParents } from '../commonDrive/mocks/mockUtils';
import { GetPathQuery, GetPathQueryVariables } from '../commonDrive/types/graphql/types';

const handleGetPathRequest: GraphQLResponseResolver<GetPathQuery, GetPathQueryVariables> = (
	req,
	res,
	ctx
) => {
	const { id } = req.variables;

	const { path } = populateParents(populateFolder(0, id), faker.random.number(15));
	if (id !== 'LOCAL_ROOT') {
		path.unshift(populateLocalRoot());
	}

	return res(
		ctx.data({
			getPath: path
		})
	);
};

export default handleGetPathRequest;
