import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  
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
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
  };
});
