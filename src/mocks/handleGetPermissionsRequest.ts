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

import { populatePermissions } from '../commonDrive/mocks/mockUtils';
import {
	GetPermissionsQuery,
	GetPermissionsQueryVariables
} from '../commonDrive/types/graphql/types';

const handleGetPermissionsRequest: GraphQLResponseResolver<
	GetPermissionsQuery,
	GetPermissionsQueryVariables
> = (req, res, ctx) => {
	const { id } = req.variables;
	const permissions = populatePermissions();
	return res(
		ctx.data({
			getNode: {
				id,
				__typename: 'Folder',
				permissions
			}
		})
	);
};

export default handleGetPermissionsRequest;
