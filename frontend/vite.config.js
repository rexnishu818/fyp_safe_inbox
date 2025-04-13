import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import open from 'open';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false, // Disable Vite's built-in open
  },
  async configureServer() {
    await open('http://localhost:5173'); // Manually open using the 'open' module
  }
});
