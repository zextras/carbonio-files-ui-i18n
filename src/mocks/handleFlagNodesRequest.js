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

export default function handleFlagNodesRequest(req, res, ctx) {
	const { ids } = req.variables;
	if (ids) {
	// TODO: handle case where one request fails
		return ctx.data({
			// TODO: change into flagNodes when BE change API
			starNodes: ids,
		});
	}
	return ctx.errors({
		message: 'bad request'
	});
}
