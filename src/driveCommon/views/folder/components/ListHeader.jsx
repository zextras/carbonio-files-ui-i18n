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
import useNavigation from '../../../../hooks/useNavigation';

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
	const { navigateTo } = useNavigation();

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
				padding={{ vertical: 'medium' }}
				wrap="nowrap" width="fill"
			>
				{
					!loading && !error && data &&
					<Breadcrumbs crumbs={crumbs} />
				}
				<Row mainAlignment="flex-end" wrap="nowrap" flexGrow="1">
					{loadingData && <LoadingIcon icon="Refresh" color="primary" size="large" />}
					<IconButton icon="FunnelOutline" size="large" />
				</Row>
			</Row>
			<Divider color="gray3" />
		</>
	);
};

export default ListHeader;
