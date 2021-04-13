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

import { ApolloProvider } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import {
	fireEvent,
	screen,
	waitFor,
	waitForElementToBeRemoved,
	within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testUtils } from '@zextras/zapp-shell';
import faker from 'faker';
import forEach from 'lodash/forEach';
import map from 'lodash/map';

import { NODES_LOAD_LIMIT, NODES_SORTS_DEFAULT } from '../../../commonDrive/constants';
import CREATE_FOLDER from '../../../commonDrive/graphql/mutations/createFolder.graphql';
import FLAG_NODES from '../../../commonDrive/graphql/mutations/flagNodes.graphql';
import UPDATE_NODE from '../../../commonDrive/graphql/mutations/updateNode.graphql';
import GET_CHILD_NEIGHBOR from '../../../commonDrive/graphql/queries/getChildNeighbor.graphql';
import GET_CHILDREN from '../../../commonDrive/graphql/queries/getChildren.graphql';
import { populateFolder, populateNode, sortNodes } from '../../../commonDrive/mocks/mockUtils';
import { NodeSort } from '../../../commonDrive/types/graphql/types';
import { generateError } from '../../../commonDrive/utils/testUtils';
import FolderList from '../../../commonDrive/views/folder/components/FolderList';

let mockedUserLogged;

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
				error: generateError('An error occurred')
			}
		];
		testUtils.render(
			<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
				<FolderList folderId={currentFolder.id} />
			</MockedProvider>
		);

		await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));
		await screen.findByText(/Error/g);
		expect(screen.getByText(/An error occurred/g)).toBeVisible();
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
		expect(screen.getByTestId(`list-${currentFolder.id}`)).not.toBeEmptyDOMElement();
		const { getNode } = global.apolloClient.readQuery({
			query: GET_CHILDREN,
			variables: {
				parentNode: currentFolder.id,
				childrenLimit: NODES_LOAD_LIMIT,
				sorts: NODES_SORTS_DEFAULT
			}
		});
		forEach(getNode.children, (child) => {
			expect(screen.getByTestId(`node-item-${child.id}`)).toBeInTheDocument();
			expect(screen.getByTestId(`node-item-${child.id}`)).toHaveTextContent(child.name);
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
			<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
				<div id="boards-router-container" className="boards-router-container">
					<FolderList folderId={currentFolder.id} />
				</div>
			</MockedProvider>
		);

		// this is the loading refresh icon
		expect(screen.getByTestId(`list-${currentFolder.id}`)).toContainElement(
			screen.getByTestId('icon: Refresh')
		);
		expect(screen.getByTestId('icon: Refresh')).toBeVisible();
		// wait the rendering of the first item
		await screen.findByTestId(`node-item-${currentFolder.children[0].id}`);
		expect(
			screen.getByTestId(`node-item-${currentFolder.children[NODES_LOAD_LIMIT - 1].id}`)
		).toBeVisible();
		// the loading icon should be still visible at the bottom of the list because we have load the max limit of items per page
		expect(screen.getByTestId('icon: Refresh')).toBeVisible();

		// elements after the limit should not be rendered
		expect(
			screen.queryByTestId(`node-item-${currentFolder.children[NODES_LOAD_LIMIT].id}`)
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
		await screen.findByTestId(`node-item-${currentFolder.children[NODES_LOAD_LIMIT].id}`);

		// now all elements are loaded so last children should be visible and no loading icon should be rendered
		expect(
			screen.getByTestId(
				`node-item-${currentFolder.children[currentFolder.children.length - 1].id}`
			)
		).toBeVisible();
		expect(screen.queryByTestId('Icon: Refresh')).not.toBeInTheDocument();
	});

	test('Create folder operation fail shows an error in the modal and does not close it', async () => {
		const currentFolder = populateFolder();
		currentFolder.permissions.can_write_folder = true;
		const node1 = populateFolder(0, 'n1', 'first');
		const node2 = populateFolder(0, 'n2', 'second');
		const node3 = populateFolder(0, 'n3', 'third');
		currentFolder.children.push(node1, node2, node3);

		const newName = node2.name;

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
						getNode: currentFolder
					}
				}
			},
			{
				request: {
					query: CREATE_FOLDER,
					variables: {
						parentId: currentFolder.id,
						name: newName
					}
				},
				error: generateError('Error! Name already assigned')
			}
		];

		// simulate the creation of a new folder
		testUtils.render(
			<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
				<FolderList folderId={currentFolder.id} newFolder />
			</MockedProvider>
		);

		// wait for the load to be completed
		await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));
		expect(screen.getAllByTestId('node-item', { exact: false })).toHaveLength(
			currentFolder.children.length
		);
		// wait for the creation modal to be opened
		const inputFieldDiv = await screen.findByTestId('input-name');
		const inputField = within(inputFieldDiv).getByRole('textbox');
		expect(inputField).toHaveValue('');
		userEvent.type(inputField, newName);
		expect(inputField).toHaveValue(newName);
		const button = screen.getByRole('button', { name: /create/i });
		userEvent.click(button);
		const error = await screen.findByText('Error! Name already assigned');
		expect(error).toBeVisible();
		expect(inputField).toBeVisible();
		expect(inputField).toHaveValue(newName);
		expect(screen.getAllByTestId('node-item', { exact: false })).toHaveLength(
			currentFolder.children.length
		);
	});

	test('Create folder add folder node at folder content, showing the element at its right position', async () => {
		const currentFolder = populateFolder();
		currentFolder.permissions.can_write_folder = true;
		const node1 = populateFolder(0, 'n1', 'first');
		const node2 = populateFolder(0, 'n2', 'second');
		const node3 = populateFolder(0, 'n3', 'third');
		// add node 1 and 3 as children, node 2 is the new folder
		currentFolder.children.push(node1, node3);

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
						getNode: currentFolder
					}
				}
			},
			{
				request: {
					query: CREATE_FOLDER,
					variables: {
						parentId: currentFolder.id,
						name: node2.name
					}
				},
				result: {
					data: {
						createFolder: node2
					}
				}
			},
			{
				// getNeighbor request returns node3 to say that the new folder is positioned before this node
				request: {
					query: GET_CHILD_NEIGHBOR,
					variables: {
						parentNode: currentFolder.id,
						childrenLimit: 1,
						sorts: NODES_SORTS_DEFAULT,
						cursor: node2.id
					}
				},
				result: {
					data: {
						getNode: {
							id: currentFolder.id,
							name: currentFolder.name,
							children: [node3]
						}
					}
				}
			}
		];

		// simulate the creation of a new folder
		testUtils.render(
			<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
				<FolderList folderId={currentFolder.id} newFolder />
			</MockedProvider>
		);

		// wait for the load to be completed
		await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));
		expect(screen.getAllByTestId('node-item', { exact: false })).toHaveLength(
			currentFolder.children.length
		);
		// wait for the creation modal to be opened
		const inputFieldDiv = await screen.findByTestId('input-name');
		const inputField = within(inputFieldDiv).getByRole('textbox');
		expect(inputField).toHaveValue('');
		userEvent.type(inputField, node2.name);
		expect(inputField).toHaveValue(node2.name);
		const button = screen.getByRole('button', { name: /create/i });
		userEvent.click(button);
		const nodeItem = await screen.findByTestId(`node-item-${node2.id}`);
		// the modal is closed
		expect(inputFieldDiv).not.toBeInTheDocument();
		expect(nodeItem).toBeVisible();
		expect(within(nodeItem).getByText(node2.name)).toBeVisible();
		const nodes = screen.getAllByTestId('node-item', { exact: false });
		expect(nodes).toHaveLength(currentFolder.children.length + 1);
		expect(nodes[1]).toBe(nodeItem);
	});

	describe('Selection mode', () => {
		function selectNodes(nodesToSelect) {
			forEach(nodesToSelect, (id, index) => {
				const node = within(screen.getByTestId(`node-item-${id}`));
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

		test('Rename is visible when only one file is selected', async () => {
			const currentFolder = populateFolder(0);
			// enable permission to rename
			for (let i = 0; i < 2; i += 1) {
				const node = populateNode();
				node.permissions.can_write_file = true;
				node.permissions.can_write_folder = true;
				node.flagged = false;
				currentFolder.children.push(node);
			}

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
							getNode: currentFolder
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

			// activate selection mode by selecting items
			selectNodes(map(currentFolder.children, (node) => node.id));
			// check that all wanted items are selected
			expect(screen.getAllByTestId('checkedAvatar')).toHaveLength(currentFolder.children.length);
			expect(screen.getByTestId('icon: MoreVertical')).toBeVisible();
			userEvent.click(screen.getByTestId('icon: MoreVertical'));
			// check that the flag action becomes visible
			await screen.findByText(/\bflag\b/i);
			expect(screen.queryByText(/\brename\b/i)).not.toBeInTheDocument();
		});

		test('Rename is not visible if node does not have permissions', async () => {
			const currentFolder = populateFolder();
			// disable permission to rename
			const node = populateNode();
			node.permissions.can_write_file = false;
			node.permissions.can_write_folder = false;
			node.flagged = false;
			currentFolder.children.push(node);

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
							getNode: currentFolder
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

			// activate selection mode by selecting items
			selectNodes([node.id]);
			// check that all wanted items are selected
			expect(screen.getAllByTestId('checkedAvatar')).toHaveLength(currentFolder.children.length);
			expect(screen.getByTestId('icon: MoreVertical')).toBeVisible();
			userEvent.click(screen.getByTestId('icon: MoreVertical'));
			// check that the flag action becomes visible
			await screen.findByText(/\bflag\b/i);
			expect(screen.queryByText(/\brename\b/i)).not.toBeInTheDocument();
		});

		test('Rename operation fail shows an error in the modal and does not close it', async () => {
			const currentFolder = populateFolder(2);
			// enable permission to rename
			forEach(currentFolder.children, (node) => {
				// eslint-disable-next-line no-param-reassign
				node.permissions.can_write_file = true;
				// eslint-disable-next-line no-param-reassign
				node.permissions.can_write_folder = true;
			});
			const sorts = [NodeSort.NameAsc]; // sort only by name
			sortNodes(currentFolder.children, sorts);

			// rename first element with name of the second one
			const element = currentFolder.children[0];
			const newName = currentFolder.children[1].name;

			const mocks = [
				{
					request: {
						query: GET_CHILDREN,
						variables: {
							parentNode: currentFolder.id,
							childrenLimit: NODES_LOAD_LIMIT,
							// request ask for default sort, but the response will return elements sorted by name for simplicity
							sorts: NODES_SORTS_DEFAULT
						}
					},
					result: {
						data: {
							getNode: currentFolder
						}
					}
				},
				{
					request: {
						query: UPDATE_NODE,
						variables: {
							id: element.id,
							name: newName
						}
					},
					error: generateError('Error! Name already assigned')
				}
			];

			testUtils.render(
				<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
					<FolderList folderId={currentFolder.id} />
				</MockedProvider>
			);

			// wait for the load to be completed
			await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));

			// activate selection mode by selecting items
			selectNodes([element.id]);
			// check that all wanted items are selected
			expect(screen.getAllByTestId('checkedAvatar')).toHaveLength(1);
			expect(screen.getByTestId('icon: MoreVertical')).toBeVisible();
			userEvent.click(screen.getByTestId('icon: MoreVertical'));
			// check that the rename action becomes visible
			await screen.findByText(/\brename\b/i);
			userEvent.click(screen.getByText(/\brename\b/i));
			const inputFieldDiv = await screen.findByTestId('input-name');
			const inputField = within(inputFieldDiv).getByRole('textbox');
			userEvent.clear(inputField);
			userEvent.type(inputField, newName);
			expect(inputField).toHaveValue(newName);
			const button = screen.getByRole('button', { name: /rename/i });
			userEvent.click(within(button).getByText(/rename/i));
			const error = await screen.findByText('Error! Name already assigned');
			expect(error).toBeVisible();
			expect(inputField).toBeVisible();
			expect(inputField).toHaveValue(newName);
		});

		test('Rename change node name and update the content of the folder, showing the element at its new position', async () => {
			const currentFolder = populateFolder(5);
			// enable permission to rename
			forEach(currentFolder.children, (node) => {
				// eslint-disable-next-line no-param-reassign
				node.permissions.can_write_file = true;
				// eslint-disable-next-line no-param-reassign
				node.permissions.can_write_folder = true;
			});
			const sorts = [NodeSort.NameAsc]; // sort only by name
			sortNodes(currentFolder.children, sorts);

			// the element to rename is the first of the list. To assure that it changes position,
			// the new name of the node is going to be the name of the last ordered element with the timestamp at the end
			const timestamp = Date.now();
			const element = currentFolder.children[0];
			const newName = `${
				currentFolder.children[currentFolder.children.length - 1].name
			}-${timestamp}`;

			const mocks = [
				{
					request: {
						query: GET_CHILDREN,
						variables: {
							parentNode: currentFolder.id,
							childrenLimit: NODES_LOAD_LIMIT,
							// request ask for default sort, but the response will return elements sorted by name for simplicity
							sorts: NODES_SORTS_DEFAULT
						}
					},
					result: {
						data: {
							getNode: currentFolder
						}
					}
				},
				{
					request: {
						query: UPDATE_NODE,
						variables: {
							id: element.id,
							name: newName
						}
					},
					result: {
						data: {
							updateNode: {
								...element,
								name: newName
							}
						}
					}
				},
				{
					// getNeighbor request returns an empty array of children to say that the element is now at the end of the list
					request: {
						query: GET_CHILD_NEIGHBOR,
						variables: {
							parentNode: currentFolder.id,
							childrenLimit: 1,
							sorts: NODES_SORTS_DEFAULT,
							cursor: element.id
						}
					},
					result: {
						data: {
							getNode: {
								id: currentFolder.id,
								name: currentFolder.name,
								children: []
							}
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

			// activate selection mode by selecting items
			selectNodes([element.id]);
			// check that all wanted items are selected
			expect(screen.getAllByTestId('checkedAvatar')).toHaveLength(1);
			expect(screen.getByTestId('icon: MoreVertical')).toBeVisible();
			userEvent.click(screen.getByTestId('icon: MoreVertical'));
			// check that the rename action becomes visible
			await screen.findByText(/\brename\b/i);
			userEvent.click(screen.getByText(/\brename\b/i));
			// wait for the modal to open and fill the input field with the new name
			const inputFieldDiv = await screen.findByTestId('input-name');
			const inputField = within(inputFieldDiv).getByRole('textbox');
			userEvent.clear(inputField);
			userEvent.type(inputField, newName);
			expect(inputField).toHaveValue(newName);
			// click on confirm button (rename)
			const button = screen.getByRole('button', { name: /rename/i });
			userEvent.click(within(button).getByText(/rename/i));
			// wait for the modal to be closed
			await waitForElementToBeRemoved(inputField);
			// check the node. It should have the new name and be at the end of the updated list
			const nodeItem = screen.getByTestId(`node-item-${element.id}`);
			expect(nodeItem).toBeVisible();
			expect(within(nodeItem).getByText(newName)).toBeVisible();
			const nodes = screen.getAllByTestId('node-item', { exact: false });
			expect(nodes).toHaveLength(currentFolder.children.length);
			expect(nodes[nodes.length - 1]).toBe(nodeItem);
			// selection mode is de-activate
			expect(screen.queryAllByTestId('checkedAvatar')).toHaveLength(0);
			expect(screen.queryByTestId('icon: MoreVertical')).not.toBeInTheDocument();
		});
	});

	describe('Contextual menu actions', () => {
		test('right click on node open the contextual menu for the node, closing a previously opened one. Left click close it', async () => {
			const currentFolder = populateFolder();
			const node1 = populateNode();
			// set the node not flagged so that we can search by flag action in the contextual menu of first node
			node1.flagged = false;
			currentFolder.children.push(node1);
			const node2 = populateNode();
			// set the second node flagged so that we can search by unflag action in the contextual menu of second node
			node2.flagged = true;
			currentFolder.children.push(node2);

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
							getNode: currentFolder
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

			// right click to open contextual menu
			const node1Item = screen.getByTestId(`node-item-${node1.id}`);
			const node2Item = screen.getByTestId(`node-item-${node2.id}`);
			fireEvent.contextMenu(node1Item);
			// check that the flag action becomes visible (contextual menu of first node)
			const flagAction = await screen.findByText(/\bflag\b/i);
			expect(flagAction).toBeVisible();
			// right click on second node
			fireEvent.contextMenu(node2Item);
			// check that the unflag action becomes visible (contextual menu of second node)
			const unflagAction = await screen.findByText(/\bunflag\b/i);
			expect(unflagAction).toBeVisible();
			// check that the flag action becomes invisible (contextual menu of first node is closed)
			expect(flagAction).not.toBeInTheDocument();
			// left click close all the contextual menu
			userEvent.click(node2Item);

			expect(unflagAction).not.toBeInTheDocument();
			expect(flagAction).not.toBeInTheDocument();
		});

		test('click on flag action changes flag icon visibility', async () => {
			const currentFolder = populateFolder();
			const node = populateNode();
			// set the node not flagged so that we can search by flag action in the contextual menu of first node
			node.flagged = false;
			currentFolder.children.push(node);

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
							getNode: currentFolder
						}
					}
				},
				{
					request: {
						query: FLAG_NODES,
						variables: {
							nodes_ids: [node.id],
							flag: true
						}
					},
					result: {
						data: {
							flagNodes: [node.id]
						}
					}
				},
				{
					request: {
						query: FLAG_NODES,
						variables: {
							nodes_ids: [node.id],
							flag: false
						}
					},
					result: {
						data: {
							flagNodes: [node.id]
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

			// right click to open contextual menu
			const nodeItem = screen.getByTestId(`node-item-${node.id}`);
			// open context menu and click on flag action
			fireEvent.contextMenu(nodeItem);
			const flagAction = await screen.findByText(/\bflag\b/i);
			expect(flagAction).toBeVisible();
			userEvent.click(flagAction);
			expect(flagAction).not.toBeInTheDocument();
			await within(nodeItem).findByTestId('icon: Flag');
			expect(within(nodeItem).getByTestId('icon: Flag')).toBeVisible();
			// open context menu and click on unflag action
			fireEvent.contextMenu(nodeItem);
			const unflagAction = await screen.findByText(/\bunflag\b/i);
			expect(unflagAction).toBeVisible();
			userEvent.click(unflagAction);
			expect(unflagAction).not.toBeInTheDocument();
			await waitForElementToBeRemoved(within(nodeItem).queryByTestId('icon: Flag'));
			expect(within(nodeItem).queryByTestId('icon: Flag')).not.toBeInTheDocument();
		});

		test('Rename is not visible if node does not have permissions', async () => {
			const currentFolder = populateFolder();
			const node = populateNode();
			node.permissions.can_write_file = false;
			node.permissions.can_write_folder = false;
			node.flagged = false;
			currentFolder.children.push(node);

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
							getNode: currentFolder
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

			// right click to open contextual menu
			const nodeItem = screen.getByTestId(`node-item-${node.id}`);
			// open context menu and click on flag action
			fireEvent.contextMenu(nodeItem);
			// check that the flag action is visible
			await screen.findByText(/\bflag\b/i);
			// rename is not visible
			expect(screen.queryByText(/\brename\b/i)).not.toBeInTheDocument();
		});

		test('Rename change node name and update the content of the folder, showing the element at its new position', async () => {
			const currentFolder = populateFolder(5);
			// enable permission to rename
			forEach(currentFolder.children, (node) => {
				// eslint-disable-next-line no-param-reassign
				node.permissions.can_write_file = true;
				// eslint-disable-next-line no-param-reassign
				node.permissions.can_write_folder = true;
			});
			const sorts = [NodeSort.NameAsc]; // sort only by name
			sortNodes(currentFolder.children, sorts);

			// the element to rename is the first of the list. To assure that it changes position,
			// the new name of the node is going to be the name of the last ordered element with the timestamp at the end
			const timestamp = Date.now();
			const element = currentFolder.children[0];
			const newName = `${
				currentFolder.children[currentFolder.children.length - 1].name
			}-${timestamp}`;

			const mocks = [
				{
					request: {
						query: GET_CHILDREN,
						variables: {
							parentNode: currentFolder.id,
							childrenLimit: NODES_LOAD_LIMIT,
							// request ask for default sort, but the response will return elements sorted by name for simplicity
							sorts: NODES_SORTS_DEFAULT
						}
					},
					result: {
						data: {
							getNode: currentFolder
						}
					}
				},
				{
					request: {
						query: UPDATE_NODE,
						variables: {
							id: element.id,
							name: newName
						}
					},
					result: {
						data: {
							updateNode: {
								...element,
								name: newName
							}
						}
					}
				},
				{
					// getNeighbor request returns an empty array of children to say that the element is now at the end of the list
					request: {
						query: GET_CHILD_NEIGHBOR,
						variables: {
							parentNode: currentFolder.id,
							childrenLimit: 1,
							sorts: NODES_SORTS_DEFAULT,
							cursor: element.id
						}
					},
					result: {
						data: {
							getNode: {
								id: currentFolder.id,
								name: currentFolder.name,
								children: []
							}
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

			// right click to open contextual menu
			const nodeItem = screen.getByTestId(`node-item-${element.id}`);
			// open context menu
			fireEvent.contextMenu(nodeItem);
			// check that the rename action becomes visible and click on it
			await screen.findByText(/\brename\b/i);
			userEvent.click(screen.getByText(/\brename\b/i));
			// fill new name in modal input field
			const inputFieldDiv = await screen.findByTestId('input-name');
			const inputField = within(inputFieldDiv).getByRole('textbox');
			userEvent.clear(inputField);
			userEvent.type(inputField, newName);
			expect(inputField).toHaveValue(newName);
			// click on confirm button (rename)
			const button = screen.getByRole('button', { name: /rename/i });
			userEvent.click(within(button).getByText(/rename/i));
			// wait that the modal close
			await waitForElementToBeRemoved(inputField);
			// check the new item. It has the new name and its located as last element of the updated list
			const updatedNodeItem = screen.getByTestId(`node-item-${element.id}`);
			expect(updatedNodeItem).toBeVisible();
			expect(within(updatedNodeItem).getByText(newName)).toBeVisible();
			const nodes = screen.getAllByTestId('node-item', { exact: false });
			expect(nodes).toHaveLength(currentFolder.children.length);
			expect(nodes[nodes.length - 1]).toBe(updatedNodeItem);
			// contextual menu is closed
			expect(screen.queryByText(/\brename\b/i)).not.toBeInTheDocument();
		});
	});
});
