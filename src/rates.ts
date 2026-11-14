// src/rates.ts —— 费率常量唯一来源。逐字段对应 spec v0.2 §3.1–§3.4（2026-11 修订值）。
// 数值核验状态见 doc/research/01-data-verification.md；本文件注释即「来源链」，改动数值必须同步 spec。

import type {
  CalculatorInput, ContentType, ExperienceTier, InfluencerTier, Platform, Range, ViewBonusStep,
} from './types'

/**
 * 数据版本。费率更新时：改这里 + 改对应常量 + selfcheck 市场带断言值 + spec 升版
 * + copy.ts 中写死的文案数字（SEO_SECTIONS 区间 / HOOK_POINTS 的 $100–500/mo、$10–8,000）。
 * '2026-11' 对应 spec v0.2 的费率基准期。
 */
export const DATA_VERSION = '2026-11'

/** §3.1 基础价（raw footage 档，USD [lo, hi]） */
export const BASE_RATES: Record<ExperienceTier, Range> = {
  beginner:     { lo: 75,  hi: 250 },  // v0.2：下限自 100 下调（merra organic $75–150 等 3/4 来源下限<$100；research/01 §2.1 / §3.2 #5）
  intermediate: { lo: 150, hi: 350 },  // v0.1 不变，多源一致（vicomma $150–400 / merra $150–300；research/01 §2.1）
  advanced:     { lo: 250, hi: 600 },  // v0.2：上限自 500 上调（vicomma experienced $400–1000+ / ugcroster $500+，保守取 600；research/01 §3.2 #6）
  premium:      { lo: 500, hi: 1000 }, // v0.2 新增档（source: merra.ai premium $500–1000）
}

/** §3.2 内容类型乘数（叠加在基础价上）。whitelisting 除外——见 WHITELISTING_MONTHLY。 */
export const CONTENT_MULTIPLIERS: Record<Exclude<ContentType, 'whitelisting'>, Range> = {
  'raw-footage':      { lo: 1.0,  hi: 1.3 },  // v0.2 方向性纠错：品牌为原始素材付溢价 +20–30%（merra / vicomma +$50–150 / Insense；research/01 §2.2 / §3.2 #1）
  'with-editing':     { lo: 1.0,  hi: 1.2 },  // 标准交付（剪好+字幕）；v0.1 不变
  'with-usage-rights': { lo: 1.25, hi: 2.0 }, // usage rights 分档计价 30 天 +30–50% / 90 天–12 月 +50–100% / buyout +100%+（vicomma）；Collabstr 2025 实测均值 +39%（$307 vs $221）
}

/**
 * §3.2 whitelisting：v0.2 从乘数 [1.5,2.3] 改为月费模型（按月授权计价，不计入 perVideo 乘数）。
 * source: vicomma $100–500/mo/平台、Insense $100–150/mo、afluencer $100–1500+/mo。
 * UI 语义：仅当用户选中 whitelisting 卡片时，输出面板追加独立月费行。
 */
export const WHITELISTING_MONTHLY: Range = { lo: 100, hi: 500 }

/**
 * §3.3 平台微调 —— ⚠️ heuristic：无独立数据佐证、方向存疑
 * （Collabstr 平台均价 YT $311 > IG $214 > TikTok $182，不支持 YT 最低；research/01 §2.3 / §3.2 #11）。
 * spec 决策：保留但行首标注 heuristic。不得在 UI 中作为「数据结论」展示。
 */
export const PLATFORM_ADJ: Record<Platform, number> = {
  tiktok:    1.0,
  'ig-reels': 1.05,  // 交付规格通常更繁
  'yt-shorts': 0.95,
}

/** §3.4 Influencer posting 加价（叠加在 UGC 制作费之上 = 分发费，不是替换）。v0.2 全档重标定（v0.1 虚高 5–10 倍）。 */
export const INFLUENCER_ADDONS: Record<InfluencerTier, Range> = {
  nano:  { lo: 10,   hi: 100 },  // afluencer 重标定（research/01 §3.2 #2）
  micro: { lo: 100,  hi: 800 },  // afluencer 重标定（research/01 §3.2 #2）
  mid:   { lo: 500,  hi: 2000 }, // inferred：加价 ≈ afluencer 同档单帖总价的 40–50%
  macro: { lo: 2000, hi: 8000 }, // inferred：同上
}
// 来源注（afluencer.com/blog/influencer-rates，五档单帖总价）：Nano $5–100 / Micro $50–1000 / Mid $800–5000 / Macro $4000–10000

/** §3.4 粉丝档判定边界（左闭右开：nano [1K,10K) / micro [10K,100K) / mid [100K,500K) / macro [500K,∞)） */
export const TIER_THRESHOLDS: readonly { tier: InfluencerTier; min: number }[] = [
  { tier: 'nano',  min: 1_000 },
  { tier: 'micro', min: 10_000 },
  { tier: 'mid',   min: 100_000 },
  { tier: 'macro', min: 500_000 },
]

/** §3.4 粉丝档展示标签（plan 2.3-D2 定案：由 rates.ts 导出，calc.ts 的 calculate 与 InfluencerToggle.vue 两处消费，归数据层避免 calc↔UI 耦合） */
export const TIER_LABELS: Record<InfluencerTier, string> = {
  nano: 'Nano',
  micro: 'Micro',
  mid: 'Mid-Tier',
  macro: 'Macro',
}

/** followers 对数吸附档（D02 §3.5）：InfluencerToggle 滑块在此 10 档 index 上移动，映射回真实粉丝数。
 *  端点 = LIMITS.followers.min/max；TIER_THRESHOLDS 的全部 tier 边界（1K/10K/100K/500K）均为吸附档。 */
export const FOLLOWER_STEPS: readonly number[] = [
  1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 250_000, 500_000, 1_000_000,
]

/** §4 输入 #6 view bonus ladder（纯参考展示，不进公式；source: viral.app 推荐行业标准 deal，research/02 §4.4） */
export const VIEW_BONUS_LADDER: readonly ViewBonusStep[] = [
  { views: 100_000, bonus: 100 },
  { views: 250_000, bonus: 250 },
  { views: 500_000, bonus: 500 },
]

/** §4 输入默认值（刷新即回默认，故意无持久化） */
export const DEFAULT_INPUT: CalculatorInput = {
  platform: 'tiktok',
  contentType: 'with-editing',
  experience: 'intermediate',
  videosPerMonth: 8,
  influencerEnabled: false,
  followers: 5_000,
  viewBonusEnabled: false,
}

/** §4 输入 slider 边界（组件 props 与 selfcheck 边界采样共用） */
export const LIMITS = {
  videosPerMonth: { min: 1, max: 40, default: 8 },
  followers: { min: 1_000, max: 1_000_000, default: 5_000 },
} as const
