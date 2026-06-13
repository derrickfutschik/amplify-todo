import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@platform-backend': path.resolve(__dirname, '../../packages/platform-backend'),
      '@feature-backend': path.resolve(__dirname, '../../packages/feature-backend'),
    },
  },
});
