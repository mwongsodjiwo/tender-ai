import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/integration/**/*.{test,spec}.{js,ts}'],
		testTimeout: 30000
	}
});
