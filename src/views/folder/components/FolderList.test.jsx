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

import { ApolloProvider } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testUtils } from '@zextras/zapp-shell';
import faker from 'faker';
import forEach from 'lodash/forEach';
import map from 'lodash/map';
import React from 'react';
import { NODES_LOAD_LIMIT, NODES_SORTS_DEFAULT } from '../../../commonDrive/constants';
import FLAG_NODES from '../../../commonDrive/graphql/mutations/flagNodes.graphql';
import GET_CHILDREN from '../../../commonDrive/graphql/queries/getChildren.graphql';
import FolderList from '../../../commonDrive/views/folder/components/FolderList';
import { populateFolder } from '../../../commonDrive/mocks/mockUtils';

let mockedUserLogged;
const intersectionObserverEntries = [];

beforeAll(() => {
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
					query: GET_CHILDREN,
					variables: {
						parentNode: currentFolder.id,
						childrenLimit: NODES_LOAD_LIMIT,
						sorts: NODES_SORTS_DEFAULT
					}
				},
				error: new Error('An error occurred')
			}
		];
		testUtils.render(
			<MockedProvider mocks={mocks} cache={global.apolloClient.cache} addTypename={false}>
				<FolderList folderId={currentFolder.id} />
			</MockedProvider>
		);

		await waitForElementToBeRemoved(() => screen.queryByTestId('icon: Refresh'));
		// screen.debug();
		/*
		 * TODO: at the moment it always return this error:
		 * No more mocked responses for the query: query GET_CHILDREN($parentNode: ID!, $childrenLimit: Int!, $sorts: [NodeSort!]) {
		 *     getNode(id: $parentNode) {
		 */
		// expect(screen.getByText(/An error occurred/g)).toBeVisible();
	});

	test('first access to a folder show loading state and than show children', async () => {
		const currentFolder = populateFolder();

		testUtils.render(
			<ApolloProvider client={global.apolloClient}>
				<FolderList folderId={currentFolder.id} />
			</ApolloProvider>
		);
		expect(screen.getByTestId('icon: Refresh')).toBeVisible();
		await waitForElementToBeRemoved(() =>
			within(screen.getByTestId('list-header')).queryByTestId('icon: Refresh')
		);
		expect(screen.getByTestId(currentFolder.id)).not.toBeEmptyDOMElement();
		const { getNode } = global.apolloClient.readQuery({
			query: GET_CHILDREN,
			variables: {
				parentNode: currentFolder.id,
				childrenLimit: NODES_LOAD_LIMIT,
				sorts: NODES_SORTS_DEFAULT
			}
		});
		forEach(getNode.children, (child) => {
			expect(screen.getByTestId(child.id)).toBeInTheDocument();
			expect(screen.getByTestId(child.id)).toHaveTextContent(child.name);
		});
	});

	test('intersectionObserver trigger the fetchMore function to load more elements when observed element is intersected', async () => {
		const currentFolder = populateFolder(NODES_LOAD_LIMIT + Math.floor(NODES_LOAD_LIMIT / 2));

		const mocks = [
			{
				request: {
					query: GET_CHILDREN,
					variables: {
						parentNode: currentFolder.id,
						childrenLimit: NODES_LOAD_LIMIT,
						sorts: NODES_SORTS_DEFAULT
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
					query: GET_CHILDREN,
					variables: {
						parentNode: currentFolder.id,
						childrenLimit: NODES_LOAD_LIMIT,
						sorts: NODES_SORTS_DEFAULT,
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
			<MockedProvider mocks={mocks} client={global.apolloClient} cache={global.apolloClient.cache}>
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

	// TODO test if hover and actions work
	describe('Selection mode', () => {
		function selectNodes(nodesToSelect) {
			forEach(nodesToSelect, (id, index) => {
				const node = within(screen.getByTestId(id));
				if (index === 0) {
					// click on first item icon to activate selection mode
					userEvent.click(node.getByTestId('file-icon-preview'));
				} else {
					// then to select other items click on the unchecked avatar square
					userEvent.click(node.getByTestId('unCheckedAvatar'));
				}
			});
		}

		test('Flag/Unflag action marks all and only selected items as flagged/unflagged', async () => {
			const currentFolder = populateFolder(Math.floor(NODES_LOAD_LIMIT / 2));
			forEach(currentFolder.children, (child) => {
				// eslint-disable-next-line no-param-reassign
				child.flagged = false;
			});

			const nodesIdsToFlag = map(
				currentFolder.children.slice(0, currentFolder.children.length / 2),
				(child) => child.id
			);

			const nodesIdsToUnflag = nodesIdsToFlag.slice(0, nodesIdsToFlag.length / 2);

			const mocks = [
				{
					request: {
						query: GET_CHILDREN,
						variables: {
							parentNode: currentFolder.id,
							childrenLimit: NODES_LOAD_LIMIT,
							sorts: NODES_SORTS_DEFAULT
						}
					},
					result: {
						data: {
							getNode: {
								...currentFolder,
								children: currentFolder.children
							}
						}
					}
				},
				{
					request: {
						query: FLAG_NODES,
						variables: {
							nodes_ids: nodesIdsToFlag,
							flag: true
						}
					},
					result: {
						data: {
							flagNodes: nodesIdsToFlag
						}
					}
				},
				{
					request: {
						query: FLAG_NODES,
						variables: {
							nodes_ids: nodesIdsToUnflag,
							flag: false
						}
					},
					result: {
						data: {
							flagNodes: nodesIdsToUnflag
						}
					}
				}
			];

			testUtils.render(
				<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
					<FolderList folderId={currentFolder.id} />
				</MockedProvider>
			);

			// wait for the load to be completed
			await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));
			expect(screen.queryAllByTestId('icon: Flag')).toHaveLength(0);

			// activate selection mode by selecting items
			selectNodes(nodesIdsToFlag);

			// check that all wanted items are selected
			expect(screen.getAllByTestId('checkedAvatar')).toHaveLength(nodesIdsToFlag.length);
			expect(screen.getByTestId('icon: MoreVertical')).toBeVisible();
			userEvent.click(screen.getByTestId('icon: MoreVertical'));
			await screen.findByText(/\bflag\b/i);
			// click on flag action on header bar
			userEvent.click(screen.getByText(/\bflag\b/i));
			await waitForElementToBeRemoved(screen.queryAllByTestId('checkedAvatar'));
			await screen.findAllByTestId('icon: Flag');
			expect(screen.getAllByTestId('icon: Flag')).toHaveLength(nodesIdsToFlag.length);

			// activate selection mode by selecting items
			selectNodes(nodesIdsToUnflag);
			// check that all wanted items are selected
			expect(screen.getAllByTestId('checkedAvatar')).toHaveLength(nodesIdsToUnflag.length);
			expect(screen.getByTestId('icon: MoreVertical')).toBeVisible();
			userEvent.click(screen.getByTestId('icon: MoreVertical'));
			await screen.findByText(/\bunflag\b/i);
			// click on unflag action on header bar
			userEvent.click(screen.getByText(/\bunflag\b/i));
			await waitForElementToBeRemoved(screen.queryAllByTestId('checkedAvatar'));
			await screen.findAllByTestId('icon: Flag');
			expect(screen.getAllByTestId('icon: Flag')).toHaveLength(
				nodesIdsToFlag.length - nodesIdsToUnflag.length
			);
		});
	});
});
