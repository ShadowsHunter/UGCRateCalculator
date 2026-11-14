<script setup lang="ts">
// 输入 ⑤ Influencer posting：复选 + 勾选后展开 followers 对数吸附滑块 + 实时 tier 胶囊（D02 §3.5）。
// 双 props 双 emits（D01 §4.1）；followers 值由 App 持有——关闭再开启保留上次值不重置（errata #15 ⑦）。
// tier 标签 = resolveInfluencerTier(followers) 本地 computed（组件不 import calculate）。
import { computed } from 'vue'
import { resolveInfluencerTier } from '../calc'
import {
  FOLLOWERS_LABEL,
  INFLUENCER_HINT,
  INFLUENCER_LABEL,
  TIER_RANGE_TEXT,
  formatCompactK,
  formatRangeCompact,
} from '../copy'
import { FOLLOWER_STEPS, INFLUENCER_ADDONS, TIER_LABELS } from '../rates'
import type { InfluencerTier } from '../types'

const props = defineProps<{ enabled: boolean; followers: number }>()
const emit = defineEmits<{ 'update:enabled': [value: boolean]; 'update:followers': [value: number] }>()

// FOLLOWER_STEPS 迁至 rates.ts 单源导出（10 档吸附，端点 = LIMITS.followers.min/max）。

/** followers → 吸附档 index（正常输入恒命中；防御：非常规值取不小于它的最近档，超上界归最高档） */
const stepIndex = computed(() => {
  const exact = FOLLOWER_STEPS.indexOf(props.followers)
  if (exact >= 0) return exact
  const next = FOLLOWER_STEPS.findIndex((v) => v >= props.followers)
  return next >= 0 ? next : FOLLOWER_STEPS.length - 1
})

const tier = computed<InfluencerTier>(() => resolveInfluencerTier(props.followers))

/** 胶囊文案：`Nano (1K–10K) · +$10–100 / video`（加价数字来自 rates.INFLUENCER_ADDONS，数字单源） */
const tierText = computed(
  () => `${TIER_LABELS[tier.value]} (${TIER_RANGE_TEXT[tier.value]}) · +${formatRangeCompact(INFLUENCER_ADDONS[tier.value])} / video`,
)

/** aria-valuetext（D02 §6.1）：`5,000 followers (Nano tier, +$10–100 per video)` */
const ariaValueText = computed(
  () => `${props.followers.toLocaleString('en-US')} followers (${TIER_LABELS[tier.value]} tier, +${formatRangeCompact(INFLUENCER_ADDONS[tier.value])} per video)`,
)

function onToggleEnabled(event: Event): void {
  emit('update:enabled', (event.target as HTMLInputElement).checked)
}

function onSlideFollowers(event: Event): void {
  const index = Number((event.target as HTMLInputElement).value)
  emit('update:followers', FOLLOWER_STEPS[index] ?? FOLLOWER_STEPS[0])
}
</script>

<template>
  <fieldset>
    <legend class="sr-only">Influencer posting</legend>
    <!-- 复选行：整行 label 为命中区（≥44px） -->
    <label class="flex min-h-11 cursor-pointer items-start gap-3 py-1">
      <input
        type="checkbox"
        class="mt-0.5 size-5 shrink-0 accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        :checked="enabled"
        @change="onToggleEnabled"
      />
      <span>
        <span class="text-sm font-medium text-slate-900" :class="enabled ? 'font-semibold' : ''">{{ INFLUENCER_LABEL }}</span>
        <span class="mt-0.5 block text-xs leading-4 text-slate-500">{{ INFLUENCER_HINT }}</span>
      </span>
    </label>

    <!-- 条件展开（勾选即显示，无动画）：followers 吸附滑块 + 实时 tier 胶囊 -->
    <div v-if="enabled" role="group" :aria-label="FOLLOWERS_LABEL" class="mt-3 pl-8">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-sm font-medium text-slate-600">{{ FOLLOWERS_LABEL }}</span>
        <span class="text-sm font-semibold tabular-nums text-indigo-600">{{ formatCompactK(followers) }}</span>
      </div>
      <input
        type="range"
        class="mt-1 h-11 w-full cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        :min="0"
        :max="FOLLOWER_STEPS.length - 1"
        :step="1"
        :value="stepIndex"
        :aria-valuetext="ariaValueText"
        :aria-label="FOLLOWERS_LABEL"
        @input="onSlideFollowers"
      />
      <p class="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
        {{ tierText }}
      </p>
    </div>
  </fieldset>
</template>
