import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
      environment: 'jsdom', // или 'jsdom' 'happy-dom'
      testTimeout: 180000, // Глобальный таймаут 180 секунд
      hookTimeout: 10000, // Таймаут для beforeEach/afterEach
      globals: true,
      setupFiles: ['./tests/setup.ts'],
  },  plugins: [
    vue(),
    nodePolyfills(),
  ],
  build: {
    outDir: './dist'
  },
  base: '/wallet/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
})
