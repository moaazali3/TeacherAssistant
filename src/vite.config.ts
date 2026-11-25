import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Listen on all addresses to allow *.localhost resolution
    proxy: {
      '/storage': {
        target: 'http://localhost:5014',
        changeOrigin: true,
      },
    },
    watch: {
      ignored: [
        '**/bin/**',
        '**/obj/**',
        '**/*.dll',
        '**/*.exe',
        '**/TeacherAssistant.*/**',
      ],
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', 'axios'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-radix': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable'],
          'vendor-date': ['date-fns'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
