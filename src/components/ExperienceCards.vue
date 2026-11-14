<script setup lang="ts">
// 输入 ③ Experience：4 档卡片单选 + 档位定义副文案（D02 §3.3，含 v0.2 新增 premium）。
import { EXPERIENCE_CARDS, EXPERIENCE_LABEL } from '../copy'
import type { ExperienceTier } from '../types'

const model = defineModel<ExperienceTier>({ required: true })
</script>

<template>
  <fieldset>
    <legend class="mb-2 text-sm font-medium text-slate-600">{{ EXPERIENCE_LABEL }}</legend>
    <div class="grid grid-cols-2 gap-2 max-[349px]:grid-cols-1 md:grid-cols-4">
      <label
        v-for="card in EXPERIENCE_CARDS"
        :key="card.value"
        class="relative flex min-h-11 cursor-pointer flex-col justify-start rounded-lg border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-600 has-[:focus-visible]:ring-offset-2"
        :class="model === card.value
          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
          : 'border-slate-300 bg-white hover:border-indigo-400'"
      >
        <input v-model="model" type="radio" :value="card.value" name="experience" class="sr-only" />
        <span class="text-sm" :class="model === card.value ? 'font-semibold text-indigo-900' : 'font-medium text-slate-900'">
          {{ card.title }}
        </span>
        <span class="mt-1 break-words text-xs leading-4 text-slate-500" :title="card.desc">{{ card.desc }}</span>
        <span v-if="model === card.value" class="absolute right-2 top-2 text-indigo-600" aria-hidden="true">●</span>
      </label>
    </div>
  </fieldset>
</template>