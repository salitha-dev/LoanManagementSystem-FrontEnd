import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';

	return {
		plugins: [react()],
		server: {
			host: '127.0.0.1',
			port: 5174,
			strictPort: false,
			proxy: {
				'/api': {
					target: proxyTarget,
					changeOrigin: true,
					secure: false,
				},
				'/storage': {
					target: proxyTarget,
					changeOrigin: true,
					secure: false,
				},
			},
		},
		css: {
			preprocessorOptions: {
				scss: {
					quietDeps: true,
					// Inherited Facit SCSS uses @import and global functions; migrate before Dart Sass 3.
					silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
				},
			},
		},
	};
});
