<script setup lang="ts">
// SEO 内容区：3 个 H2 静态段落（H2 定稿 spec §6 不得改；正文数字与 v0.2 数据表对齐）。
import { SEO_SECTIONS } from '../copy'

// Guides: reverse internal links from the calculator homepage to blog content
// (D04 §2.1 #1/#3/#5, C-LINK@1) — prevents orphan pages; clean URLs per C-URL@1.
const GUIDES = [
  { title: 'How much to charge for UGC — the complete 2026 pricing guide', href: '/blog/how-much-to-charge-ugc' },
  { title: 'UGC usage rights pricing: 30-day, 90-day and buyout rates', href: '/blog/ugc-usage-rights-pricing' },
  { title: 'UGC pitch template: how to email brands and get responses', href: '/blog/ugc-pitch-template' },
] as const
</script>

<template>
  <section class="space-y-12">
    <article v-for="section in SEO_SECTIONS" :key="section.title">
      <h2 class="text-xl font-bold text-slate-900 sm:text-2xl">{{ section.title }}</h2>
      <p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{{ section.body }}</p>
    </article>
    <section>
      <h2 class="text-xl font-bold text-slate-900 sm:text-2xl">Guides from UGC Toolkit</h2>
      <ul class="mt-3 space-y-2">
        <li v-for="guide in GUIDES" :key="guide.href" class="text-sm leading-6 sm:text-base sm:leading-7">
          <a :href="guide.href" class="text-indigo-600 hover:underline">{{ guide.title }}</a>
        </li>
      </ul>
    </section>
  </section>
</template>