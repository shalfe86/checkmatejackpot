import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '');
    const isProd = mode === 'production';
    
    return {
      // Use repo base only in production (for gh-pages); use '/' during dev
      base: isProd ? '/checkmatejackpot/' : '/',
      
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
        },
      },
      server: {
        host: true, // Needed for Codespaces to forward the port
      }
    };
});