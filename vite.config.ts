import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [tailwindcss(), react(), basicSsl()],
  base: './',
  server: {
    host: '0.0.0.0',
  },
});
