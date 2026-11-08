import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'

export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1500 },
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [[rehypeKatex, { strict: false }]], providerImportSource: '@mdx-js/react' }) },
    react({ include: /\.(jsx|js|mdx|md)$/ }),
  ],
})
