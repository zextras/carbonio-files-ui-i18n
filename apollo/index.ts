import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import introspection from '../graphql/possible-types';

export const cache = new InMemoryCache({
	possibleTypes: introspection.possibleTypes,
});

/**
 * Creates and return the apollo client instance
 * @param test if true the uri is set as absolute (https://localhost:9000/zx/drive/graphql/v1),
 * otherwise it is set as relative (/zx/drive/graphql/v1)
 */
const buildClient: (test?: boolean) => ApolloClient<NormalizedCacheObject> = (test) => {
	const uri = test ? 'http://localhost:9000' : '';
	return new ApolloClient<NormalizedCacheObject>({
		uri: `${uri}/zx/drive/graphql/v1`,
		cache,
		credentials: 'same-origin',
	});
};

export default buildClient;
