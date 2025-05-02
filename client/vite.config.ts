import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add this alias for easier imports from server types
      "@server-types": path.resolve(__dirname, "../server/src/types"),
    },
  },
  server: {
    port: 5173, // Default vite port
    strictPort: true, // Fail if port is already in use
    proxy: {
      // Proxy API requests to the backend server during development
      // '/api': {
      //   target: 'http://localhost:3001', // Your backend server address
      //   changeOrigin: true,
      //   // rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix if backend routes don't have it
      // },
      // Proxy WebSocket connections
      // We handle the WebSocket connection directly in the client, 
      // so proxying might not be needed unless accessing from a different origin in dev
      // '/socket.io': {
      //   target: 'ws://localhost:3001', // Your WebSocket server address
      //   ws: true, // Enable WebSocket proxying
      //   changeOrigin: true,
      // }
    }
  },
  build: {
    outDir: 'dist',
    // Ensure the output directory is cleaned before building
    emptyOutDir: true,
  },
})
