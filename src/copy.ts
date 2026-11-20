// src/copy.ts —— UI 英文文案常量唯一来源（D02 §7 定稿基准）+ 全站数字呈现格式化函数。
// 数字单源约定（plan 2.3.2）：能从 rates.ts / calc.ts 取到的展示数字一律由组件动态生成；
// 写死在文案里的数字（钩子框 $100–500/mo、SEO 段区间）必须与 C2 常量逐值一致。
// 口径例外（plan 2.3-D3，errata #15 定案）：钩子框要点 1 = usage rights +30–100%+、
// exclusivity 另计 +25–100%——不采用 D02 §7 表中该行的 +25–100%（25% 下限属 exclusivity）。

import type { ContentType, ExperienceTier, InfluencerTier, Platform, Range, ViewBonusStep } from './types'

/* ---------- 通用数字呈现（全站统一，配合 tabular-nums） ---------- */

/** 整数金额 → `$1,200`（千分位，en-US） */
export function formatUsd(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

/** 区间 → `$150 – $420`（面板大字 / monthly，两侧空格 en dash） */
export function formatRangeSpaced(range: Range): string {
  return `${formatUsd(range.lo)} – ${formatUsd(range.hi)}`
}

/** 区间 → `$150–420`（紧凑 en dash，用于 +$10–100 / $100–500/mo 等） */
export function formatRangeCompact(range: Range): string {
  return `$${range.lo.toLocaleString('en-US')}–${range.hi.toLocaleString('en-US')}`
}

/** 1000→'1K' · 250000→'250K' · 999500→'1M' · 1000000→'1M'（followers / views 展示；
 *  边界：千位四舍五入进到 1000 时改渲染 M 档，[999.5K, 1M) 不再输出 "1000K"） */
export function formatCompactK(n: number): string {
  const k = Math.round(n / 1000)
  return k >= 1000 ? `${k / 1000}M` : `${k}K`
}

/** 乘数区间 → `×1.25–2.0`（whitelisting 副文案，整数位补一位小数） */
export function formatMultiplier(range: Range): string {
  const fmt = (x: number): string => (x % 1 === 0 ? x.toFixed(1) : String(x))
  return `×${fmt(range.lo)}–${fmt(range.hi)}`
}

/** `8 videos` / `1 video`（monthly 标签用，单复数处理） */
export function videosPhrase(n: number): string {
  return n === 1 ? '1 video' : `${n} videos`
}

/** `8 videos/mo` / `1 video/mo`（滑块数值块，单复数处理） */
export function videosPerMonthLabel(n: number): string {
  return n === 1 ? '1 video/mo' : `${n} videos/mo`
}

/** bonus 阶梯核心段 → `$100 @ 100K · $250 @ 250K · $500 @ 500K`（不含 "views" 措辞：
 *  ViewBonusToggle 首项带 " views"、ResultPanel 句尾带 " views" 的差异由各调用方外层拼接） */
export function formatBonusLadderSteps(ladder: readonly ViewBonusStep[]): string {
  return ladder.map((s) => `$${s.bonus} @ ${formatCompactK(s.views)}`).join(' · ')
}

/* ---------- Header / H1 导语 ---------- */

export const SITE_NAME = 'UGC Toolkit'
export const HEADER_BADGE = '2026 community pricing data'
export const H1_TEXT = 'UGC Rate Calculator'
export const LEAD_TEXT =
  'What should you charge per UGC video? Price it by what the brand actually gets — content type, usage rights, and experience — not your follower count.'

/* ---------- ① Platform ---------- */

export const PLATFORM_LABEL = 'Platform'
export const PLATFORM_OPTIONS: ReadonlyArray<{ value: Platform; label: string }> = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'ig-reels', label: 'IG Reels' },
  { value: 'yt-shorts', label: 'YouTube Shorts' },
]

/* ---------- ② Content type ---------- */

