import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// @ts-expect-error vitest@2 bundles vite@5 types; upgrade to vitest@3 for vite@6 compat
	test: {
		include: ['tests/unit/**/*.{test,spec}.{js,ts}']
	}
});
