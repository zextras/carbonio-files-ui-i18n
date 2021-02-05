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

import React, { useEffect } from 'react';
import {
	setCreateOptions, setRoutes, store
} from '@zextras/zapp-shell';
import { combineReducers } from '@reduxjs/toolkit';

export default function App() {
	console.log('Hello from zapp-template');
	/* Here an example on how to use this entry point.
	 * Have fun :)
	 * useEffect(() => {
	 * 	store.setReducer(
	 * 		combineReducers({}),
	 * 	);
	 * 	setRoutes([]);
	 * 	setCreateOptions([{}]);
	 * }, []);
	 */

	return null;
}
