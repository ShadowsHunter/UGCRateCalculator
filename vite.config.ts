import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    // 默认 target/csr 即可；无 lib 模式、无 SSR
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        // 404.html 是 CF Pages 约定的 404 fallback，经构建产出 dist/404.html
        notFound: resolve(__dirname, '404.html'),
        // /blog/ 内容页（静态多页 HTML；文件名须与 URL slug 一致，连字符为获批例外）
        guide1: resolve(__dirname, 'blog/how-much-to-charge-ugc.html'),
        guide2: resolve(__dirname, 'blog/ugc-rates-per-video.html'),
        guide3: resolve(__dirname, 'blog/ugc-usage-rights-pricing.html'),
        guide5: resolve(__dirname, 'blog/ugc-pitch-template.html'),
        guide4: resolve(__dirname, 'blog/ugc-whitelisting-rates.html'),
        guide6: resolve(__dirname, 'blog/negotiate-ugc-rates.html'),
        guide7: resolve(__dirname, 'blog/do-ugc-creators-need-followers.html'),
        guide8: resolve(__dirname, 'blog/ugc-rates-fiverr-vs-direct.html'),
        guide9: resolve(__dirname, 'blog/ugc-portfolio-examples.html'),
        guide10: resolve(__dirname, 'blog/ugc-view-bonus-deals.html'),
      },
    },
  },
})