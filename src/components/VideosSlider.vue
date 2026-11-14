<script setup lang="ts">
// 输入 ④ Videos per month：range 滑块 1–40（边界来自 rates.LIMITS）+ 实时数值块（D02 §3.4）。
// 命中区：input h-11（44px 垂直命中带）；数值块 tabular-nums + shrink-0 防挤压。
import { VIDEOS_LABEL, videosPerMonthLabel } from '../copy'
import { LIMITS } from '../rates'

const model = defineModel<number>({ required: true })
</script>

<template>
  <fieldset>
    <legend class="mb-2 text-sm font-medium text-slate-600">{{ VIDEOS_LABEL }}</legend>
    <div class="flex items-center gap-3">
      <input
        v-model.number="model"
        type="range"
        class="h-11 w-full cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        :min="LIMITS.videosPerMonth.min"
        :max="LIMITS.videosPerMonth.max"
        :step="1"
        :aria-label="VIDEOS_LABEL"
      />
      <output class="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-indigo-600">
        {{ videosPerMonthLabel(model) }}
      </output>
    </div>
  </fieldset>
</template>
