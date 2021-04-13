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

import { AppCreateOption, setCreateOptions } from '@zextras/zapp-shell';

export const useCreateOptions = (): {
	setCreateOptions: (options: AppCreateOption[]) => void;
} => ({
	setCreateOptions
});
