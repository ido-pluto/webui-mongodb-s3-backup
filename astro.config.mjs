import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import astroFormsDebug from "@astro-utils/forms/dist/integration.js";
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), astroFormsDebug],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    build: {
      target: 'esnext'
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext'
      }
    },
  }
});