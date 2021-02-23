import { buildCrumbs } from './utils';
import { Node } from '../types/graphqlSchema';

describe('Crumbs builder', () => {
	it('should return a flat array with 3 objects ordered from root to leaf', () => {
		const input: Node = {
			id: '9f2d384a-5dcb-488c-91b8-bc313e3cf422',
			name: 'personali',
			parent: {
				id: 'df6f62f4-dbd6-48fe-9808-9e7b687ee56a',
				name: 'beatrice',
				parent: {
					id: 'LOCAL_ROOT',
					name: 'ROOT',
					parent: null,
				},
			},
		}

		const result = buildCrumbs(input);

		const expected = [{
			id: 'LOCAL_ROOT',
			label: 'ROOT',
		}, {
			id: 'df6f62f4-dbd6-48fe-9808-9e7b687ee56a',
			label: 'beatrice',
		}, {
			id: '9f2d384a-5dcb-488c-91b8-bc313e3cf422',
			label: 'personali',
		}]

		expect(result).toMatchObject(expected);
	});
})
