/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */
import { graphql } from 'msw';

import handleFlagNodesRequest from './handleFlagNodesRequest';
import handleGetChildrenRequest from './handleGetChildrenRequest';
import handleGetParentRequest from './handleGetParentsRequest';
import handleGetPathRequest from './handleGetPathRequest';
import handleIntrospectionRequest from './handleIntrospectionRequest';

const handlers = [
	graphql.query('getChildren', handleGetChildrenRequest),
	graphql.query('getParent', handleGetParentRequest),
	graphql.query('IntrospectionQuery', handleIntrospectionRequest),
	graphql.mutation('flagNodes', handleFlagNodesRequest),
	graphql.query('getPath', handleGetPathRequest)
];

export default handlers;
