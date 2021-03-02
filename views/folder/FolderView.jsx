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
import { Container, Responsive } from '@zextras/zapp-ui';
import buildClient from '../../apollo';
import FolderList from './components/FolderList';
import useQueryParam from '../../hooks/useQueryParam';

const FolderView = () => {
	let { folderId: mainFolderId } = useParams();
	if (!mainFolderId) {
		mainFolderId = 'LOCAL_ROOT';
	}
	const folderId = useQueryParam('to');

	return (
		<ApolloProvider client={buildClient()}>
			<Container orientation="horizontal">
				<Responsive mode="desktop" target={window.top}>
					<FolderList folderId={folderId || mainFolderId} />
					<Container>
						Preview
					</Container>
				</Responsive>
				<Responsive mode="mobile" target={window.top}>
					<FolderList folderId={folderId || mainFolderId} />
				</Responsive>
			</Container>
		</ApolloProvider>
	);
};

export default FolderView;
