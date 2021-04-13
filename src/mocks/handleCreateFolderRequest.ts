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

import { populateFolder } from '../commonDrive/mocks/mockUtils';
import {
	CreateFolderMutation,
	CreateFolderMutationVariables
} from '../commonDrive/types/graphql/types';

const handleCreateFolderRequest: GraphQLResponseResolver<
	CreateFolderMutation,
	CreateFolderMutationVariables
> = (req, res, ctx) => {
	const { name } = req.variables;
	const folder = populateFolder(0, undefined, name);

	return res(
		ctx.data({
			createFolder: folder
		})
	);
};

export default handleCreateFolderRequest;
