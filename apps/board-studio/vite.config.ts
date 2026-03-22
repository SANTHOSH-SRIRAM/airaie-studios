import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@api': path.resolve(__dirname, './src/api'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@pages': path.resolve(__dirname, './src/pages'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', '@tanstack/react-query', 'axios', 'lucide-react', 'clsx'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'state': ['zustand', '@tanstack/react-query'],
          'charts': ['@airaie/charts', 'recharts'],
          'ui': ['@airaie/ui', '@airaie/shell', 'lucide-react'],
          'panels': ['react-resizable-panels'],
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vtk': ['@kitware/vtk.js'],
        },
      },
    },
  },
  server: {
    port: 3003,
    proxy: {
      '/v0': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
