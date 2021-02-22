import { ApolloClient, InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
	possibleTypes: {
		Node: ['File', 'Folder'],
	},
});

const client = new ApolloClient({
	uri: '/zx/drive/graphql/v1',
	cache,
	credentials: 'same-origin',
});

export default client;