export const CONTENT_TYPE_LABEL = 'Content type'
export const CONTENT_TYPE_BADGE = 'The biggest price driver'
export const CONTENT_CARDS: ReadonlyArray<{ value: ContentType; title: string; desc: string }> = [
  {
    value: 'raw-footage',
    title: 'Raw footage',
    desc: 'You film, the brand edits. Brands pay extra for raw, unfiltered clips.',
  },
  {
    value: 'with-editing',
    title: 'With editing',
    desc: 'Edited, captioned, ready to post. The standard UGC deliverable.',
  },
  {
    value: 'with-usage-rights',
    title: 'With usage rights',
    desc: 'The brand can reuse your video in its own ads. Charged on top of your base rate.',
  },
  {
    value: 'whitelisting',
    title: 'Whitelisting',
    desc: 'The brand runs your video as paid ads from your handle. Priced as a monthly fee — see your results.',
  },
]

/** whitelisting 卡选中时的月费模型视觉提示标签（ContentTypeCards 行为预告，D01 §4.1） */
export const WHITELISTING_MONTHLY_MODEL_TAG = 'Monthly model'

/* ---------- ③ Experience ---------- */

export const EXPERIENCE_LABEL = 'Experience'
export const EXPERIENCE_CARDS: ReadonlyArray<{ value: ExperienceTier; title: string; desc: string }> = [
  { value: 'beginner', title: 'Beginner', desc: 'Under 6 months · a few paid deals' },
  { value: 'intermediate', title: 'Intermediate', desc: 'Solid portfolio · repeat clients' },
  { value: 'advanced', title: 'Advanced', desc: 'Proven results · niche authority' },
  { value: 'premium', title: 'Premium', desc: 'Niche authority · case studies with brands' },
]

/* ---------- ④ Videos per month ---------- */

export const VIDEOS_LABEL = 'Videos per month'

/* ---------- Optional boosters 小节标题 ---------- */

export const OPTIONAL_BOOSTERS_LABEL = 'Optional boosters'

/* ---------- ⑤ Influencer posting ---------- */

export const INFLUENCER_LABEL = "I'll post from my own account"
export const INFLUENCER_HINT =
  'Adds a distribution fee on top of your UGC rate — the only place followers matter.'
export const FOLLOWERS_LABEL = 'Followers'
/** InfluencerToggle tier 胶囊的档位范围文本（与 TIER_THRESHOLDS 左闭右开区间一致） */
export const TIER_RANGE_TEXT: Record<InfluencerTier, string> = {
  nano: '1K–10K',
  micro: '10K–100K',
  mid: '100K–500K',
  macro: '500K+',
}

/* ---------- ⑥ View bonus ladder ---------- */

export const VIEW_BONUS_LABEL = 'Add performance bonuses to your deals'
/** 副文案前缀；阶梯数字由 rates.VIEW_BONUS_LADDER 动态生成（数字单源） */
export const VIEW_BONUS_HINT_PREFIX = 'Industry-standard bonus ladder:'

/* ---------- 结果面板（标签 + 追加行文案骨架；数值全部来自 CalcResult） ---------- */

export const RESULT_LABEL_PER_VIDEO = 'Suggested rate per video'
export const RESULT_LABEL_MONTHLY_PREFIX = 'Monthly income at'
/** 状态 D：`Whitelisting: $100–500/mo per platform`（区间动态生成） */
export const WHITELISTING_LINE_PREFIX = 'Whitelisting:'
export const WHITELISTING_LINE_SUFFIX = '/mo per platform'
export const WHITELISTING_NOTE = 'billed monthly, on top of your video rate'
/** whitelisting 选中时的乘数副文案前缀（D01 §3.4 appliedMultiplier 映射） */
export const WHITELISTING_MULTIPLIER_NOTE_PREFIX = 'per-video rate priced with usage-rights multiplier'
/** 状态 E：`Performance bonus reference: $100 @ 100K · $250 @ 250K · $500 @ 500K views` */
export const BONUS_REF_PREFIX = 'Performance bonus reference:'
export const BONUS_REF_SUFFIX = 'views'
export const BONUS_REF_NOTE = '(the deal ladder viral.app recommends)'

