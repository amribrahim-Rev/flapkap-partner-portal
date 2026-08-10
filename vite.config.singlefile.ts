import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Produces one self-contained index.html — JS, CSS and fonts all inlined —
 * so the portal can be dropped on any static host with no asset paths to
 * resolve and no external requests to be blocked by a CSP.
 *
 *   npx vite build --config vite.config.singlefile.ts
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
    // Inline every asset, fonts included, regardless of size.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    // One chunk; the plugin cannot inline a lazily-fetched second file.
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
