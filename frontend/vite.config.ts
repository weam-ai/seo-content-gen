import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use /seo/ base only when VITE_USE_NGINX_BASE is set to true
  const base = '/seo-content-gen/';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3001,
      open: true,
      allowedHosts: ['weam.local', 'dev.weam.ai'],
    },
    base,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
  };
});