/* ---------- $9 CTA（D02 §4.6 方案 B，v1 默认） ---------- */

export const CTA_HEADLINE = 'You know your rate — now land the deal.'
export const CTA_BUTTON = 'Land the deal — $9 Pitch Pack'
export const CTA_SECONDARY =
  'Everything for your next pitch: cold pitch emails · a rate card · negotiation scripts. Instant download.'
/** social proof 仅单价锚点，禁伪造销量（D02 §4.6 红线） */
export const CTA_SOCIAL_PROOF =
  '13 pitch, follow-up & negotiation templates + a data-backed rate card — $9.'
/** gumroad 外链：$9 Pitch Template Pack 产品直达链接（jlfmgx，2026-11-20 上架，替换原店铺主页） */
export const GUMROAD_URL = 'https://ugctoolkit.gumroad.com/l/jlfmgx'

/* ---------- 钩子框（amber，D02 §4.8；要点 1 口径 = errata #15 / plan 2.3-D3） ---------- */

export const HOOK_TITLE = 'How to raise your rates'
export const HOOK_THESIS = 'Sell the rights, not the videos.'
/**
 * 要点 1：usage rights +30–100%+（30 天 +30–50%、90 天–12 月 +50–100%、buyout +100%+），
 * exclusivity 另计 +25–100%（spec v0.2 §4 钩子框原文 / errata #15 ⑤）。
 */
export const HOOK_POINTS: readonly string[] = [
  'Usage rights are a separate line item — charge +30–100%+ on top of your base rate, plus +25–100% more for exclusivity.',
  'Whitelisting adds $100–500/mo per platform — same video, recurring revenue.',
  'Stack them and a single deal can double, with zero extra filming.',
]
export const HOOK_REQUOTE = 'Re-quote repeat clients every 90 days — your rate should grow with your portfolio.'

/* ---------- SEO 三段（H2 定稿，spec §6 不得改；数字与 v0.2 数据表对齐） ---------- */

export const SEO_SECTIONS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'How UGC rates work',
    body:
      "A UGC rate isn't one number — it's your base rate multiplied by what the brand can do with your content. " +
      'Most creators start with an edited, ready-to-post video, then charge more for usage rights — typically +30–100%+ depending on license length, from a 30-day window to a full buyout. ' +
      'Exclusivity and whitelisting are priced separately, which is why two creators with identical portfolios can quote very different numbers.',
  },
  {
    title: 'Average UGC rates in 2026',
    body:
      'In 2026, UGC creators charge anywhere from $75 to $1,000+ per video — beginners start at $75–250, while premium creators with brand case studies command $500–1,000+. ' +
      'Most working creators land in the $150–300 range for a standard edited video. ' +
      'Adding influencer posting from your own account can add another $10–8,000 per video depending on audience size.',
  },
  {
    title: "Followers don't matter (usually)",
    body:
      'UGC pricing is based on your content and the rights you sell — not your audience size. Brands pay for the video, not your reach. ' +
      'The one exception: if you also post from your own account, your follower count determines the distribution fee on top of your base rate. ' +
      "That's why this calculator asks about content and rights first — and only asks for followers when you choose to post.",
  },
]

/* ---------- Footer ---------- */

export const FOOTER_DISCLAIMER = 'Estimates based on community pricing data — verify against your niche.'
export const FOOTER_NOT_ADVICE = 'Not financial advice.'
export const FOOTER_COPYRIGHT = '© 2026 UGC Toolkit'
export const FOOTER_PRIVACY_LINK = 'Privacy Policy'
export const FOOTER_TERMS_LINK = 'Terms of Service'
export const CCPA_LINK_TEXT = 'Do Not Sell or Share My Personal Information'
/** CCPA 退出链接目标（plan 2.3-D4：v1 指向 /privacy#ccpa，M1 替换官方链接） */
export const CCPA_LINK_HREF = '/privacy#ccpa'
export const AFFILIATE_DISCLOSURE =
  'Affiliate disclosure: this site may earn a commission from qualifying purchases made through links on this page — at no extra cost to you.'
