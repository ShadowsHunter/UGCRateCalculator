<script setup lang="ts">
// 品牌头（D02 §2.1 [H]）：sticky h-14 白底 + 数据徽章（信任锚，P1）。纯静态。
import { HEADER_BADGE, SITE_NAME } from '../copy'
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95">
    <div class="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 max-[349px]:px-3 sm:px-6">
      <a href="/" class="flex h-11 items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
        <span class="size-2.5 rounded-full bg-indigo-600" aria-hidden="true"></span>
        {{ SITE_NAME }}
      </a>
      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{{ HEADER_BADGE }}</span>
    </div>
  </header>
</template>