// src/selfcheck.ts —— 全项目业务正确性门：无测试框架，`pnpm check`（= tsx src/selfcheck.ts）直跑。
// 权威依据：spec v0.2 §8（断言口径）· D01 §5（实现要点 + §5.2 遍历空间全表）· plan 2.2-C4（契约）+ 2.3-D1（锚点定案）。
// 退出码 0 = 全过；任一断言失败打印「断言 N · 描述 · 首个失败组合 input 快照 + 期望 vs 实际」并置 process.exitCode = 1。
//
// 结构总览（恰好 4 条业务断言，一条不多一条不少，与 spec §8 一一对应）：
//   断言 1 · 乘数档位中值序（常量层 + 结果层）
//   断言 2 · monthly ≡ perVideo × videosPerMonth 全组合严格恒等（===）
//   断言 3 · influencer 叠加非替换（round10 前基价 + tier 加价）
//   断言 4 · 市场带（48 组合带边界）+ tiktok 锚点（期望 80，plan 2.3-D1）
// 另按 D01 §5.2 附加 resolveInfluencerTier 11 采样点判定检查（tier 判定覆盖，不计入 4 断言口径）。
//
// 全遍历空间（D01 §5.2 全表，全组合笛卡尔积、不用抽样）：
//   4 经验 × 4 内容 × 3 平台 × 40 产量 × (1 + 11 followers 档) × 2 bonus = 46,080 次 calculate。

import { calcBaseUgc, calculate, resolveInfluencerTier, round10 } from './calc'
import { CONTENT_MULTIPLIERS, DATA_VERSION, DEFAULT_INPUT, INFLUENCER_ADDONS } from './rates'
import type { CalculatorInput, ContentType, ExperienceTier, InfluencerTier, Platform, Range } from './types'

// tsconfig 的 types 仅含 vite/client（工程无 @types/node），而本文件是 tsx/Node 运行入口：
// 在此局部声明用到的 Node 全局。declare 仅作用于类型层，编译擦除后落到运行时真实全局 process。
declare const process: { exitCode: number }

// ---------- 遍历维度（D01 §5.2 全表） ----------

const EXPERIENCES: readonly ExperienceTier[] = ['beginner', 'intermediate', 'advanced', 'premium']
const CONTENT_TYPES: readonly ContentType[] = ['raw-footage', 'with-editing', 'with-usage-rights', 'whitelisting']
const PLATFORMS: readonly Platform[] = ['tiktok', 'ig-reels', 'yt-shorts']
/** 月产量 1–40 全整数（slider 全区间） */
const VOLUMES: readonly number[] = Array.from({ length: 40 }, (_, i) => i + 1)
/** influencer 开启时的 followers 边界 + 代表点（与 tier 采样点同集）。
 *  边界点与 rates.TIER_THRESHOLDS 对应，改阈值需同步本数组。 */
const FOLLOWERS_SAMPLES: readonly number[] = [
  999, 1_000, 5_000, 9_999, 10_000, 50_000, 99_999, 100_000, 499_999, 500_000, 1_000_000,
]

/** 全遍历组合总数 = 4×4×3×40×(1+11)×2 = 46,080。断言 2 内校验实际遍历计数与此一致（空间契约自检）。 */
const TOTAL_COMBINATIONS = 4 * 4 * 3 * 40 * (1 + FOLLOWERS_SAMPLES.length) * 2

/** influencer 开启的组合数 = 4×4×3×40×11×2 = 42,240（断言 3 的遍历范围；与关闭的 3,840 组合合计 46,080） */
const INFLUENCER_COMBINATIONS = 4 * 4 * 3 * 40 * FOLLOWERS_SAMPLES.length * 2

/** 区间中值 */
const mid = (r: Range): number => (r.lo + r.hi) / 2

/** 构造 CalculatorInput 的便捷工厂：未指定字段取 DEFAULT_INPUT 对应值（partial 明示关键条件） */
function makeInput(partial: Partial<CalculatorInput>): CalculatorInput {
  return { ...DEFAULT_INPUT, ...partial }
}

/** 断言失败：抛出携带「首个反例 input 快照 + 期望 vs 实际」的错误，由 runBlock 的 try/catch 统一打印 */
function fail(desc: string, expected: string, actual: string, input?: CalculatorInput): never {
  const snap = input === undefined ? '' : `\n    input: ${JSON.stringify(input)}`
  throw new Error(`${desc}${snap}\n    期望: ${expected}\n    实际: ${actual}`)
}

