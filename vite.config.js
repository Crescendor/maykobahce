import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disables sourcemaps in production so DevTools Sources tab never reveals original source code
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/sys-[hash].js', // Obfuscated chunk names without admin keywords
        assetFileNames: 'assets/style-[hash].[ext]'
      }
    }
  }
});
