import React, { useCallback } from 'react';
import { Container } from '@zextras/zapp-ui';
import { useMutation, useQuery } from '@apollo/client';
import { find, forEach, map } from 'lodash';

import getChildren from '../../../graphql/queries/getChildren.graphql';
import NodeListItem from './NodeListItem';
import ListHeader from './ListHeader';
import EmptyFolder from './EmptyFolder';
import flagNodesMutation from '../../../graphql/mutations/flagNodes.graphql';

const FolderList = ({ folderId }) => {
	const { data, loading, error } = useQuery(getChildren, {
		variables: {
			parentNode: folderId,
			childrenLimit: 10,
			sorts: ['TYPE_ASC', 'NAME_ASC'],
		},
	});

	/** Mutation for update the flag status */
	const [flagNodes] = useMutation(flagNodesMutation, {
		update(cache, { data: { starNodes } }) {
			// TODO: change into flagNodes once BE modify the API
			forEach(starNodes, id => {
				cache.modify({
					id: cache.identify(find(data.getNode.children, ['id', id])),
					fields: {
						// TODO: change into flagged once BE modify the API
						starred(cachedValue) {
							return !cachedValue;
						},
					},
				});
			});
		},
	});

	/**
	 * Set flagValue for nodes with given ids.
	 *
	 * The mutation updates the node in cache and uses the optimistic response to update data before getting server response
	 * @param {boolean} flagValue value to set
	 * @param {...string} ids ids of nodes to update
	 */
	const toggleFlag = useCallback(async (flagValue, ...ids) => {
		await flagNodes({
			variables: {
				nodes_ids: ids,
				flag: flagValue,
			},
			optimisticResponse: {
				__typename: 'Mutation',
				// TODO: change into flagNodes once BE modify the API
				starNodes: ids,
			},
		});
	}, [flagNodes]);

	const itemFactory = useCallback(() => {
		return map(data.getNode.children, node => (
			<NodeListItem
				key={node.id}
				id={node.id}
				name={node.name}
				type={node.type}
				mimeType={node.mime_type}
				updatedAt={node.updated_at}
				owner={node.owner}
				lastEditor={node.last_editor}
				size={node.size}
				permissions={node.permissions}
				// TODO: change into flagged once BE modify the API
				flagActive={node.starred}
				toggleFlag={toggleFlag}
			/>
		));
	}, [data, toggleFlag]);

	return (
		<Container mainAlignment="flex-start" crossAlignment="flex-start" data-testid={folderId}>
			<ListHeader folderId={folderId} loadingData={loading} />
			{error && <p>Error: {error.message}</p>}
			<Container crossAlignment="flex-start" mainAlignment="flex-start">
				{data?.getNode?.children?.length > 0 ? itemFactory() : <EmptyFolder />}
			</Container>
		</Container>
	);
};

export default FolderList;
