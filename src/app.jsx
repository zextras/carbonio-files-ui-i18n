/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2019 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React, { lazy, useEffect } from 'react';

import { setRoutes } from '@zextras/zapp-shell';

import { SetMainMenuItems } from './views/secondary-bar/SetMainMenuItem';

const lazyFolderView = lazy(() =>
	import(/* webpackChunkName: "folderView" */ './commonDrive/views/folder/FolderView')
);

export default function App() {
	// eslint-disable-next-line no-console
	console.log('Hello from zapp-drive');

	useEffect(() => {
		setRoutes([
			{
				route: '/root/:rootId',
				view: lazyFolderView
			},
			{
				route: '/',
				view: lazyFolderView
			}
		]);
	}, []);

	return <SetMainMenuItems />;
}
