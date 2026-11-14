<script setup lang="ts">
// 页脚：免责 + 版权 + 合规链接组（/privacy、/terms、CCPA 退出链接 /privacy#ccpa，plan 2.3-D4）
// + 联盟披露声明（spec §2 errata #15）。链接命中区 min-h-11。
import {
  AFFILIATE_DISCLOSURE,
  CCPA_LINK_HREF,
  CCPA_LINK_TEXT,
  FOOTER_COPYRIGHT,
  FOOTER_DISCLAIMER,
  FOOTER_NOT_ADVICE,
  FOOTER_PRIVACY_LINK,
  FOOTER_TERMS_LINK,
} from '../copy'
</script>

<template>
  <footer class="border-t border-slate-200 bg-white">
    <div class="mx-auto max-w-3xl space-y-3 px-4 max-[349px]:px-3 py-8 sm:px-6">
      <p class="text-xs leading-5 text-slate-500">
        {{ FOOTER_DISCLAIMER }} {{ FOOTER_NOT_ADVICE }} {{ FOOTER_COPYRIGHT }}
      </p>
      <nav aria-label="Legal" class="flex flex-col items-start gap-y-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
        <a
          href="/privacy"
          class="inline-flex min-h-11 items-center text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline sm:text-sm"
        >{{ FOOTER_PRIVACY_LINK }}</a>
        <a
          href="/terms"
          class="inline-flex min-h-11 items-center text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline sm:text-sm"
        >{{ FOOTER_TERMS_LINK }}</a>
        <a
          :href="CCPA_LINK_HREF"
          class="inline-flex min-h-11 items-center text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline sm:text-sm"
        >{{ CCPA_LINK_TEXT }}</a>
      </nav>
      <p class="text-xs leading-5 text-slate-500">{{ AFFILIATE_DISCLOSURE }}</p>
    </div>
  </footer>
</template>