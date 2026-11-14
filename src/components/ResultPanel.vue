<script setup lang="ts">
// 输出面板（五状态，D02 §4）+ $9 CTA 位（§4.6 方案 B）+ amber 钩子框（§4.8，面板之后、卡片底部）。
// 追加行 C(tier 胶囊) / D(月费行) / E(bonus 参考行) 正交可组合，按 C→D→E 顺序渲染，null 整行不渲染。
// live region 策略（D02 §6.1 实现注记）：sr-only 播报节点覆盖「标签+数字+追加行」，
// CTA 置于 live region 外（aria-atomic 重播不携带营销文案）。
import { computed } from 'vue'
import {
  BONUS_REF_NOTE,
  BONUS_REF_PREFIX,
  BONUS_REF_SUFFIX,
  CTA_BUTTON,
  CTA_HEADLINE,
  CTA_SECONDARY,
  CTA_SOCIAL_PROOF,
  GUMROAD_URL,
  HOOK_POINTS,
  HOOK_REQUOTE,
  HOOK_THESIS,
  HOOK_TITLE,
  RESULT_LABEL_MONTHLY_PREFIX,
  RESULT_LABEL_PER_VIDEO,
  WHITELISTING_LINE_PREFIX,
  WHITELISTING_LINE_SUFFIX,
  WHITELISTING_MULTIPLIER_NOTE_PREFIX,
  WHITELISTING_NOTE,
  formatBonusLadderSteps,
  formatCompactK,
  formatMultiplier,
  formatRangeCompact,
  formatRangeSpaced,
  formatUsd,
  videosPhrase,
} from '../copy'
import type { CalcResult } from '../types'

const props = defineProps<{ result: CalcResult; videosPerMonth: number }>()

/* ----- 动态行文案（数字单源：全部来自 CalcResult，null 时整行不渲染） ----- */

/** 状态 C：`Nano audience boost · +$10–100 per video` */
const tierLine = computed(() => {
  if (props.result.tierLabel === null || props.result.tierAdd === null) return null
  return `${props.result.tierLabel} audience boost · +${formatRangeCompact(props.result.tierAdd)} per video`
})

/** 状态 D：`Whitelisting: $100–500/mo per platform` */
const whitelistingLine = computed(() => {
  if (props.result.whitelistingMonthly === null) return null
  return `${WHITELISTING_LINE_PREFIX} ${formatRangeCompact(props.result.whitelistingMonthly)}${WHITELISTING_LINE_SUFFIX}`
})

/** 状态 E：`Performance bonus reference: $100 @ 100K · $250 @ 250K · $500 @ 500K views`（核心段共用 formatBonusLadderSteps） */
const bonusLine = computed(() => {
  if (props.result.viewBonusLadder === null) return null
  return `${BONUS_REF_PREFIX} ${formatBonusLadderSteps(props.result.viewBonusLadder)} ${BONUS_REF_SUFFIX}`
})

/** whitelisting 选中时的乘数副文案（D01 §3.4 appliedMultiplier 映射）：`... ×1.25–2.0` */
const multiplierNote = computed(
  () => `${WHITELISTING_MULTIPLIER_NOTE_PREFIX} ${formatMultiplier(props.result.appliedMultiplier)}`,
)

/** sr-only 播报串（D02 §6.1）：区间读作 "to"；tier 开时先播 tier 名 */
const announcement = computed(() => {
  const r = props.result
  const parts: string[] = []
  if (r.tierLabel !== null && r.tierAdd !== null) {
    parts.push(`${r.tierLabel} audience boost, +${formatUsd(r.tierAdd.lo)} to ${formatUsd(r.tierAdd.hi)} per video.`)
  }
  parts.push(`Suggested rate ${formatUsd(r.perVideo.lo)} to ${formatUsd(r.perVideo.hi)} per video.`)
  parts.push(
    `Monthly income ${formatUsd(r.monthly.lo)} to ${formatUsd(r.monthly.hi)} at ${videosPhrase(props.videosPerMonth)}.`,
  )
  if (r.whitelistingMonthly !== null) {
    parts.push(
      `Whitelisting adds ${formatUsd(r.whitelistingMonthly.lo)} to ${formatUsd(r.whitelistingMonthly.hi)} per month per platform.`,
    )
  }
  if (r.viewBonusLadder !== null) {
    parts.push(
      `Performance bonus reference: ${r.viewBonusLadder.map((s) => `${formatUsd(s.bonus)} at ${formatCompactK(s.views)} views`).join(', ')}.`,
    )
  }
  return parts.join(' ')
})
</script>

