/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2021 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { Container } from '@zextras/zapp-ui';
import client from '../../apollo';
import FolderList from './components/FolderList';
import useQueryParam from '../../hooks/useQueryParam';

const FolderView = () => {
	let { folderId: mainFolderId } = useParams();
	if (!mainFolderId) {
		mainFolderId = 'LOCAL_ROOT';
	}
	const folderId = useQueryParam('to');

	return (
		<ApolloProvider client={client}>
			<Container orientation="horizontal">
				<FolderList folderId={folderId || mainFolderId }/>
				<Container>
					Preview
				</Container>
			</Container>
		</ApolloProvider>
	);
};

export default FolderView;
