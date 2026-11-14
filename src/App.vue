<script setup lang="ts">
// App.vue —— 状态根：6 项输入 ref + input/result computed（D01 §4.2 骨架）。
// 数据流严格单向（props down / emits up），全部计算在 computed 内即时完成；
// 无 watch、无请求、无持久化（spec §4）。唯一 import calculate 的调用点。
import { computed, ref } from 'vue'
import { calculate } from './calc'
import { DEFAULT_INPUT } from './rates'
import type { CalcResult, CalculatorInput, ContentType, ExperienceTier, Platform } from './types'
import ContentTypeCards from './components/ContentTypeCards.vue'
import ExperienceCards from './components/ExperienceCards.vue'
import InfluencerToggle from './components/InfluencerToggle.vue'
import PlatformPicker from './components/PlatformPicker.vue'
import ResultPanel from './components/ResultPanel.vue'
import SeoContent from './components/SeoContent.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import VideosSlider from './components/VideosSlider.vue'
import ViewBonusToggle from './components/ViewBonusToggle.vue'
import { H1_TEXT, LEAD_TEXT, OPTIONAL_BOOSTERS_LABEL } from './copy'

// 6 项输入的唯一状态源（刷新回默认——故意的，spec §4）
const platform          = ref<Platform>(DEFAULT_INPUT.platform)               // 'tiktok'
const contentType       = ref<ContentType>(DEFAULT_INPUT.contentType)         // 'with-editing'
const experience        = ref<ExperienceTier>(DEFAULT_INPUT.experience)      // 'intermediate'
const videosPerMonth    = ref<number>(DEFAULT_INPUT.videosPerMonth)          // 8
const influencerEnabled = ref<boolean>(DEFAULT_INPUT.influencerEnabled)      // false
const followers         = ref<number>(DEFAULT_INPUT.followers)               // 5_000
const viewBonusEnabled  = ref<boolean>(DEFAULT_INPUT.viewBonusEnabled)       // false

// 注：D01 §4.2 骨架的 `const input: Readonly<CalculatorInput> = computed(...)` 外层注解在 TS 中
// 会把 ComputedRef 赋给纯类型导致编译错误，此处等价移到 lambda 返回位（值类型不变，逻辑逐行一致）。
const input = computed((): CalculatorInput => ({
  platform: platform.value,
  contentType: contentType.value,
  experience: experience.value,
  videosPerMonth: videosPerMonth.value,
  influencerEnabled: influencerEnabled.value,
  followers: followers.value,
  viewBonusEnabled: viewBonusEnabled.value,
}))

const result = computed((): CalcResult => calculate(input.value))

// followers 由 App 持有：关闭再开启 influencer 复选框保留上次值不重置（errata #15 ⑦ / D01 OQ5）
function onUpdateInfluencerEnabled(value: boolean): void {
  influencerEnabled.value = value
}
function onUpdateFollowers(value: number): void {
  followers.value = value
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 antialiased">
    <SiteHeader />
    <main class="mx-auto max-w-3xl px-4 max-[349px]:px-3 sm:px-6">
      <!-- H1 + 导语（D02 §1.2 区块 1：点明 not follower count） -->
      <section class="pb-8 pt-10 sm:pb-10 sm:pt-14">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{{ H1_TEXT }}</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{{ LEAD_TEXT }}</p>
      </section>

      <!-- 计算器卡片（白卡 shadow-sm；D02 §2.3 分组：单选组 → 量参数 → 复选组 → 输出 → 钩子框） -->
      <div class="space-y-6 rounded-xl bg-white p-5 shadow-sm sm:p-6">
        <PlatformPicker v-model="platform" />
        <ContentTypeCards v-model="contentType" />
        <ExperienceCards v-model="experience" />
        <VideosSlider v-model="videosPerMonth" />

        <!-- Optional boosters 分隔线（D02 §2.3：细分隔线 + 小节标题；装饰线对读屏隐藏，可见标签保持可及） -->
        <div class="relative py-1">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-white px-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              {{ OPTIONAL_BOOSTERS_LABEL }}
            </span>
          </div>
        </div>

        <InfluencerToggle
          :enabled="influencerEnabled"
          :followers="followers"
          @update:enabled="onUpdateInfluencerEnabled"
          @update:followers="onUpdateFollowers"
        />
        <ViewBonusToggle v-model="viewBonusEnabled" />

        <!-- 输出：深色结果面板（五状态 + CTA）+ amber 钩子框（组件内按 C→D→E 序组装） -->
        <ResultPanel :result="result" :videos-per-month="videosPerMonth" />
      </div>

      <SeoContent class="mt-12 sm:mt-16" />
      <div class="h-10 sm:h-14"></div>
    </main>
    <SiteFooter />
  </div>
</template>
