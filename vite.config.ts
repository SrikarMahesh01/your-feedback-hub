import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
    host: true, // Allows external connections
  },
  preview: {
    port: 3000,
    host: true,
  },
  build: {
    sourcemap: false, // Completely disable source maps
    minify: 'terser', // Use terser for maximum minification
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
        // Obfuscate chunk names to hide structure
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]',
      },
    },
    terserOptions: {
      compress: {
        drop_console: true, // Remove all console statements
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'], // Remove specific console methods
        passes: 2, // Reduced passes to avoid breaking React internals
      },
      mangle: {
        // Mangle variable names but avoid breaking React
        toplevel: false, // Don't mangle top-level names
        reserved: ['React', 'ReactDOM'], // Preserve React names
      },
      format: {
        comments: false, // Remove all comments
        beautify: false, // Don't beautify output
      },
    },
    // Additional security settings
    reportCompressedSize: false, // Don't report file sizes
    chunkSizeWarningLimit: 1000, // Increase limit to avoid warnings
  },
});
