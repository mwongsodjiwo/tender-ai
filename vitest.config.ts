import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			$types: path.resolve('./src/lib/types'),
			$lib: path.resolve('./src/lib'),
			$server: path.resolve('./src/lib/server'),
			$components: path.resolve('./src/lib/components'),
			$stores: path.resolve('./src/lib/stores'),
			$utils: path.resolve('./src/lib/utils')
		}
	},
	test: {
		include: ['tests/unit/**/*.{test,spec}.{js,ts}']
	}
});
