// src/types.ts —— 全部类型定义。数值与语义见 rates.ts 注释，此处只定形状。

/** 经验档位（spec v0.2 §3.1，四档） */
export type ExperienceTier = 'beginner' | 'intermediate' | 'advanced' | 'premium'

/** 内容类型（spec v0.2 §3.2，四档；whitelisting 走月费模型，不进 perVideo 乘数） */
export type ContentType = 'raw-footage' | 'with-editing' | 'with-usage-rights' | 'whitelisting'

/** 发布平台（spec v0.2 §3.3） */
export type Platform = 'tiktok' | 'ig-reels' | 'yt-shorts'

/** 粉丝档（spec v0.2 §3.4，仅 influencer 模式使用） */
export type InfluencerTier = 'nano' | 'micro' | 'mid' | 'macro'

/** 闭区间。不变量：lo ≤ hi 恒成立；金额单位 USD，乘数无量纲 */
export interface Range {
  lo: number
  hi: number
}

/** 计算器全部 6 项输入（spec v0.2 §4；一项不缺、一项不加） */
export interface CalculatorInput {
  platform: Platform
  contentType: ContentType
  experience: ExperienceTier
  /** 月产量，slider 范围 1–40，默认 8 */
  videosPerMonth: number
  /** influencer 分发加价开关，默认 false */
  influencerEnabled: boolean
  /** 粉丝数，slider 范围 1_000–1_000_000，默认 5_000；仅 influencerEnabled 时参与计算 */
  followers: number
  /** view bonus ladder 参考行开关，默认 false；纯展示，不进公式 */
  viewBonusEnabled: boolean
}

/** view bonus 阶梯单级（spec §4 输入 #6） */
export interface ViewBonusStep {
  /** 达标播放量门槛，如 100_000 */
  views: number
  /** 对应 bonus，USD */
  bonus: number
}

/** 计算输出 —— 与 ResultPanel 展示字段一一对应，接口即契约（spec §4 输出面板） */
export interface CalcResult {
  /** 每条视频建议费率区间（已 round10 取整到 $10）——面板大字 */
  perVideo: Range
  /** 月收入区间 = perVideo × videosPerMonth（基于取整后 perVideo，保证恒等断言） */
  monthly: Range
  /** whitelisting 月费参考区间 $100–500；仅 contentType === 'whitelisting' 时非 null */
  whitelistingMonthly: Range | null
  /** influencer 粉丝档展示标签（'Nano' / 'Micro' / 'Mid-Tier' / 'Macro'）；仅 influencerEnabled 时非 null */
  tierLabel: string | null
  /** influencer 档加价区间；仅 influencerEnabled 时非 null（面板可展示 "+$100–800 distribution"） */
  tierAdd: Range | null
  /** view bonus 阶梯参考数据；仅 viewBonusEnabled 时非 null */
  viewBonusLadder: ViewBonusStep[] | null
  /** 本次计算实际应用的内容乘数：whitelisting 时回显 with-usage-rights 的乘数（UI 副文案用） */
  appliedMultiplier: Range
  /** 数据版本戳，来自 rates.DATA_VERSION（如 '2026-11'），供 UI 页脚/调试展示 */
  dataVersion: string
}