/** 每断言一个 try/catch：失败打印首反例并置 process.exitCode = 1；通过打一行 ✓。不 console.table 全结果（只报首个反例）。 */
let allPassed = true
function runBlock(label: string, body: () => void): void {
  try {
    body()
    console.log(`✓ ${label}`)
  } catch (e) {
    allPassed = false
    process.exitCode = 1
    console.error(`❌ ${label}\n  ${(e instanceof Error ? e.message : String(e))}`)
  }
}

// =====================================================================
// 断言 1 · 乘数档位中值序（usage > raw 且 usage > editing，常量层 + 结果层）
// =====================================================================
runBlock('断言 1 · 乘数档位中值序（usage > raw 且 usage > editing）', () => {
  // 常量层：CONTENT_MULTIPLIERS 中值序 usage(1.625) > raw(1.15) 且 > editing(1.10)
  const midUsage = mid(CONTENT_MULTIPLIERS['with-usage-rights']) // (1.25+2.0)/2 = 1.625
  const midRaw = mid(CONTENT_MULTIPLIERS['raw-footage']) // (1.0+1.3)/2 = 1.15
  const midEditing = mid(CONTENT_MULTIPLIERS['with-editing']) // (1.0+1.2)/2 = 1.10
  if (!(midUsage > midRaw)) {
    fail('常量层中值序 usage > raw', `usage(${midUsage}) > raw(${midRaw})`, `usage(${midUsage}) ≤ raw(${midRaw})`)
  }
  if (!(midUsage > midEditing)) {
    fail('常量层中值序 usage > editing', `usage(${midUsage}) > editing(${midEditing})`, `usage(${midUsage}) ≤ editing(${midEditing})`)
  }

  // 结果层：固定条件（intermediate / tiktok / influencer 关）分别 calculate 三种 contentType，
  // perVideo 中值序必须与常量层一致（round10 后档间差距 ≫ $10，取整不影响序）。
  // whitelisting 不单独测：其 perVideo 走 with-usage-rights 乘数，中值与 usage 档相同。
  const resultMid = (contentType: ContentType): number =>
    mid(calculate(makeInput({ experience: 'intermediate', platform: 'tiktok', contentType, videosPerMonth: 1, influencerEnabled: false })).perVideo)
  const rUsage = resultMid('with-usage-rights') // {190, 700} → 445
  const rRaw = resultMid('raw-footage') // {150, 460} → 305
  const rEditing = resultMid('with-editing') // {150, 420} → 285
  if (!(rUsage > rRaw)) {
    fail('结果层中值序 usage > raw', `usage(${rUsage}) > raw(${rRaw})`, `usage(${rUsage}) ≤ raw(${rRaw})`)
  }
  if (!(rUsage > rEditing)) {
    fail('结果层中值序 usage > editing', `usage(${rUsage}) > editing(${rEditing})`, `usage(${rUsage}) ≤ editing(${rEditing})`)
  }

  // ⚠️ 有意不断言 editing(1.10) vs raw(1.15) 的相对序：spec v0.2 中 raw [1.0,1.3] 与
  //   editing [1.0,1.2] 区间重叠（v0.1 三档严格单调已失效），任何对二者相对序的断言都是
  //   对数据源的无根据收紧。请勿「补全」此断言（D01 §5.1 明文）。
})

