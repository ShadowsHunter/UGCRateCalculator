// src/calc.ts —— 全部为纯函数，无副作用、不引 Vue，可被 UI / selfcheck / 未来内容页嵌入复用（spec §5）
import { BASE_RATES, CONTENT_MULTIPLIERS, INFLUENCER_ADDONS, PLATFORM_ADJ,
         TIER_THRESHOLDS, TIER_LABELS, WHITELISTING_MONTHLY, VIEW_BONUS_LADDER, DATA_VERSION } from './rates'
import type { CalcResult, CalculatorInput, ContentType, InfluencerTier, Range } from './types'

/** 四舍五入到 $10。必须用 Math.round（half-up）：premium 带下断言 475→480 依赖此语义（见 §9-OQ4） */
export const round10 = (x: number): number => Math.round(x / 10) * 10

/** whitelisting 的 perVideo 乘数键映射 → with-usage-rights（投放授权必然包含内容复用授权，spec §4 v0.2）。
 *  calcBaseUgc 与 calculate 共用此映射；两函数的区间算术仍各自独立实现——selfcheck 断言 3 的独立性依赖此设计。 */
export const effectiveMultKey = (contentType: ContentType): Exclude<ContentType, 'whitelisting'> =>
  contentType === 'whitelisting' ? 'with-usage-rights' : contentType

/** 粉丝数 → 档位。左闭右开：[1K,10K)=nano / [10K,100K)=micro / [100K,500K)=mid / [500K,∞)=macro。
 *  followers < 1000 防御性返回 'nano'（slider min=1000，正常输入不会触达）。 */
export function resolveInfluencerTier(followers: number): InfluencerTier {
  // 从 TIER_THRESHOLDS 末尾倒序找第一个 followers >= min 的档
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    const step = TIER_THRESHOLDS[i]
    if (followers >= step.min) {
      return step.tier
    }
  }
  return 'nano' // < 1K 防御性兜底
}

/** UGC 基价部分 = base × mult × platformAdj（未取整、未加 tier 加价）。
 *  导出供 selfcheck 断言 3 做「叠加不是替换」的精确恒等验证。 */
export function calcBaseUgc(input: Pick<CalculatorInput, 'experience' | 'contentType' | 'platform'>): Range {
  const base = BASE_RATES[input.experience]
  // whitelisting 与 calculate 同规则：perVideo 按 with-usage-rights 乘数计（映射共用 effectiveMultKey）
  const mult = CONTENT_MULTIPLIERS[effectiveMultKey(input.contentType)]
  const adj = PLATFORM_ADJ[input.platform]
  return { lo: base.lo * mult.lo * adj, hi: base.hi * mult.hi * adj }
}

/** 主入口：6 项输入 → 完整输出。spec §4 公式的唯一实现。 */
export function calculate(input: CalculatorInput): CalcResult {
  const base = BASE_RATES[input.experience]

  // ★ whitelisting 特殊分支（spec §4 v0.2）：
  //   选中 whitelisting 时 perVideo 按 with-usage-rights 乘数计
  //   （投放授权必然包含内容复用授权），月费走独立字段（映射共用 effectiveMultKey）。
  const mult = CONTENT_MULTIPLIERS[effectiveMultKey(input.contentType)]
  const adj = PLATFORM_ADJ[input.platform]

  // spec 公式：lo = base[0] × mult[0] × platformAdj (+ tier.add[0] if influencerMode)
  let lo = base.lo * mult.lo * adj
  let hi = base.hi * mult.hi * adj

  // influencer 叠加（加法在 round10 之前——与 spec 公式括号位置一致）
  let tier: InfluencerTier | null = null
  if (input.influencerEnabled) {
    tier = resolveInfluencerTier(input.followers)
    lo += INFLUENCER_ADDONS[tier].lo
    hi += INFLUENCER_ADDONS[tier].hi
  }

  // round10 在加法之后（spec：perVideo = [round10(lo), round10(hi)]）
  const perVideo: Range = { lo: round10(lo), hi: round10(hi) }

  // monthly 基于取整后的 perVideo × volume —— 保证断言 2 恒等；
  // perVideo 是 10 的倍数、volume 是整数 ⇒ monthly 天然是 10 的倍数，无需二次取整
  const monthly: Range = { lo: perVideo.lo * input.videosPerMonth, hi: perVideo.hi * input.videosPerMonth }

  return {
    perVideo,
    monthly,
    whitelistingMonthly: input.contentType === 'whitelisting' ? { ...WHITELISTING_MONTHLY } : null,
    tierLabel: tier === null ? null : TIER_LABELS[tier],       // TIER_LABELS = { nano:'Nano', micro:'Micro', mid:'Mid-Tier', macro:'Macro' }
    tierAdd: tier === null ? null : { ...INFLUENCER_ADDONS[tier] },
    viewBonusLadder: input.viewBonusEnabled ? VIEW_BONUS_LADDER.map(v => ({ ...v })) : null,
    appliedMultiplier: { ...mult },
    dataVersion: DATA_VERSION,
  }
}
