import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => {
  if (mode === 'standalone') {
    return {
      plugins: [react(), viteSingleFile()],
      build: {
        outDir: 'dist-standalone',
        cssCodeSplit: false,
        assetsInlineLimit: 100000000,
        chunkSizeWarningLimit: 100000000,
        rollupOptions: { output: { inlineDynamicImports: true } },
      },
    }
  }
  return {
    plugins: [react()],
    base: '/21-Iris/',
  }
})