// =====================================================================
// 断言 2 · monthly ≡ perVideo × videosPerMonth（46,080 组合逐点严格 ===）
// =====================================================================
runBlock(`断言 2 · monthly ≡ perVideo × videosPerMonth（${TOTAL_COMBINATIONS} 组合逐点 ===）`, () => {
  let visited = 0
  for (const experience of EXPERIENCES) {
    for (const contentType of CONTENT_TYPES) {
      for (const platform of PLATFORMS) {
        for (const videosPerMonth of VOLUMES) {
          for (const influencerEnabled of [false, true]) {
            // influencer 关时 followers 不参与计算，固定默认值 5K（如实进入 input 快照）
            const followersList = influencerEnabled ? FOLLOWERS_SAMPLES : [DEFAULT_INPUT.followers]
            for (const followers of followersList) {
              for (const viewBonusEnabled of [false, true]) {
                const input: CalculatorInput = {
                  platform, contentType, experience, videosPerMonth,
                  influencerEnabled, followers, viewBonusEnabled,
                }
                const result = calculate(input)
                // 严格恒等（===）：calculate 契约 = monthly 基于取整后 perVideo × volume，不二次取整（D01 §3.3）
                if (result.monthly.lo !== result.perVideo.lo * input.videosPerMonth) {
                  fail('monthly.lo 恒等失败',
                    `perVideo.lo(${result.perVideo.lo}) × videosPerMonth(${input.videosPerMonth}) = ${result.perVideo.lo * input.videosPerMonth}`,
                    String(result.monthly.lo), input)
                }
                if (result.monthly.hi !== result.perVideo.hi * input.videosPerMonth) {
                  fail('monthly.hi 恒等失败',
                    `perVideo.hi(${result.perVideo.hi}) × videosPerMonth(${input.videosPerMonth}) = ${result.perVideo.hi * input.videosPerMonth}`,
                    String(result.monthly.hi), input)
                }
                // Range 不变量（types.ts 契约 lo ≤ hi）折入本断言循环：任一区间倒挂即失败（不新增断言数）
                if (result.perVideo.lo > result.perVideo.hi || result.monthly.lo > result.monthly.hi) {
                  fail('Range 不变量 lo ≤ hi',
                    'perVideo 与 monthly 均满足 lo ≤ hi',
                    `perVideo[${result.perVideo.lo}, ${result.perVideo.hi}] · monthly[${result.monthly.lo}, ${result.monthly.hi}]`, input)
                }
                visited++
              }
            }
          }
        }
      }
    }
  }
  // 空间契约自检：实际遍历数必须恰为 46,080（防遍历维度被误改）
  if (visited !== TOTAL_COMBINATIONS) {
    fail('全遍历空间计数', String(TOTAL_COMBINATIONS), String(visited))
  }
})

// =====================================================================
// 断言 3 · influencer 叠加非替换（42,240 组合逐点 ===）
// =====================================================================
runBlock(`断言 3 · influencer 叠加非替换（${INFLUENCER_COMBINATIONS} 组合逐点 ===）`, () => {
  for (const experience of EXPERIENCES) {
    for (const contentType of CONTENT_TYPES) {
      for (const platform of PLATFORMS) {
        for (const videosPerMonth of VOLUMES) {
          for (const followers of FOLLOWERS_SAMPLES) {
            for (const viewBonusEnabled of [false, true]) {
              const input: CalculatorInput = {
                platform, contentType, experience, videosPerMonth,
                influencerEnabled: true, followers, viewBonusEnabled,
              }
              const result = calculate(input)
              const tier = resolveInfluencerTier(input.followers)
              // 必须用 round10 前基价相加：round10 在加法之后（spec §4 公式括号），
              // 无法由取整后的差值反推——这正是 calc.ts 导出 calcBaseUgc 的全部理由（D01 §5.1）。
              // whitelisting 安全性：calcBaseUgc 与 calculate 走相同的 whitelisting→with-usage-rights
              // 映射（T2 交付已确认），故全遍历含 whitelisting 组合可安全断言。
              const base = calcBaseUgc(input)
              const expectedLo = round10(base.lo + INFLUENCER_ADDONS[tier].lo)
              const expectedHi = round10(base.hi + INFLUENCER_ADDONS[tier].hi)
              if (result.perVideo.lo !== expectedLo) {
                fail('perVideo.lo 叠加恒等失败',
                    `round10(base.lo(${base.lo}) + ${tier}.lo(${INFLUENCER_ADDONS[tier].lo})) = ${expectedLo}`,
                    String(result.perVideo.lo), input)
              }
              if (result.perVideo.hi !== expectedHi) {
                fail('perVideo.hi 叠加恒等失败',
                    `round10(base.hi(${base.hi}) + ${tier}.hi(${INFLUENCER_ADDONS[tier].hi})) = ${expectedHi}`,
                    String(result.perVideo.hi), input)
              }
            }
          }
        }
      }
    }
  }
})