<template>
  <div>
    <!-- 深色结果面板：全页唯一 slate-900 深色块 + 唯一 shadow-lg（D02 §5） -->
    <section class="rounded-xl bg-slate-900 p-5 text-white shadow-lg sm:p-6">
      <!-- live region 仅数字区（sr-only 播报节点；CTA 在其外） -->
      <p class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</p>

      <p class="text-sm font-medium text-slate-300">{{ RESULT_LABEL_PER_VIDEO }}</p>
      <p class="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
        {{ formatRangeSpaced(result.perVideo) }}
      </p>

      <!-- $9 CTA 位（D02 §4.6 方案 B）：结果数字正下方、monthly 行之前 -->
      <div class="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
        <p class="text-base font-semibold text-white">{{ CTA_HEADLINE }}</p>
        <a
          :href="GUMROAD_URL"
          target="_blank"
          rel="noopener"
          class="mt-2 flex min-h-12 w-full items-center justify-center rounded-lg bg-amber-400 px-4 text-center text-sm font-bold text-slate-900 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >{{ CTA_BUTTON }}</a>
        <p class="mt-2 text-xs leading-4 text-slate-300">{{ CTA_SECONDARY }}</p>
        <p class="mt-1 text-xs font-medium text-slate-400">{{ CTA_SOCIAL_PROOF }}</p>
      </div>

      <p class="mt-4 text-sm font-medium text-slate-300">
        {{ RESULT_LABEL_MONTHLY_PREFIX }} {{ videosPhrase(videosPerMonth) }}
      </p>
      <p class="mt-1 text-xl font-semibold tabular-nums">{{ formatRangeSpaced(result.monthly) }}</p>

      <!-- 追加行（正交组合，C→D→E 序） -->
      <p
        v-if="tierLine"
        class="mt-4 inline-flex items-center rounded-full border border-indigo-400/40 bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200"
      >
        {{ tierLine }}
      </p>

      <div v-if="whitelistingLine" class="mt-4 border-t border-white/10 pt-3">
        <p class="text-sm font-medium">{{ whitelistingLine }}</p>
        <p class="mt-0.5 text-xs text-slate-400">{{ WHITELISTING_NOTE }}</p>
        <p class="mt-0.5 text-xs text-slate-400">{{ multiplierNote }}</p>
      </div>

      <p v-if="bonusLine" class="mt-4 border-t border-white/10 pt-3 text-sm text-slate-300">
        <span aria-hidden="true">💰 </span>{{ bonusLine }} <span class="text-slate-400">{{ BONUS_REF_NOTE }}</span>
      </p>

      <p class="mt-4 text-right text-xs text-slate-400">{{ result.dataVersion }} community pricing data</p>
    </section>

    <!-- amber 钩子框（D02 §4.8）：结果面板之后、计算器卡片底部；要点 1 口径 = errata #15 / plan 2.3-D3 -->
    <section class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <p class="text-sm font-semibold text-amber-800"><span aria-hidden="true">⚡ </span>{{ HOOK_TITLE }}</p>
      <p class="mt-1 text-base font-semibold text-amber-900">{{ HOOK_THESIS }}</p>
      <ul class="mt-3 space-y-1.5">
        <li v-for="(point, i) in HOOK_POINTS" :key="i" class="flex gap-2 text-sm leading-5 text-amber-800">
          <span class="shrink-0 font-bold text-amber-700" aria-hidden="true">·</span>
          <span>{{ point }}</span>
        </li>
      </ul>
      <p class="mt-4 border-t border-amber-200 pt-3 text-xs italic leading-5 text-amber-800">{{ HOOK_REQUOTE }}</p>
    </section>
  </div>
</template>
