import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { testUtils } from '@zextras/zapp-shell';
import faker from 'faker';
import NodeListItem from './NodeListItem';
import { populateFile, populateFolder, populateNode } from '../../../mocks/mockUtils';
import { formatDate, humanFileSize } from '../../../utils/utils';

// mock useUserInfo data
const mockedUserLogged = {
	id: faker.random.uuid(),
	name: faker.name.findName(),
};

const mockedHistory = [];
const mockedNavigation = jest.fn((path) => {
	mockedHistory.push(path);
});

jest.mock('../../../hooks/useUserInfo', () => {
	return jest.fn(() => ({
		me: mockedUserLogged.id,
	}));
});

jest.mock('../../../hooks/useNavigation', () => {
	return jest.fn(() => ({
		navigateTo: mockedNavigation
	}));
})

describe('Node List Item', () => {
// TODO: test events like hover, click/selection, double click

	test('render a node in the list', () => {
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
		expect(screen.queryAllByTestId(/icon/)).toHaveLength(0);
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

		// TODO: toggle share
		// screen.debug();
		expect(screen.getByTestId('share-icon')).toBeInTheDocument();
		expect(screen.getByTestId('share-icon')).toBeVisible();

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

		// TODO: toggle link
		// screen.debug();
		expect(screen.getByTestId('link-icon')).toBeInTheDocument();
		expect(screen.getByTestId('link-icon')).toBeVisible();

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

		// TODO: toggle flag
		// screen.debug();
		expect(screen.getByTestId('flag-icon')).toBeInTheDocument();
		expect(screen.getByTestId('flag-icon')).toBeVisible();

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

		// screen.debug();
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

	test('double click on a folder activates navigation', async () => {
		const node = populateFolder(0);
		testUtils.render(
			<NodeListItem
				id={node.id}
				name={node.name}
				type={node.type}
			/>
		);
		fireEvent.doubleClick(screen.getByTestId(node.id));
		expect(mockedNavigation).toHaveBeenCalledTimes(1);
		expect(mockedHistory).toContain(node.id);
		expect(mockedHistory[mockedHistory.length-1]).toBe(node.id);
	});
})
