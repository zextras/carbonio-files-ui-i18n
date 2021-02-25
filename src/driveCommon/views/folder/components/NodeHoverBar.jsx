/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React from 'react';
import { IconButton } from '@zextras/zapp-ui';
import { map } from 'lodash';

const NodeHoverBar = ({ actions }) => {
	return actions && actions.length > 0 ?
		map(actions, (action, index) => (
			<IconButton icon={action.icon} onClick={action.onClick} key={index} />
		)) : null;
}

export default NodeHoverBar;
