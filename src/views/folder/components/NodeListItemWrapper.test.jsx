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
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testUtils } from '@zextras/zapp-shell';
import React from 'react';
import { populateNode } from '../../../commonDrive/mocks/mockUtils';
import NodeListItemWrapper from '../../../commonDrive/views/folder/components/NodeListItemWrapper';

describe('NodeListItemWrapper', () => {
	describe('hover actions', () => {
		test('click on flag action changes flag icon visibility', async () => {
			const node = populateNode();
			node.flagged = false;

			const toggleFlag = jest.fn((value, item) => {
				if (item.id === node.id) {
					node.flagged = value;
				}
			});

			testUtils.render(<NodeListItemWrapper node={node} toggleFlag={toggleFlag} />);
			expect(screen.queryByTestId('icon: Flag')).not.toBeInTheDocument();
			userEvent.click(screen.getByTestId('icon: FlagOutline'));
			expect(toggleFlag).toHaveBeenCalledTimes(1);
			expect(node.flagged).toBeTruthy();
		});

		test('click on unflag action changes flag icon visibility', async () => {
			const node = populateNode();
			node.flagged = true;

			const toggleFlag = jest.fn((value, item) => {
				if (item.id === node.id) {
					node.flagged = value;
				}
			});

			testUtils.render(<NodeListItemWrapper node={node} toggleFlag={toggleFlag} />);
			expect(screen.getByTestId('icon: Flag')).toBeInTheDocument();
			expect(screen.getByTestId('icon: Flag')).toBeVisible();
			userEvent.click(screen.getByTestId('icon: UnflagOutline'));
			expect(toggleFlag).toHaveBeenCalledTimes(1);
			expect(node.flagged).toBeFalsy();
		});
	});
});
