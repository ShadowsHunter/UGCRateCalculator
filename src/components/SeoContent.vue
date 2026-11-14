<script setup lang="ts">
// SEO 内容区：3 个 H2 静态段落（H2 定稿 spec §6 不得改；正文数字与 v0.2 数据表对齐）。
import { SEO_SECTIONS } from '../copy'
</script>

<template>
  <section class="space-y-12">
    <article v-for="section in SEO_SECTIONS" :key="section.title">
      <h2 class="text-xl font-bold text-slate-900 sm:text-2xl">{{ section.title }}</h2>
      <p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{{ section.body }}</p>
    </article>
  </section>
</template>