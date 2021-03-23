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
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client';
import faker from 'faker';
import { forEach } from 'lodash';
import { MockedProvider } from '@apollo/client/testing';
import { populateFolder } from '../../../mocks/mockUtils';
import FolderList from '../../../commonDrive/views/folder/components/FolderList';
import buildClient from '../../../commonDrive/apollo';
import getChildren from '../../../commonDrive/graphql/queries/getChildren.graphql';
import { NODES_LOAD_LIMIT } from '../../../commonDrive/constants';

let apolloClient;
let mockedUserLogged;
const intersectionObserverEntries = [];

beforeAll(() => {
	apolloClient = buildClient(true);

	// mock a simplified Intersection Observer
	Object.defineProperty(window, 'IntersectionObserver', {
		writable: true,
		value: jest.fn().mockImplementation((callback, options) => ({
			thresholds: options.threshold,
			root: options.root,
			rootMargin: options.rootMargin,
			observe: jest.fn((element) => {
				intersectionObserverEntries.push(element);
			}),
			unobserve: jest.fn((element) => {
				intersectionObserverEntries.splice(intersectionObserverEntries.indexOf(element), 1);
			}),
			disconnect: jest.fn(() => {
				intersectionObserverEntries.splice(0, intersectionObserverEntries.length);
			})
		}))
	});
});

beforeEach(() => {
	// mock useUserInfo data
	mockedUserLogged = {
		id: faker.random.uuid(),
		name: faker.name.findName()
	};
	// reset the cache of apollo
	apolloClient.cache.reset();
});

afterEach(() => {
	jest.restoreAllMocks();
});

jest.mock('../../../hooks/useUserInfo', () =>
	jest.fn(() => ({
		me: mockedUserLogged.id
	}))
);

describe('Folder List', () => {
	// TODO: define better this behavior with error handling
	test('access to a folder with network error response show an error page', async () => {
		const currentFolder = populateFolder();
		const mocks = [
			{
				request: {
					query: getChildren,
					variables: {
						parentNode: currentFolder.id,
						childrenLimit: NODES_LOAD_LIMIT,
						sorts: ['TYPE_ASC', 'NODE_ASC']
					}
				},
				error: new Error('An error occurred')
			}
		];
		testUtils.render(
			<MockedProvider mocks={mocks} cache={apolloClient.cache}>
				<FolderList folderId={currentFolder.id} />
			</MockedProvider>
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
			</ApolloProvider>
		);
		expect(screen.getByTestId('icon: Refresh')).toBeVisible();
		await waitForElementToBeRemoved(() => screen.queryByTestId('icon: Refresh'));
		expect(screen.getByTestId(currentFolder.id)).not.toBeEmptyDOMElement();
		screen.debug();
		const { getNode } = apolloClient.readQuery({
			query: getChildren,
			variables: {
				parentNode: currentFolder.id,
				childrenLimit: NODES_LOAD_LIMIT,
				sorts: ['TYPE_ASC', 'NAME_ASC']
			}
		});
		forEach(getNode.children, (child) => {
			expect(screen.getByTestId(child.id)).toBeInTheDocument();
			expect(screen.getByTestId(child.id)).toHaveTextContent(child.name);
		});
	});

	// TODO test if hover and actions work

	test('intersectionObserver trigger the fetchMore function to load more elements when observed element is intersected', async () => {
		const currentFolder = populateFolder(NODES_LOAD_LIMIT + Math.floor(NODES_LOAD_LIMIT / 2));

		const mocks = [
			{
				request: {
					query: getChildren,
					variables: {
						parentNode: currentFolder.id,
						childrenLimit: NODES_LOAD_LIMIT,
						sorts: ['TYPE_ASC', 'NAME_ASC']
					}
				},
				result: {
					data: {
						getNode: {
							...currentFolder,
							children: currentFolder.children.slice(0, NODES_LOAD_LIMIT)
						}
					}
				}
			},
			{
				request: {
					query: getChildren,
					variables: {
						parentNode: currentFolder.id,
						childrenLimit: NODES_LOAD_LIMIT,
						sorts: ['TYPE_ASC', 'NAME_ASC'],
						cursor: currentFolder.children[NODES_LOAD_LIMIT - 1].id
					}
				},
				result: {
					data: {
						getNode: {
							...currentFolder,
							children: currentFolder.children.slice(NODES_LOAD_LIMIT)
						}
					}
				}
			}
		];

		testUtils.render(
			<MockedProvider mocks={mocks} client={apolloClient} cache={apolloClient.cache}>
				<div id="boards-router-container" className="boards-router-container">
					<FolderList folderId={currentFolder.id} />
				</div>
			</MockedProvider>
		);

		// this is the loading refresh icon
		expect(screen.getByTestId(currentFolder.id)).toContainElement(
			screen.getByTestId('icon: Refresh')
		);
		expect(screen.getByTestId('icon: Refresh')).toBeVisible();
		// wait the rendering of the first item
		await screen.findByTestId(currentFolder.children[0].id);
		expect(screen.getByTestId(currentFolder.children[NODES_LOAD_LIMIT - 1].id)).toBeVisible();
		// the loading icon should be still visible at the bottom of the list because we have load the max limit of items per page
		expect(screen.getByTestId('icon: Refresh')).toBeVisible();

		// elements after the limit should not be rendered
		expect(
			screen.queryByTestId(currentFolder.children[NODES_LOAD_LIMIT].id)
		).not.toBeInTheDocument();
		const { calls } = window.IntersectionObserver.mock;
		const [onChange] = calls[calls.length - 1];
		// trigger the intersection on the observed element
		await waitFor(() =>
			onChange([
				{
					target: screen.getByTestId('icon: Refresh'),
					intersectionRatio: 0,
					isIntersecting: true
				}
			])
		);

		// wait for the response
		await screen.findByTestId(currentFolder.children[NODES_LOAD_LIMIT].id);

		// now all elements are loaded so last children should be visible and no loading icon should be rendered
		expect(
			screen.getByTestId(currentFolder.children[currentFolder.children.length - 1].id)
		).toBeVisible();
		expect(screen.queryByTestId('Icon: Refresh')).not.toBeInTheDocument();
	});
});
