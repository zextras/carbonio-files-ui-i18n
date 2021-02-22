import React, { useCallback } from 'react';
import { Container } from '@zextras/zapp-ui';
import { useQuery } from '@apollo/client';
import { map } from 'lodash';

import getChildren from '../../../graphql/queries/getChildren.graphql';
import NodeListItem from './NodeListItem';
import ListHeader from './ListHeader';
import EmptyFolder from './EmptyFolder';

const FolderList = ({ folderId }) => {
	const { data, loading, error } = useQuery(getChildren, {
		variables: {
			parentNode: folderId,
			childrenLimit: 10,
			sorts: ['TYPE_ASC', 'NAME_ASC'],
		},
	});

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
			/>
		));
	}, [data]);

	if (loading) {
		return <p>Loading</p>;
	}
	if (error) {
		return <p>Error</p>;
	}

	return (
		<Container crossAlignment="flex-start">
			<ListHeader folderId={folderId} loading={loading} />
			<Container crossAlignment="flex-start" mainAlignment="flex-start">
				{data?.getNode?.children?.length > 0 ? itemFactory() : <EmptyFolder />}
			</Container>
		</Container>
	);
};

export default FolderList;
