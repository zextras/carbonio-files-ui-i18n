import { GraphQLResponseResolver } from 'msw';

const handleIntrospectionRequest: GraphQLResponseResolver<unknown, unknown> = (req, res, ctx) =>
	res(ctx.data({}));

export default handleIntrospectionRequest;
