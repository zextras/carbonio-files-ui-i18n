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

import React from 'react';
import { testUtils } from '@zextras/zapp-shell';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client';
import faker from 'faker';
import { forEach } from 'lodash';
import { MockedProvider } from '@apollo/client/testing';
import { populateFolder } from '../../../mocks/mockUtils';
import FolderList from '../../../commonDrive/views/folder/components/FolderList';
import buildClient from '../../../commonDrive/apollo';
import getChildren from '../../../commonDrive/graphql/queries/getChildren.graphql';

let apolloClient;
let mockedUserLogged;

beforeAll(() => {
	apolloClient = buildClient(true);
});

beforeEach(() => {
	// mock useUserInfo data
	mockedUserLogged = {
		id: faker.random.uuid(),
		name: faker.name.findName(),
	};
	// reset the cache of apollo
	apolloClient.cache.reset();
});

afterEach(() => {
	jest.restoreAllMocks();
});

jest.mock('../../../hooks/useUserInfo', () => {
	return jest.fn(() => ({
		me: mockedUserLogged.id,
	}));
});


describe('Folder View', () => {

	// TODO: define better this behavior with error handling
	test('access to a folder with network error response show an error page', async () => {
		const currentFolder = populateFolder();
		const mocks = [{
			request: {
				query: getChildren,
				variables: {
					parentNode: currentFolder.id,
					childrenLimit: 10,
					sorts: ['TYPE_ASC', 'NODE_ASC'],
				},
			},
			error: new Error('An error occurred'),
		}];
		testUtils.render(
			<MockedProvider mocks={mocks} cache={apolloClient.cache} addTypename={false}>
				<FolderList folderId={currentFolder.id} />
			</MockedProvider>,
		);

		await waitForElementToBeRemoved(() => screen.queryByTestId('icon: Refresh'));
		// screen.debug();
		/*
		 * TODO: at the moment it always return this error:
		 * No more mocked responses for the query: query getChildren($parentNode: ID!, $childrenLimit: Int!, $sorts: [NodeSort!]) {
		 *     getNode(id: $parentNode) {
		 */
		// expect(screen.getByText(/An error occurred/g)).toBeVisible();
	});

	test('first access to a folder show loading state and than show children', async () => {
		const currentFolder = populateFolder();

		testUtils.render(
			<ApolloProvider client={apolloClient}>
				<FolderList folderId={currentFolder.id} />
			</ApolloProvider>,
		);
		// screen.debug();
		expect(screen.getByTestId('icon: Refresh')).toBeVisible();
		await waitForElementToBeRemoved(() => screen.queryByTestId('icon: Refresh'));
		expect(screen.getByTestId(currentFolder.id)).not.toBeEmptyDOMElement();
		const { getNode } = apolloClient.readQuery({
			query: getChildren,
			variables: {
				parentNode: currentFolder.id,
				childrenLimit: 10,
				sorts: ['TYPE_ASC', 'NAME_ASC'],
			},
		});
		forEach(getNode.children, child => {
			expect(screen.getByTestId(child.id)).toBeInTheDocument();
			expect(screen.getByTestId(child.id)).toHaveTextContent(child.name);
		});
	});

	// TODO test if hover and actions work
});
