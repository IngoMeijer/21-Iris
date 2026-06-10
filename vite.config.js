import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => ({
  plugins: mode === 'standalone' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'standalone'
    ? {
        outDir: 'dist-standalone',
        cssCodeSplit: false,
        assetsInlineLimit: 100000000,
        chunkSizeWarningLimit: 100000000,
        rollupOptions: { output: { inlineDynamicImports: true } },
      }
    : {},
}))
