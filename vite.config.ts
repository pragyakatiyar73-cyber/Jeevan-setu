import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appUrl = env.NEXT_PUBLIC_APP_URL || env.VITE_APP_URL || '';

  return {
    plugins: [react()],
    define: {
      'process.env.NEXT_PUBLIC_APP_URL': JSON.stringify(appUrl),
      'process.env.VITE_APP_URL': JSON.stringify(appUrl)
    },
    server: {
      host: true,
      port: 3000,
      allowedHosts: true,
      open: false,
      proxy: {
        '/citizen': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false
        },
        '/analyze': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false
        },
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
