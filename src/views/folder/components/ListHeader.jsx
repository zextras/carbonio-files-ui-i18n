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

import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Breadcrumbs, Divider, Icon, IconButton, Row } from '@zextras/zapp-ui';
import styled, { keyframes } from 'styled-components';
import getParents from '../../../graphql/queries/getParents.graphql';
import { buildCrumbs } from '../../../utils/utils';
import useNavigation from '../../../hooks/useNavigation';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingIcon = styled(Icon)`
  animation: ${rotate} 1s linear infinite;
`;

const ListHeader = ({ folderId, loadingData, selecting }) => {
	const { data, loading, error } = useQuery(getParents, {
		variables: {
			id: folderId,
		},
	});
	const [crumbs, setCrumbs] = useState([]);
	const [actions, setActions] = useState([]);
	const { navigateTo } = useNavigation();

	useEffect(() => {
		// TODO think which component should set these actions, since they change base on permissions, area (trash or home), number and type of node selected
		const activeActions = [
			{
				id: 'share',
				icon: 'Share',
				label: 'Share',
				onActivate: console.log,
			},
			{
				id: 'edit',
				icon: 'Edit2Outline',
				label: 'Edit',
				onActivate: console.log,
			},
			{
				id: 'delete',
				icon: 'Trash2Outline',
				label: 'Delete',
				onActivate: console.log,
			},
		];
		setActions(activeActions);
	}, []);

	useEffect(() => {
		let breadcrumbs = [];
		if (data && data.getNode) {
			breadcrumbs = buildCrumbs(data.getNode, navigateTo);
		}
		setCrumbs(breadcrumbs);
	}, [data, navigateTo]);

	return (
		<>
			<Row
				height={48} background="gray5" mainAlignment="space-between"
				padding={{ vertical: 'medium', horizontal: 'large' }}
				wrap="nowrap" width="fill"
			>
				{
					!loading && !error && data &&
					<Breadcrumbs crumbs={crumbs} />
				}
				{loadingData && <LoadingIcon icon="Refresh" color="primary" size="large" />}
				<IconButton icon="FunnelOutline" size="large" />
			</Row>
			<Divider color="gray3" />
		</>
	);
};

export default ListHeader;
