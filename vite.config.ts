import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite_cache',
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  build: {
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs', '.ts', '.tsx']
    },
    // Improve build performance
    rollupOptions: {
      cache: true,
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            '@mui/material',
            '@emotion/react',
            '@emotion/styled'
          ],
          'charts': [
            'chart.js',
            'react-chartjs-2',
            'echarts',
            'recharts'
          ],
          'utils': [
            'lodash',
            'axios',
            'papaparse',
            'xlsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase the warning limit to 1000kb
  }
});