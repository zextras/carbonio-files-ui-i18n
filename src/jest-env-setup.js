/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import '@testing-library/jest-dom/extend-expect';
import buildClient from './commonDrive/apollo';
import server from './mocks/server';

beforeEach(async () => {
	// Do not useFakeTimers with `whatwg-fetch` if using mocked server
	// https://github.com/mswjs/msw/issues/448
	jest.useFakeTimers();

	// reset apollo client cache
	await global.apolloClient.cache.reset();
});

beforeAll(() => {
	server.listen();

	// initialize an apollo client instance for test and makes it available globally
	global.apolloClient = buildClient(true);

	// define browser objects non available in jest
	// https://jestjs.io/docs/en/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: jest.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: jest.fn(), // Deprecated
			removeListener: jest.fn(), // Deprecated
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn()
		}))
	});

	global.intersectionObserverEntries = [];

	// mock a simplified Intersection Observer
	Object.defineProperty(window, 'IntersectionObserver', {
		writable: true,
		value: jest.fn().mockImplementation((callback, options) => ({
			thresholds: options.threshold,
			root: options.root,
			rootMargin: options.rootMargin,
			observe: jest.fn((element) => {
				global.intersectionObserverEntries.push(element);
			}),
			unobserve: jest.fn((element) => {
				global.intersectionObserverEntries.splice(
					global.intersectionObserverEntries.indexOf(element),
					1
				);
			}),
			disconnect: jest.fn(() => {
				global.intersectionObserverEntries.splice(0, global.intersectionObserverEntries.length);
			})
		}))
	});
});

afterAll(() => server.close());
afterEach(() => {
	// server.resetHandlers();
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
});
