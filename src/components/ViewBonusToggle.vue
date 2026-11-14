<script setup lang="ts">
// 输入 ⑥ View bonus ladder：复选（默认关）。勾选不影响 perVideo，仅结果面板追加参考行（spec §4 #6）。
// 副文案阶梯数字由 rates.VIEW_BONUS_LADDER 动态生成（数字单源，D01 §4.1）：
// `Industry-standard bonus ladder: $100 @ 100K views · $250 @ 250K · $500 @ 500K.`
import { computed } from 'vue'
import { VIEW_BONUS_HINT_PREFIX, VIEW_BONUS_LABEL, formatBonusLadderSteps } from '../copy'
import { VIEW_BONUS_LADDER } from '../rates'

const model = defineModel<boolean>({ required: true })

// 阶梯核心段共用 copy.formatBonusLadderSteps；本组件文案差异在外层拼：首项带 " views"、句号结尾。
const hint = computed(() => {
  const core = formatBonusLadderSteps(VIEW_BONUS_LADDER)
  const [first, ...rest] = core.split(' · ')
  const ladderText = rest.length > 0 ? `${first} views · ${rest.join(' · ')}` : `${first} views`
  return `${VIEW_BONUS_HINT_PREFIX} ${ladderText}.`
})
</script>

<template>
  <fieldset>
    <legend class="sr-only">View bonus ladder</legend>
    <label class="flex min-h-11 cursor-pointer items-start gap-3 py-1">
      <input
        v-model="model"
        type="checkbox"
        class="mt-0.5 size-5 shrink-0 accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      />
      <span>
        <span class="text-sm font-medium text-slate-900" :class="model ? 'font-semibold' : ''">{{ VIEW_BONUS_LABEL }}</span>
        <span class="mt-0.5 block break-words text-xs leading-4 text-slate-500">{{ hint }}</span>
      </span>
    </label>
  </fieldset>
</template>
