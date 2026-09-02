import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  // GitHub Pages serves a project site from /<repo>/, so the build needs that
  // prefix. Local dev and any root-domain host stay at '/'.
  base: process.env.DEPLOY_BASE ?? '/',
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
