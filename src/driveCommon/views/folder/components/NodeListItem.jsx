import React from 'react';
import { Avatar, Container, Divider, Icon, Padding, Row, Text } from '@zextras/zapp-ui';
import styled from 'styled-components';
import { formatDate, getIconByFileType, humanFileSize } from '../../../utils/utils';
import useNavigation from '../../../../hooks/useNavigation';
import useUserInfo from '../../../../hooks/useUserInfo';
import NodeHoverBar from './NodeHoverBar';

const HoverBarContainer = styled(Row)`
  display: none;
  position: absolute;
  cursor: pointer;
`;

const HoverContainer = styled(Row)`

`;

const MainContainer = styled(Container)`
  position: relative;

  &:hover {
    & ${HoverBarContainer} {
      display: flex;
    }

    & ${HoverContainer} {
      opacity: 0.6;
      mask-image: linear-gradient(to left, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
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
}) => {
	const { navigateTo } = useNavigation();
	const userInfo = useUserInfo();

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
					padding={{ horizontal: 'large' }}
				>
					<Padding vertical="extrasmall">
						<Text size="large">{name}</Text>
					</Padding>
					<Container orientation="horizontal" width="fit" height="fit" padding={{ vertical: 'extrasmall' }}>
						<CustomText size="large" color="gray1">{mimeType || type}</CustomText>
						{size &&
						<Padding horizontal="small">
							<CustomText size="large" color="gray1">{humanFileSize(size)}</CustomText>
						</Padding>
						}
					</Container>
				</Container>
				<Container
					orientation="vertical" mainAlignment="space-between" width="fit"
				>
					<Container orientation="horizontal" padding={{ vertical: 'extrasmall' }} mainAlignment="flex-end">
						<Padding left="extrasmall">
							{
								flagActive &&
								<Icon icon="Flag" color="error" data-testid="flag-icon" />
							}
						</Padding>
						{
							linkActive &&
							<Padding left="extrasmall">
								<Icon icon="Link2" data-testid="link-icon" />
							</Padding>
						}
						{
							shareActive &&
							<Padding left="extrasmall">
								<Icon icon="Share" data-testid="share-icon" />
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
			<HoverBarContainer wrap="nowrap" mainAlignment="flex-end" width="fill">
				<NodeHoverBar id={id} />
			</HoverBarContainer>
			<Divider color="gray3" />
		</MainContainer>
	);
};

export default NodeListItem;
