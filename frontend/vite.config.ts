import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // const base = mode === 'production'? '/seo-content-gen/' : '/';
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_APP_URL_PREFIX? `/${env.VITE_APP_URL_PREFIX}/` : '/';
  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3001,
      open: true,
      allowedHosts: ['weam.local', 'dev.weam.ai', 'qa.weam.ai', 'app.weam.ai'],
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    publicDir: 'public',
  };
});
