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
import { Avatar, Container, Divider, Icon, Padding, Row, Text } from '@zextras/zapp-ui';
import styled from 'styled-components';
import { formatDate, getIconByFileType, humanFileSize } from '../../../utils/utils';
import useNavigation from '../../../../hooks/useNavigation';
import useUserInfo from '../../../../hooks/useUserInfo';
import NodeHoverBar from './NodeHoverBar';

const HoverBarContainer = styled(Row)`
  display: none;
  position: absolute;
`;

const HoverContainer = styled(Row)`

`;

const MainContainer = styled(Container)`
  position: relative;
  cursor: pointer;

  &:hover {
    & ${HoverBarContainer} {
      display: flex;
    }

    & ${HoverContainer} {
      opacity: 0.6;
      mask-image: linear-gradient(to left, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
      background-color: ${props => props.theme.palette.gray6.hover};
    }
  }
`;

const FileIconPreview = styled(Avatar)`
  border-radius: 8px;
  height: 48px;
  width: 48px;
  flex: 0 0 auto;
  align-self: center;

  & > svg {
    color: ${props => props.theme.palette.gray1.regular} !important;
    width: 24px;
    height: 24px;
  }
`;

const CustomText = styled(Text)`
  text-transform: uppercase;
`;

const NodeListItem = ({
	id, name, type, mimeType, updatedAt, size, owner, lastEditor,
	shareActive, linkActive, flagActive,
	selectionMode,
	permissions,
	toggleFlag,
}) => {
	const { navigateTo } = useNavigation();
	const userInfo = useUserInfo();
	const [actions, setActions] = useState([]);

	useEffect(() => {
		const _actions = [];
		// TODO: change in can_change_flag when BE change API
		if (permissions) {
			if (permissions.can_change_star) {
				_actions.push({
					id: 'flag-action',
					icon: flagActive ? 'UnflagOutline' : 'FlagOutline',
					onClick: () => toggleFlag(!flagActive, id),
				});
			}
		}
		setActions(_actions);
	}, [toggleFlag, flagActive, id, permissions]);

	const openNode = () => {
		if (!selectionMode) {
			if (type === 'Folder') {
				navigateTo(id);
			}
			else {
				// TODO open file?
			}
		}
	}

	const displayName = () => {
		// TODO: could it be a better place to put this logic?
		if (owner && owner.id !== userInfo.me) {
			return owner.full_name;
		}
		if (shareActive) {
			return lastEditor && lastEditor.full_name;
		}
		return '';
	}

	return (
		<MainContainer
			height="fit"
			onDoubleClick={openNode}
			data-testid={id}
		>
			<HoverContainer
				height={64}
				wrap="nowrap"
				mainAlignment="flex-start"
				crossAlignment="stretch"
				padding={{ all: 'small' }}
				width="fill"
				background="gray6"
			>
				<FileIconPreview
					icon={getIconByFileType(type)}
					background="gray3"
					label="."
				/>
				<Container
					orientation="vertical" crossAlignment="flex-start" mainAlignment="space-between"
					padding={{ horizontal: 'large' }} minWidth={0}
				>
					<Padding vertical="extrasmall">
						<Text size="large">{name}</Text>
					</Padding>
					<Row wrap="nowrap" height="fit" padding={{ vertical: 'extrasmall' }} mainAlignment="flex-start">
						<CustomText size="large" color="gray1">{mimeType || type}</CustomText>
						{size &&
						<Padding horizontal="small">
							<CustomText size="large" color="gray1">{humanFileSize(size)}</CustomText>
						</Padding>
						}
					</Row>
				</Container>
				<Container
					orientation="vertical" mainAlignment="space-between" width="fit"
				>
					<Container orientation="horizontal" padding={{ vertical: 'extrasmall' }} mainAlignment="flex-end">
						{
							flagActive &&
							<Padding left="extrasmall">
								<Icon icon="Flag" color="error" />
							</Padding>
						}
						{
							linkActive &&
							<Padding left="extrasmall">
								<Icon icon="Link2" />
							</Padding>
						}
						{
							shareActive &&
							<Padding left="extrasmall">
								<Icon icon="Share" />
							</Padding>
						}
						<Padding left="extrasmall">
							<Text color="gray1">{formatDate(updatedAt)}</Text>
						</Padding>
					</Container>
					<Container orientation="horizontal" padding={{ vertical: 'extrasmall' }}>
						{/* TODO last modifier for my file, owner for shared with me */}
						<Text>{displayName()}</Text>
					</Container>
				</Container>
			</HoverContainer>
			<HoverBarContainer wrap="nowrap" mainAlignment="flex-end" width="fill" data-testid={`hoverbar-${id}`}>
				<NodeHoverBar actions={actions} />
			</HoverBarContainer>
			<Divider color="gray3" />
		</MainContainer>
	);
};

export default NodeListItem;
