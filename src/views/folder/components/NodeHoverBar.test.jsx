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
import React from 'react';
import { testUtils } from '@zextras/zapp-shell';
import { fireEvent, screen } from '@testing-library/react';
import NodeHoverBar from '../../../commonDrive/views/folder/components/NodeHoverBar';

describe('Node Hover Bar', () => {
	test('render nothing if no actions are provided', () => {
		const { container } = testUtils.render(<NodeHoverBar actions={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	test('render all actions icons', () => {
		const action1Fn = jest.fn();
		const action2Fn = jest.fn();

		const actions = [
			{
				id: 'action1',
				icon: 'action1Icon',
				onClick: action1Fn
			},
			{
				id: 'action2',
				icon: 'action2Icon',
				onClick: action2Fn
			}
		];

		testUtils.render(<NodeHoverBar actions={actions} />);
		expect(screen.getByTestId('icon: action1Icon')).toBeInTheDocument();
		expect(screen.getByTestId('icon: action1Icon')).toBeVisible();
		expect(screen.getByTestId('icon: action2Icon')).toBeInTheDocument();
		expect(screen.getByTestId('icon: action2Icon')).toBeVisible();
		fireEvent.click(screen.getByTestId('icon: action1Icon'));
		expect(action1Fn).toHaveBeenCalledTimes(1);
		expect(action2Fn).not.toHaveBeenCalled();
		fireEvent.click(screen.getByTestId('icon: action2Icon'));
		expect(action1Fn).toHaveBeenCalledTimes(1);
		expect(action2Fn).toHaveBeenCalledTimes(1);
	});
});