// =====================================================================
// 断言 4 · 市场带（48 组合）+ tiktok 锚点
// =====================================================================
runBlock('断言 4 · 市场带（前三档 ∈[70,1300] / premium ∈[475,2100]）+ tiktok 锚点 = 80', () => {
  // 非 influencer 48 组合 = 4 经验 × 4 内容 × 3 平台；perVideo 与产量无关，videosPerMonth 固定 1；
  // viewBonus 纯展示不影响数值，固定关。
  // 下限取 70 而非 75 的原因（D01 §9-OQ1）：beginner × (raw-footage|with-editing) × yt-shorts
  //   = 75 × 1.0 × 0.95 = 71.25 → round10 → 70 < 75，spec §8 的 $75 下限推导未计入 ×0.95 下探与 round10。
  // premium 下限 475 依赖 round10 half-up：500 × 1.0 × 0.95 = 475 → round10(475) = Math.round(47.5) × 10 = 480 ≥ 475（§9-OQ4）。
  for (const experience of EXPERIENCES) {
    for (const contentType of CONTENT_TYPES) {
      for (const platform of PLATFORMS) {
        const input = makeInput({ experience, contentType, platform, videosPerMonth: 1, influencerEnabled: false, viewBonusEnabled: false })
        const { perVideo } = calculate(input)
        const [bandLo, bandHi] = experience === 'premium' ? [475, 2100] : [70, 1300]
        if (perVideo.lo < bandLo) {
          fail(`市场带下限（${experience}）`, `perVideo.lo ≥ ${bandLo}`, String(perVideo.lo), input)
        }
        if (perVideo.hi > bandHi) {
          fail(`市场带上限（${experience}）`, `perVideo.hi ≤ ${bandHi}`, String(perVideo.hi), input)
        }
      }
    }
  }

  // tiktok 锚点（plan 2.3-D1 定案：期望值 = 80，非 spec §8 字面的 75）。
  // 推导链（必须保留，防回退）：spec errata #15 一方面定案 round10 = half-up（Math.round(x/10)*10 语义），
  //   另一方面在 §8 写「$75 保留为 tiktok 锚点（beginner × raw-footage × tiktok = $75）」——
  //   两句自相矛盾：75(base) × 1.0(raw-footage lo 乘数) × 1.0(tiktok adj) = 75，
  //   round10(75) = Math.round(7.5) × 10 = 8 × 10 = 80 ≠ 75。按字面 ===75 实现必然失败；
  //   plan 2.3-D1 已机械推导定案为 80（不改变任何费率数值与用户可见行为）。
  //   市场带下限 70 不受此定案影响（71.25 → 70 推导独立成立）。
  const anchorInput = makeInput({ experience: 'beginner', contentType: 'raw-footage', platform: 'tiktok', videosPerMonth: 1, influencerEnabled: false, viewBonusEnabled: false })
  const anchor = calculate(anchorInput)
  if (anchor.perVideo.lo !== 80) {
    fail('tiktok 锚点 beginner × raw-footage × tiktok',
      'perVideo.lo === 80（round10(75) = Math.round(7.5)×10 = 80，plan 2.3-D1）',
      String(anchor.perVideo.lo), anchorInput)
  }
})

// =====================================================================
// 附加 · resolveInfluencerTier 11 采样点判定（D01 §5.2；tier 判定覆盖，不计入 4 断言口径）
// =====================================================================
runBlock('附加 · resolveInfluencerTier 11 采样点判定', () => {
  const tierExpectations: readonly { followers: number; tier: InfluencerTier }[] = [
    { followers: 999, tier: 'nano' }, // < 1K 防御性兜底（slider min=1000 正常不触达）
    { followers: 1_000, tier: 'nano' }, // 左闭边界 [1K,10K)
    { followers: 5_000, tier: 'nano' },
    { followers: 9_999, tier: 'nano' }, // 右开边界前一点
    { followers: 10_000, tier: 'micro' }, // 左闭边界 [10K,100K)
    { followers: 50_000, tier: 'micro' },
    { followers: 99_999, tier: 'micro' },
    { followers: 100_000, tier: 'mid' }, // 左闭边界 [100K,500K)
    { followers: 499_999, tier: 'mid' },
    { followers: 500_000, tier: 'macro' }, // 左闭边界 [500K,∞)
    { followers: 1_000_000, tier: 'macro' },
  ]
  for (const { followers, tier } of tierExpectations) {
    const actual = resolveInfluencerTier(followers)
    if (actual !== tier) {
      fail(`resolveInfluencerTier(${followers})`, tier, actual)
    }
  }
})

// ---------- 总输出 ----------
if (allPassed) {
  console.log(`✅ selfcheck passed (4 assertions, ${TOTAL_COMBINATIONS} combinations, data ${DATA_VERSION})`)
}
