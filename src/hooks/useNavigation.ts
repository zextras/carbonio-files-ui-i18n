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

import { useCallback } from 'react';
import { hooks } from '@zextras/zapp-shell';


const useNavigation: () => {
	navigateTo: (location: string) => void
} = () => {
	const replaceHistory = hooks.useReplaceHistoryCallback();

	const navigateTo: (id: string) => void = useCallback((id) => {
		replaceHistory(`/?to=${id}`);
	}, [replaceHistory]);

	return {
		navigateTo,
	}
};

export default useNavigation;
