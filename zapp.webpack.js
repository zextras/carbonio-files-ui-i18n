
module.exports = function (wpConf, zappConfig, options) {
	// enable loader for graphql files to be able to use the import notation
	wpConf.module.rules.push(
		{
			test: /\.(graphql|gql)$/,
			exclude: /node_modules/,
			loader: 'graphql-tag/loader'
		}
	);

	wpConf.devServer.proxy.push({
		context: ['/zx/drive/graphql/v1'],
		target: !options.server || options.server === 'none' ? `http://localhost:${wpConf.devServer.port}` : `https://${options.server}`,
		secure: false
	});
};
