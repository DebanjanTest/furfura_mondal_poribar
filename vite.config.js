import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/Images/**', '**/.git/**', '**/dist/**']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        portal: resolve(__dirname, 'portal.html'),
        admin: resolve(__dirname, 'admin.html')
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
        }
      }
    }
  }
});

