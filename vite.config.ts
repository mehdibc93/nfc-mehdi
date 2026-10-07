import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  build: {
    // Le build SSR (pré-rendu des pages publiques) n'a pas besoin d'une copie de public/.
    copyPublicDir: !isSsrBuild,
  },
}));
