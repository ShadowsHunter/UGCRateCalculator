<script setup lang="ts">
// 输入 ② Content type：4 卡片单选 + 副文案 + "The biggest price driver" 徽章（D02 §3.2）。
// whitelisting 卡选中时追加 "Monthly model" 视觉提示（D01 §4.1：月费模型行为预告）。
import { CONTENT_CARDS, CONTENT_TYPE_BADGE, CONTENT_TYPE_LABEL, WHITELISTING_MONTHLY_MODEL_TAG } from '../copy'
import type { ContentType } from '../types'

const model = defineModel<ContentType>({ required: true })
</script>

<template>
  <fieldset>
    <legend class="mb-2 flex w-full items-center justify-between gap-2">
      <span class="text-sm font-medium text-slate-600">{{ CONTENT_TYPE_LABEL }}</span>
      <span class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        {{ CONTENT_TYPE_BADGE }}
      </span>
    </legend>
    <div class="grid grid-cols-2 gap-2 max-[349px]:grid-cols-1 md:grid-cols-4">
      <label
        v-for="card in CONTENT_CARDS"
        :key="card.value"
        class="relative flex min-h-11 cursor-pointer flex-col rounded-lg border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-600 has-[:focus-visible]:ring-offset-2"
        :class="model === card.value
          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
          : 'border-slate-300 bg-white hover:border-indigo-400'"
      >
        <input v-model="model" type="radio" :value="card.value" name="content-type" class="sr-only" />
        <span class="text-sm" :class="model === card.value ? 'font-semibold text-indigo-900' : 'font-medium text-slate-900'">
          {{ card.title }}
        </span>
        <span v-if="model === card.value && card.value === 'whitelisting'" class="mt-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
          {{ WHITELISTING_MONTHLY_MODEL_TAG }}
        </span>
        <span class="mt-1 break-words text-xs leading-4 text-slate-500" :title="card.desc">{{ card.desc }}</span>
        <span v-if="model === card.value" class="absolute right-2 top-2 text-indigo-600" aria-hidden="true">●</span>
      </label>
    </div>
  </fieldset>
</template>
