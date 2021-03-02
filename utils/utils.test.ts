import { buildCrumbs } from './utils';
import { populateNode } from '../../mocks/mockUtils';

describe('Crumbs builder', () => {
	it('should return a flat array with 3 objects ordered from root to leaf', () => {
		const lvl0 = populateNode('Folder', 'LOCAL_ROOT', 'ROOT');
		const lvl1 = populateNode('Folder');
		const lvl2 = populateNode('Folder');
		lvl2.parent = lvl1;
		lvl1.parent = lvl0;

		const result = buildCrumbs(lvl2);

		const expected = [{
			id: lvl0.id,
			label: lvl0.name,
		}, {
			id: lvl1.id,
			label: lvl1.name,
		}, {
			id: lvl2.id,
			label: lvl2.name,
		}];

		expect(result).toMatchObject(expected);
	});
});
