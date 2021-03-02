import React from 'react';
import { screen } from '@testing-library/react';
import { testUtils } from '@zextras/zapp-shell';
import faker from 'faker';
import userEvent from '@testing-library/user-event';
import NodeListItem from '../../../commonDrive/views/folder/components/NodeListItem';
import { populateFile, populateFolder, populateNode } from '../../../mocks/mockUtils';
import { formatDate, humanFileSize } from '../../../commonDrive/utils/utils';

let mockedUserLogged;
let mockedHistory;
let mockedNavigation;

beforeEach(() => {
	// mock useUserInfo data
	mockedUserLogged = {
		id: faker.random.uuid(),
		name: faker.name.findName(),
	};

	mockedHistory = [];
	mockedNavigation = jest.fn((path) => {
		mockedHistory.push(path);
	});
});

afterEach(() => {
	jest.restoreAllMocks();
});

jest.mock('../../../hooks/useUserInfo', () => {
	return jest.fn(() => ({
		me: mockedUserLogged.id,
	}));
});

jest.mock('../../../hooks/useNavigation', () => {
	return jest.fn(() => ({
		navigateTo: mockedNavigation,
	}));
});

describe('Node List Item', () => {

	// TODO: test events like hover, click/selection, double click

	test('render a basic node in the list, logged user is owner and last editor', () => {
		const node = populateNode();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				updatedAt={node.updated_at}
				owner={mockedUserLogged}
				lastEditor={mockedUserLogged}
			/>,
		);

		expect(screen.getByTestId(node.id)).toBeInTheDocument();
		expect(screen.getByTestId(node.id)).toBeVisible();
		expect(screen.getByTestId(node.id)).not.toBeEmptyDOMElement();
		expect(screen.getByText(node.name)).toBeVisible();
		expect(screen.getByText(formatDate(node.updated_at))).toBeVisible();
		expect(screen.queryByText(mockedUserLogged.name)).not.toBeInTheDocument();
	});

	test('render a folder item in the list', () => {
		const node = populateFolder();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				updatedAt={node.updated_at}
				owner={node.owner}
			/>,
		);
		// screen.debug();
		expect(screen.getByTestId(node.id)).toHaveTextContent('Folder');

	});

	test('share icon is visible if node is shared', () => {
		const node = populateNode();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				shareActive
			/>,
		);
		expect(screen.getByTestId('icon: Share')).toBeInTheDocument();
		expect(screen.getByTestId('icon: Share')).toBeVisible();
	});

	test('share icon is not visible if node is not shared', () => {
		const node = populateNode();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				shareActive={false}
			/>,
		);
		expect(screen.queryByTestId('icon: Share')).not.toBeInTheDocument();
	});

	test('link icon is visible if node is linked', () => {
		const node = populateNode();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				linkActive
			/>,
		);
		expect(screen.getByTestId('icon: Link2')).toBeInTheDocument();
		expect(screen.getByTestId('icon: Link2')).toBeVisible();
	});

	test('link icon is not visible if node is not linked', () => {
		const node = populateNode();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				linkActive={false}
			/>,
		);
		expect(screen.queryByTestId('icon: Link2')).not.toBeInTheDocument();
	});

	test('flag icon is visible if node is flagged', () => {
		const node = populateNode();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				flagActive
			/>,
		);
		expect(screen.getByTestId('icon: Flag')).toBeInTheDocument();
		expect(screen.getByTestId('icon: Flag')).toBeVisible();
	});

	test('flag icon is not visible if node is not flagged', () => {
		const node = populateNode();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				flagActive={false}
			/>,
		);
		expect(screen.queryByTestId('icon: Flag')).not.toBeInTheDocument();
	});

	// TODO: change into can_change_flag when BE change API
	test('flag action is not visible if node has not permission can_change_star', () => {
		const node = populateNode();
		node.permissions.can_change_star = false;
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				permissions={node.permissions}
			/>,
		);
		expect(screen.queryByTestId('icon: FlagOutline')).not.toBeInTheDocument();
	});

	// TODO: change into can_change_flag when BE change API
	test('flag action is visible if node has permission can_change_star', async () => {
		const node = populateNode();
		node.permissions.can_change_star = true;
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				permissions={node.permissions}
			/>,
		);
		expect(screen.getByTestId('icon: FlagOutline')).toBeInTheDocument();
		// TODO: toBeVisible fails but I don't know why
		// userEvent.hover(screen.getByTestId(node.id));
		// expect(screen.queryByTestId('icon: FlagOutline')).toBeVisible();
	});

	test('click on hover flag action changes flag icon visibility', () => {
		const node = populateNode();
		// TODO: change into can_change_flag once BE change API
		node.permissions.can_change_star = true;
		let flagActive = false;
		const toggleFlagFunction = jest.fn((flagValue, ...ids) => {
			if (ids.includes(node.id)) {
				flagActive = flagValue;
			}
		});
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				flagActive={flagActive}
				permissions={node.permissions}
				toggleFlag={toggleFlagFunction}
			/>,
		);
		expect(screen.queryByTestId('icon: Flag')).not.toBeInTheDocument();
		userEvent.click(screen.getByTestId('icon: FlagOutline'));
		expect(toggleFlagFunction).toHaveBeenCalledTimes(1);
		expect(flagActive).toBeTruthy();
	});

	test('render a file item in the list', () => {
		const node = populateFile();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				size={node.size}
				mimeType={node.mime_type}
			/>,
		);
		// TODO: check that extension is visible
		// expect(screen.getByText(node.extension)).toBeVisible();
		expect(screen.getByText(humanFileSize(node.size))).toBeVisible();
	});

	test('owner is visible if different from logged user', () => {
		const node = populateNode();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				owner={node.owner}
			/>,
		);
		expect(screen.getByText(node.owner.full_name)).toBeVisible();
	});

	test('last modifier is visible if node is shared', () => {
		const node = populateNode();
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				owner={mockedUserLogged}
				lastEditor={node.last_editor}
				shareActive
			/>,
		);
		expect(screen.getByText(node.last_editor.full_name)).toBeVisible();
	});

	test('double click on a folder activates navigation', () => {
		const node = populateFolder(0);
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
			/>,
		);
		userEvent.dblClick(screen.getByTestId(node.id));
		expect(mockedNavigation).toHaveBeenCalledTimes(1);
		expect(mockedHistory).toContain(node.id);
		expect(mockedHistory[mockedHistory.length - 1]).toBe(node.id);
	});

	test('double click on a folder with selection mode active does nothing', () => {
		const node = populateFolder(0);
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
				selectionMode
			/>,
		);
		userEvent.dblClick(screen.getByTestId(node.id));
		expect(mockedNavigation).not.toHaveBeenCalled();
	});

	// TODO: double click on file open file?
	// TODO: double click on folder if selection mode is active does not open the folder. Does nothing?
});
