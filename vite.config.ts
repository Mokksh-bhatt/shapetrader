import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// GitHub Pages serves a project site from /<repo>/, so the build needs that
// prefix. Passed as a bare repo name rather than a path: Git Bash on Windows
// rewrites anything that looks like an absolute POSIX path into a Windows one,
// which silently produced a bundle pointing at /Program Files/Git/<repo>/.
const repo = process.env.DEPLOY_BASE?.replace(/^\/+|\/+$/g, '');

export default defineConfig({
  base: repo ? `/${repo}/` : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the heavy third-party code out of the app bundle so the first
        // screen paints sooner and repeat visits hit cache.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['lightweight-charts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
