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
	act,
	fireEvent,
	screen,
	waitFor,
	waitForElementToBeRemoved,
	within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testUtils } from '@zextras/zapp-shell';
import { SnackbarManager } from '@zextras/zapp-ui';
import forEach from 'lodash/forEach';
import map from 'lodash/map';

import { NODES_LOAD_LIMIT, NODES_SORTS_DEFAULT } from '../../../commonDrive/constants';
import FLAG_NODES from '../../../commonDrive/graphql/mutations/flagNodes.graphql';
import UPDATE_NODE from '../../../commonDrive/graphql/mutations/updateNode.graphql';
import FIND_NODE_NEIGHBOR from '../../../commonDrive/graphql/queries/findNodeNeighbor.graphql';
import FIND_NODES from '../../../commonDrive/graphql/queries/findNodes.graphql';
import {
	populateFile,
	populateNode,
	populateNodes,
	sortNodes
} from '../../../commonDrive/mocks/mockUtils';
import {
	buildBreadCrumbRegExp,
	generateError,
	textWithMarkup
} from '../../../commonDrive/utils/testUtils';
import FilterList from '../../../commonDrive/views/folder/components/FilterList';

describe('Filter list', () => {
	describe('Flagged filter', () => {
		test('first access to a filter show loading state and than show nodes', async () => {
			testUtils.render(
				<ApolloProvider client={global.apolloClient}>
					<FilterList flagged />
				</ApolloProvider>
			);

			expect(screen.getByTestId('icon: Refresh')).toBeVisible();
			await waitForElementToBeRemoved(() =>
				within(screen.getByTestId('list-header')).queryByTestId('icon: Refresh')
			);
			expect(screen.getByTestId(`list-`)).not.toBeEmptyDOMElement();
			const { findNodes } = global.apolloClient.readQuery({
				query: FIND_NODES,
				variables: {
					flagged: true,
					limit: NODES_LOAD_LIMIT,
					sorts: NODES_SORTS_DEFAULT
				}
			});
			forEach(findNodes, (node) => {
				expect(screen.getByTestId(`node-item-${node.id}`)).toBeInTheDocument();
				expect(screen.getByTestId(`node-item-${node.id}`)).toHaveTextContent(node.name);
			});
		});

		test('intersectionObserver trigger the fetchMore function to load more elements when observed element is intersected', async () => {
			const currentFilter = populateNodes(NODES_LOAD_LIMIT + Math.floor(NODES_LOAD_LIMIT / 2));

			const mocks = [
				{
					request: {
						query: FIND_NODES,
						variables: {
							flagged: true,
							limit: NODES_LOAD_LIMIT,
							sorts: NODES_SORTS_DEFAULT
						}
					},
					result: {
						data: {
							findNodes: currentFilter.slice(0, NODES_LOAD_LIMIT)
						}
					}
				},
				{
					request: {
						query: FIND_NODES,
						variables: {
							flagged: true,
							limit: NODES_LOAD_LIMIT,
							sorts: NODES_SORTS_DEFAULT,
							cursor: currentFilter[NODES_LOAD_LIMIT - 1].id
						}
					},
					result: {
						data: {
							findNodes: currentFilter.slice(NODES_LOAD_LIMIT)
						}
					}
				}
			];

			testUtils.render(
				<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
					<div id="boards-router-container" className="boards-router-container">
						<FilterList flagged />
					</div>
				</MockedProvider>
			);

			// this is the loading refresh icon
			expect(screen.getByTestId('list-')).toContainElement(screen.getByTestId('icon: Refresh'));
			expect(screen.getByTestId('icon: Refresh')).toBeVisible();
			// wait the rendering of the first item
			await screen.findByTestId(`node-item-${currentFilter[0].id}`);
			expect(
				screen.getByTestId(`node-item-${currentFilter[NODES_LOAD_LIMIT - 1].id}`)
			).toBeVisible();
			// the loading icon should be still visible at the bottom of the list because we have load the max limit of items per page
			expect(screen.getByTestId('icon: Refresh')).toBeVisible();

			// elements after the limit should not be rendered
			expect(screen.queryByTestId(currentFilter[NODES_LOAD_LIMIT].id)).not.toBeInTheDocument();
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
			await screen.findByTestId(`node-item-${currentFilter[NODES_LOAD_LIMIT].id}`);

			// now all elements are loaded so last node should be visible and no loading icon should be rendered
			expect(
				screen.getByTestId(`node-item-${currentFilter[currentFilter.length - 1].id}`)
			).toBeVisible();
			expect(screen.queryByTestId('Icon: Refresh')).not.toBeInTheDocument();
		});

		test('flagged filter call the findNodes with only flagged parameter set to true', async () => {
			const nodes = [];
			for (let i = 0; i < NODES_LOAD_LIMIT - 1; i += 1) {
				const node = populateNode();
				node.flagged = true;
				nodes.push(node);
			}
			const mocks = [
				{
					request: {
						query: FIND_NODES,
						variables: {
							flagged: true,
							limit: NODES_LOAD_LIMIT,
							sorts: NODES_SORTS_DEFAULT
						}
					},
					result: {
						data: {
							findNodes: nodes
						}
					}
				}
			];

			testUtils.render(
				<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
					<FilterList flagged />
				</MockedProvider>
			);

			await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));

			expect(screen.getAllByTestId('icon: Flag')).toHaveLength(nodes.length);
		});

		test('breadcrumb show Flagged', async () => {
			testUtils.render(
				<ApolloProvider client={global.apolloClient}>
					<FilterList flagged />
				</ApolloProvider>
			);

			await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));

			const breadcrumbRegExp = buildBreadCrumbRegExp('Flagged');
			const getByTextWithMarkup = textWithMarkup(
				within(screen.getByTestId('list-header')).getByText
			);

			expect(getByTextWithMarkup(breadcrumbRegExp)).toBeVisible();
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

			test('Rename is visible when only one file is selected', async () => {
				const nodes = [];
				// enable permission to rename
				for (let i = 0; i < 2; i += 1) {
					const node = populateFile();
					node.permissions.can_write_file = true;
					node.flagged = true;
					nodes.push(node);
				}

				const mocks = [
					{
						request: {
							query: FIND_NODES,
							variables: {
								flagged: true,
								limit: NODES_LOAD_LIMIT,
								sorts: NODES_SORTS_DEFAULT
							}
						},
						result: {
							data: {
								findNodes: nodes
							}
						}
					}
				];

				testUtils.render(
					<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
						<FilterList flagged />
					</MockedProvider>
				);

				// wait for the load to be completed
				await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));

				// activate selection mode by selecting items
				selectNodes(map(nodes, (node) => node.id));
				// check that all wanted items are selected
				expect(screen.getAllByTestId('checkedAvatar')).toHaveLength(nodes.length);
				expect(screen.getByTestId('icon: MoreVertical')).toBeVisible();
				userEvent.click(screen.getByTestId('icon: MoreVertical'));
				// check that the flag action becomes visible
				await screen.findByText(/\bunflag\b/i);
				expect(screen.queryByText(/\brename\b/i)).not.toBeInTheDocument();
			});

			test('Rename is not visible if node does not have permissions', async () => {
				// disable permission to rename
				const node = populateFile();
				node.permissions.can_write_file = false;
				node.flagged = true;

				const mocks = [
					{
						request: {
							query: FIND_NODES,
							variables: {
								flagged: true,
								limit: NODES_LOAD_LIMIT,
								sorts: NODES_SORTS_DEFAULT
							}
						},
						result: {
							data: {
								findNodes: [node]
							}
						}
					}
				];

				testUtils.render(
					<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
						<FilterList flagged />
					</MockedProvider>
				);

				// wait for the load to be completed
				await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));

				// activate selection mode by selecting items
				selectNodes([node.id]);
				// check that all wanted items are selected
				expect(screen.getAllByTestId('checkedAvatar')).toHaveLength(1);
				expect(screen.getByTestId('icon: MoreVertical')).toBeVisible();
				userEvent.click(screen.getByTestId('icon: MoreVertical'));
				// check that the flag action becomes visible
				await screen.findByText(/\bunflag\b/i);
				expect(screen.queryByText(/\brename\b/i)).not.toBeInTheDocument();
			});

			test('Rename operation fail shows an error in the modal and does not close it', async () => {
				const nodes = populateNodes(3, 'Folder');
				// enable permission to rename
				forEach(nodes, (node) => {
					// eslint-disable-next-line no-param-reassign
					node.permissions.can_write_folder = true;
					// eslint-disable-next-line no-param-reassign
					node.flagged = true;
				});
				sortNodes(nodes, NODES_SORTS_DEFAULT);

				// rename first element with name of the second one
				const element = nodes[0];
				const newName = nodes[1].name;

				const mocks = [
					{
						request: {
							query: FIND_NODES,
							variables: {
								flagged: true,
								limit: NODES_LOAD_LIMIT,
								sorts: NODES_SORTS_DEFAULT
							}
						},
						result: {
							data: {
								findNodes: nodes
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
						<FilterList flagged />
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

			test('Rename change node name and update the content of the list, showing the element at its new position', async () => {
				const nodes = populateNodes(5, 'Folder');
				// enable permission to rename
				forEach(nodes, (node) => {
					// eslint-disable-next-line no-param-reassign
					node.permissions.can_write_folder = true;
					// eslint-disable-next-line no-param-reassign
					node.flagged = true;
				});
				sortNodes(nodes, NODES_SORTS_DEFAULT);

				// the element to rename is the first of the list. To assure that it changes position,
				// the new name of the node is going to be the name of the last ordered element without the last character,
				// so it will be placed immediately before it
				const element = nodes[0];
				const lastElementName = nodes[nodes.length - 1].name;
				const newName = lastElementName.substring(0, lastElementName.length - 1);

				const mocks = [
					{
						request: {
							query: FIND_NODES,
							variables: {
								flagged: true,
								limit: NODES_LOAD_LIMIT,
								sorts: NODES_SORTS_DEFAULT
							}
						},
						result: {
							data: {
								findNodes: nodes
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
						// getNeighbor request returns last node of the list to say that the element is now placed before it
						request: {
							query: FIND_NODE_NEIGHBOR,
							variables: {
								flagged: true,
								limit: 1,
								sorts: NODES_SORTS_DEFAULT,
								cursor: element.id
							}
						},
						result: {
							data: {
								findNodes: [nodes[nodes.length - 1]]
							}
						}
					}
				];

				testUtils.render(
					<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
						<FilterList flagged />
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
				userEvent.click(button);
				// wait for the modal to be closed
				await waitForElementToBeRemoved(inputField);
				// check the node. It should have the new name and be at the end of the updated list
				const nodeItem = screen.getByTestId(`node-item-${element.id}`);
				expect(nodeItem).toBeVisible();
				expect(within(nodeItem).getByText(newName)).toBeVisible();
				const nodeItems = screen.getAllByTestId('node-item', { exact: false });
				expect(nodeItems).toHaveLength(nodes.length);
				expect(nodeItems[nodeItems.length - 2]).toBe(nodeItem);
				// selection mode is de-activate
				expect(screen.queryAllByTestId('checkedAvatar')).toHaveLength(0);
				expect(screen.queryByTestId('icon: MoreVertical')).not.toBeInTheDocument();
			});

			test('Unflag action show a success snackbar and remove unflagged nodes form the list', async () => {
				const currentFilter = populateNodes(NODES_LOAD_LIMIT - 1);
				forEach(currentFilter, (node) => {
					// eslint-disable-next-line no-param-reassign
					node.flagged = true;
				});

				const nodesIdsToUnflag = map(
					currentFilter.slice(0, currentFilter.length / 2),
					(item) => item.id
				);

				const mocks = [
					{
						request: {
							query: FIND_NODES,
							variables: {
								flagged: true,
								limit: NODES_LOAD_LIMIT,
								sorts: NODES_SORTS_DEFAULT
							}
						},
						result: {
							data: {
								findNodes: currentFilter
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

				// Warning: Failed prop type: Invalid prop `target` of type `Window` supplied to `ForwardRef(SnackbarFn)`, expected instance of `Window`
				// This warning is printed in the console for this render. This happens because window element is a jsdom representation of the window
				// and it's an object instead of a Window class instance, so the check on the prop type fail for the target prop
				testUtils.render(
					<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
						<SnackbarManager>
							<FilterList flagged />
						</SnackbarManager>
					</MockedProvider>
				);

				// wait for the load to be completed
				await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));
				expect(screen.queryAllByTestId('icon: Flag')).toHaveLength(currentFilter.length);

				// activate selection mode by selecting items
				selectNodes(nodesIdsToUnflag);

				// check that all wanted items are selected
				expect(screen.getAllByTestId('checkedAvatar')).toHaveLength(nodesIdsToUnflag.length);
				expect(screen.getByTestId('icon: MoreVertical')).toBeVisible();
				userEvent.click(screen.getByTestId('icon: MoreVertical'));
				await screen.findByText(/\bunflag\b/i);
				// flag action should not be visible
				expect(screen.queryByText(/\bflag\b/i)).not.toBeInTheDocument();
				// click on unflag action on header bar
				userEvent.click(screen.getByText(/\bunflag\b/i));
				await waitForElementToBeRemoved(screen.queryAllByTestId('checkedAvatar'));
				// wait the snackbar with successful state to appear
				await screen.findByText(/success/gi);
				expect(screen.getAllByTestId('icon: Flag')).toHaveLength(
					currentFilter.length - nodesIdsToUnflag.length
				);
				// unflagged elements are not in the list anymore
				forEach(nodesIdsToUnflag, (nodeId) => {
					expect(screen.queryByTestId(`node-item-${nodeId}`)).not.toBeInTheDocument();
				});
				// wait for the snackbar to be removed
				await waitForElementToBeRemoved(screen.queryByText(/success/gi));
			});
		});

		describe('contextual menu actions', () => {
			test('right click on node open the contextual menu for the node, closing a previously opened one. Left click close it', async () => {
				const nodes = populateNodes(2);
				// set the node not flagged so that we can findNodes by flag action in the contextual menu of first node
				nodes[0].flagged = true;
				// set the second node flagged so that we can findNodes by unflag action in the contextual menu of second node
				nodes[1].flagged = true;

				const mocks = [
					{
						request: {
							query: FIND_NODES,
							variables: {
								flagged: true,
								limit: NODES_LOAD_LIMIT,
								sorts: NODES_SORTS_DEFAULT
							}
						},
						result: {
							data: {
								findNodes: nodes
							}
						}
					}
				];

				testUtils.render(
					<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
						<FilterList flagged />
					</MockedProvider>
				);

				// wait for the load to be completed
				await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));

				// right click to open contextual menu
				const node1Item = screen.getByTestId(`node-item-${nodes[0].id}`);
				const node2Item = screen.getByTestId(`node-item-${nodes[1].id}`);
				fireEvent.contextMenu(node1Item);
				// check that the flag action becomes visible (contextual menu of first node)
				const unflagAction1 = await screen.findByText(/\bunflag\b/i);
				expect(unflagAction1).toBeVisible();
				// right click on second node
				fireEvent.contextMenu(node2Item);
				// check that the unflag action becomes visible (contextual menu of second node)
				const unflagAction2 = await screen.findByText(/\bunflag\b/i);
				expect(unflagAction2).toBeVisible();
				// check that the flag action becomes invisible (contextual menu of first node is closed)
				expect(unflagAction1).not.toBeInTheDocument();
				// left click close all the contextual menu
				userEvent.click(node2Item);

				expect(unflagAction2).not.toBeInTheDocument();
				expect(unflagAction1).not.toBeInTheDocument();
			});

			test('Rename is not visible if node does not have permissions', async () => {
				const node = populateFile();
				node.permissions.can_write_file = false;
				node.flagged = true;

				const mocks = [
					{
						request: {
							query: FIND_NODES,
							variables: {
								flagged: true,
								limit: NODES_LOAD_LIMIT,
								sorts: NODES_SORTS_DEFAULT
							}
						},
						result: {
							data: {
								findNodes: [node]
							}
						}
					}
				];

				testUtils.render(
					<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
						<FilterList flagged />
					</MockedProvider>
				);

				// wait for the load to be completed
				await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));

				// right click to open contextual menu
				const nodeItem = screen.getByTestId(`node-item-${node.id}`);
				// open context menu and click on flag action
				fireEvent.contextMenu(nodeItem);
				// check that the flag action is visible
				await screen.findByText(/\bunflag\b/i);
				// rename is not visible
				expect(screen.queryByText(/\brename\b/i)).not.toBeInTheDocument();
			});

			test('Rename change node name and update the content of the list, showing the element at its new position', async () => {
				const nodes = populateNodes(5, 'File');
				// enable permission to rename
				forEach(nodes, (node) => {
					// eslint-disable-next-line no-param-reassign
					node.permissions.can_write_file = true;
					// eslint-disable-next-line no-param-reassign
					node.flagged = true;
				});
				sortNodes(nodes, NODES_SORTS_DEFAULT);

				// the element to rename is the first of the list. To assure that it changes position,
				// the new name of the node is going to be the name of the last ordered element without the last character
				const element = nodes[0];
				const lastElementName = nodes[nodes.length - 1].name;
				const newName = lastElementName.substring(0, lastElementName.length - 1);

				const mocks = [
					{
						request: {
							query: FIND_NODES,
							variables: {
								flagged: true,
								limit: NODES_LOAD_LIMIT,
								sorts: NODES_SORTS_DEFAULT
							}
						},
						result: {
							data: {
								findNodes: nodes
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
						// getNeighbor request returns last element to say that the element is now placed immediately before it
						request: {
							query: FIND_NODE_NEIGHBOR,
							variables: {
								flagged: true,
								limit: 1,
								sorts: NODES_SORTS_DEFAULT,
								cursor: element.id
							}
						},
						result: {
							data: {
								findNodes: [nodes[nodes.length - 1]]
							}
						}
					}
				];

				testUtils.render(
					<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
						<FilterList flagged />
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
				const nodeItems = screen.getAllByTestId('node-item', { exact: false });
				expect(nodeItems).toHaveLength(nodes.length);
				// element should be the second last in the list
				expect(nodeItems[nodeItems.length - 2]).toBe(updatedNodeItem);
				// contextual menu is closed
				expect(screen.queryByText(/\brename\b/i)).not.toBeInTheDocument();
			});

			test('Unflag action show a success snackbar and remove unflagged nodes form the list', async () => {
				const nodes = populateNodes(2);
				forEach(nodes, (node) => {
					// eslint-disable-next-line no-param-reassign
					node.flagged = true;
				});

				const mocks = [
					{
						request: {
							query: FIND_NODES,
							variables: {
								flagged: true,
								limit: NODES_LOAD_LIMIT,
								sorts: NODES_SORTS_DEFAULT
							}
						},
						result: {
							data: {
								findNodes: nodes
							}
						}
					},
					{
						request: {
							query: FLAG_NODES,
							variables: {
								nodes_ids: [nodes[0].id],
								flag: false
							}
						},
						result: {
							data: {
								flagNodes: [nodes[0].id]
							}
						}
					}
				];

				// Warning: Failed prop type: Invalid prop `target` of type `Window` supplied to `ForwardRef(SnackbarFn)`, expected instance of `Window`
				// This warning is printed in the console for this render. This happens because window element is a jsdom representation of the window
				// and it's an object instead of a Window class instance, so the check on the prop type fail for the target prop
				testUtils.render(
					<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
						<SnackbarManager>
							<FilterList flagged />
						</SnackbarManager>
					</MockedProvider>
				);

				// wait for the load to be completed
				await waitForElementToBeRemoved(screen.queryByTestId('icon: Refresh'));
				expect(screen.queryAllByTestId('icon: Flag')).toHaveLength(nodes.length);

				// right click to open contextual menu on first node
				const nodeItem = screen.getByTestId(`node-item-${nodes[0].id}`);
				// open context menu and click on unflag action
				fireEvent.contextMenu(nodeItem);
				const unflagAction = await screen.findByText(/\bunflag\b/i);
				expect(unflagAction).toBeVisible();
				act(() => {
					userEvent.click(unflagAction);
				});
				// wait the snackbar with successful state to appear
				expect(unflagAction).not.toBeInTheDocument();
				await screen.findByText(/success/gi);
				expect(screen.getAllByTestId('icon: Flag')).toHaveLength(nodes.length - 1);
				// unflagged element is not in the list anymore
				expect(screen.queryByTestId(`node-item-${nodes[0].id}`)).not.toBeInTheDocument();
				// wait for the snackbar to be removed
				await waitForElementToBeRemoved(screen.queryByText(/success/gi));
			});
		});
	});
});
