/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f0f5ff',
					100: '#e0ebff',
					200: '#c1d7ff',
					300: '#93b4fd',
					400: '#6090fa',
					500: '#3b6fef',
					600: '#2557d6',
					700: '#1d47b8',
					800: '#1a3a94',
					900: '#172f75',
					950: '#0f1f4d'
				},
				success: {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d'
				},
				warning: {
					50: '#fffbeb',
					100: '#fef3c7',
					200: '#fde68a',
					300: '#fcd34d',
					400: '#fbbf24',
					500: '#f59e0b',
					600: '#d97706',
					700: '#b45309',
					800: '#92400e',
					900: '#78350f'
				},
				error: {
					50: '#fef2f2',
					100: '#fee2e2',
					200: '#fecaca',
					300: '#fca5a5',
					400: '#f87171',
					500: '#ef4444',
					600: '#dc2626',
					700: '#b91c1c',
					800: '#991b1b',
					900: '#7f1d1d'
				}
			},
			fontFamily: {
				sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
				display: ['Poppins', 'system-ui', '-apple-system', 'sans-serif']
			},
			borderRadius: {
				card: '12px',
				badge: '6px'
			},
			boxShadow: {
				card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
				'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)'
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography')
	]
};
