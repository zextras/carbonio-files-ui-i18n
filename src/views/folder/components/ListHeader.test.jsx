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

import { MockedProvider } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testUtils } from '@zextras/zapp-shell';
import { map } from 'lodash';
import React from 'react';
import GET_PARENT from '../../../commonDrive/graphql/queries/getParent.graphql';
import GET_PATH from '../../../commonDrive/graphql/queries/getPath.graphql';
import { buildBreadCrumbRegExp, textWithMarkup } from '../../../commonDrive/utils/testUtils';
import { buildCrumbs } from '../../../commonDrive/utils/utils';
import ListHeader from '../../../commonDrive/views/folder/components/ListHeader';
import { populateFolder, populateParents } from '../../../commonDrive/mocks/mockUtils';

describe('ListHeader', () => {
	describe('Breadcrumb', () => {
		test('show only current folder if it has not a parent', async () => {
			const currentFolder = populateFolder();
			const mocks = [
				{
					request: {
						query: GET_PARENT,
						variables: {
							id: currentFolder.id
						}
					},
					result: {
						data: {
							getNode: {
								id: currentFolder.id,
								name: currentFolder.name,
								__typename: currentFolder.__typename,
								parent: null
							}
						}
					}
				}
			];

			testUtils.render(
				<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
					<ListHeader folderId={currentFolder.id} />
				</MockedProvider>
			);

			await screen.findByText((content) => content.includes(currentFolder.name));

			const getByTextWithMarkup = textWithMarkup(screen.getByText);
			const breadcrumbRegExp = buildBreadCrumbRegExp(currentFolder.name);
			expect(getByTextWithMarkup(breadcrumbRegExp)).toBeVisible();
		});

		test('by default shows two level (current folder and its parent)', async () => {
			const { node: currentFolder } = populateParents(populateFolder(), 5);
			const mocks = [
				{
					request: {
						query: GET_PARENT,
						variables: {
							id: currentFolder.id
						}
					},
					result: {
						data: {
							getNode: {
								id: currentFolder.id,
								name: currentFolder.name,
								__typename: currentFolder.__typename,
								parent: {
									id: currentFolder.parent.id,
									name: currentFolder.parent.name,
									__typename: currentFolder.parent.__typename,
									parent: {
										id: currentFolder.parent.parent.id,
										__typename: currentFolder.parent.parent.__typename
									}
								}
							}
						}
					}
				}
			];

			testUtils.render(
				<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
					<ListHeader folderId={currentFolder.id} />
				</MockedProvider>
			);

			await screen.findByText((content) => content.includes(currentFolder.name));

			const getByTextWithMarkup = textWithMarkup(screen.getByText);
			const breadcrumbRegExp = buildBreadCrumbRegExp(currentFolder.parent.name, currentFolder.name);
			expect(getByTextWithMarkup(breadcrumbRegExp)).toBeVisible();
		});

		test('consecutive clicks on the cta expand and collapse the path with a single API request to retrieve the full path', async () => {
			const { node: currentFolder, path } = populateParents(populateFolder(), 5);
			const mocks = [
				{
					request: {
						query: GET_PARENT,
						variables: {
							id: currentFolder.id
						}
					},
					result: {
						data: {
							getNode: {
								id: currentFolder.id,
								name: currentFolder.name,
								__typename: currentFolder.__typename,
								parent: {
									id: currentFolder.parent.id,
									name: currentFolder.parent.name,
									__typename: currentFolder.parent.__typename,
									parent: {
										id: currentFolder.parent.parent.id,
										__typename: currentFolder.parent.parent.__typename
									}
								}
							}
						}
					}
				},
				{
					request: {
						query: GET_PATH,
						variables: {
							id: currentFolder.id
						}
					},
					result: {
						data: {
							getPath: path
						}
					}
				}
			];

			testUtils.render(
				<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
					<ListHeader folderId={currentFolder.id} />
				</MockedProvider>
			);

			const getByTextWithMarkup = textWithMarkup(screen.getByText);
			const shortBreadcrumbRegExp = buildBreadCrumbRegExp(
				currentFolder.parent.name,
				currentFolder.name
			);
			const crumbs = buildCrumbs(currentFolder);
			const fullBreadcrumbRegExp = buildBreadCrumbRegExp(...map(crumbs, (crumb) => crumb.label));

			// wait for the breadcrumb to be loaded
			await screen.findByText((content) => content.includes(currentFolder.name));
			// by default only 2 levels are shown
			expect(getByTextWithMarkup(shortBreadcrumbRegExp)).toBeVisible();
			// user clicks on the cta
			userEvent.click(screen.getByTestId('icon: FolderOutline'));
			// wait for the full path to be loaded
			await screen.findByTestId('icon: ChevronLeft');
			// all levels are now shown
			expect(getByTextWithMarkup(fullBreadcrumbRegExp)).toBeVisible();
			// user clicks again on the cta
			userEvent.click(screen.getByTestId('icon: FolderOutline'));
			// root element is not shown now, only the short breadcrumb, without a request to the API
			expect(getByTextWithMarkup(shortBreadcrumbRegExp)).toBeVisible();
			expect(screen.queryByText(crumbs[0].label)).not.toBeInTheDocument();
			// user clicks on the cta
			userEvent.click(screen.getByTestId('icon: FolderOutline'));
			// all levels are now shown immediately without a request to the API
			expect(getByTextWithMarkup(fullBreadcrumbRegExp)).toBeVisible();
		});

		test('if an error occurs when loading full breadcrumb, short breadcrumb stays visible', async () => {
			const { node: currentFolder } = populateParents(populateFolder(), 5);
			const mocks = [
				{
					request: {
						query: GET_PARENT,
						variables: {
							id: currentFolder.id
						}
					},
					result: {
						data: {
							getNode: {
								id: currentFolder.id,
								name: currentFolder.name,
								__typename: currentFolder.__typename,
								parent: {
									id: currentFolder.parent.id,
									name: currentFolder.parent.name,
									__typename: currentFolder.parent.__typename,
									parent: {
										id: currentFolder.parent.parent.id,
										__typename: currentFolder.parent.parent.__typename
									}
								}
							}
						}
					}
				},
				{
					request: {
						query: GET_PATH,
						variables: {
							id: currentFolder.id
						}
					},
					error: new Error('An error occurred')
				}
			];

			testUtils.render(
				<MockedProvider mocks={mocks} cache={global.apolloClient.cache}>
					<ListHeader folderId={currentFolder.id} />
				</MockedProvider>
			);

			const getByTextWithMarkup = textWithMarkup(screen.getByText);
			const shortBreadcrumbRegExp = buildBreadCrumbRegExp(
				currentFolder.parent.name,
				currentFolder.name
			);
			const crumbs = buildCrumbs(currentFolder);

			// wait for the breadcrumb to be loaded
			await screen.findByText((content) => content.includes(currentFolder.name));
			// by default only 2 levels are shown
			expect(getByTextWithMarkup(shortBreadcrumbRegExp)).toBeVisible();
			// user clicks on the cta
			userEvent.click(screen.getByTestId('icon: FolderOutline'));
			// wait for response
			await waitFor(() => new Promise((resolve) => setTimeout(resolve, 0)));
			// root element is not shown but the short breadcrumb remains visible
			expect(getByTextWithMarkup(shortBreadcrumbRegExp)).toBeVisible();
			expect(screen.queryByText(crumbs[0].label)).not.toBeInTheDocument();
		});
	});
});
