// scripts/check-seo-content.mjs —— /blog/ 内容页构建产物断言（M2 SEO 内容 · plan §3.3 T11）。
// 校验对象：dist/blog/*.html ×4、dist/sitemap.xml、dist/index.html 引用的 JS bundle。
// 断言依据：plan §2.2 C-DATA@1 / C-LINK@1 / C-SITEMAP@1 / C-URL@1 / C-PAGE-TEMPLATE@1。
// 任何断言失败：汇总失败项清单后 exit 1（postbuild 阶段自动执行，勾结零容忍——只认产物）。
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const SITE_ORIGIN = 'https://ugc-toolkit.com'
const GUMROAD_URL = 'https://ugctoolkit.gumroad.com/l/jlfmgx'

// —— 页面配置：slug / 目标词 / 关键数字（C-DATA@1 契约必含页映射）——
// 关键数字正则：容忍 en-dash（–）与连字符（-）变体、千分位逗号可选。
const RANGE = (lo, hi) => new RegExp(`${lo}[\\u2013-]${hi.replace(',', ',?')}`)
const NUM_75_250 = RANGE('75', '250')
const NUM_150_350 = RANGE('150', '350')
const NUM_250_600 = RANGE('250', '600')
const NUM_500_1000 = RANGE('500', '1,000')
const NUM_100_500 = RANGE('100', '500')
const NUM_30_50 = RANGE('30', '50')
const NUM_50_100 = RANGE('50', '100')
const NUM_10_8000 = RANGE('10', '8,000')

const PAGES = [
  {
    num: '#1',
    slug: 'how-much-to-charge-ugc',
    keyword: 'how much to charge for ugc',
    // #1 次级 hub：六必含小节覆盖全部数据域 → 8 个关键数字全查
    numbers: [
      ['75–250', NUM_75_250], ['150–350', NUM_150_350], ['250–600', NUM_250_600],
      ['500–1,000', NUM_500_1000], ['100–500', NUM_100_500], ['30–50', NUM_30_50],
      ['50–100', NUM_50_100], ['10–8,000', NUM_10_8000],
    ],
    hubLinks: ['blog/ugc-rates-per-video', 'blog/ugc-usage-rights-pricing', 'blog/ugc-pitch-template'],
  },
  {
    num: '#2',
    slug: 'ugc-rates-per-video',
    keyword: 'ugc rates per video',
    // #2 数据表页：BASE_RATES 四档 + influencer 加价全域
    numbers: [
      ['75–250', NUM_75_250], ['150–350', NUM_150_350], ['250–600', NUM_250_600],
      ['500–1,000', NUM_500_1000], ['10–8,000', NUM_10_8000],
    ],
  },
  {
    num: '#3',
    slug: 'ugc-usage-rights-pricing',
    keyword: 'ugc usage rights pricing',
    // #3 乘数叙事页：分档加价 + exclusivity + whitelisting 澄清
    numbers: [['30–50', NUM_30_50], ['50–100', NUM_50_100], ['100–500', NUM_100_500]],
  },
  {
    num: '#5',
    slug: 'ugc-pitch-template',
    keyword: 'ugc pitch template',
    gumroad: true,
    // #5 承接页：rate card 锚定 beginner 档
    numbers: [['75–250', NUM_75_250]],
  },
]

const SITEMAP_EXISTING = ['https://ugc-toolkit.com/', 'https://ugc-toolkit.com/privacy', 'https://ugc-toolkit.com/terms']
const SITEMAP_BLOG = PAGES.map((p) => `${SITE_ORIGIN}/blog/${p.slug}`)
// index（SeoContent.vue Guides 小节）反链的 3 个 slug（#2 不要求反链）
const INDEX_BUNDLE_SLUGS = ['blog/how-much-to-charge-ugc', 'blog/ugc-usage-rights-pricing', 'blog/ugc-pitch-template']

// —— 通用工具：HTML 实体解码 / 空白归一化 / 可见文本提取 ——
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  larr: '\u2190', rarr: '\u2192', mdash: '\u2014', ndash: '\u2013', hellip: '\u2026',
  copy: '\u00a9', reg: '\u00ae', trade: '\u2122', times: '\u00d7', middot: '\u00b7',
}
function decodeEntities(text) {
  return text.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, entity) => {
    if (entity[0] === '#') {
      const code = entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[entity] ?? match
  })
}
const normalize = (text) => decodeEntities(text).replace(/\s+/g, ' ').trim()

// 可见文本：<body> 内去除 script/style 后剥标签、解码实体、归一化空白（供 FAQ 子串匹配）
function extractVisibleText(html) {
  const body = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html
  return normalize(body.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' '))
}

function extractAnchors(html) {
  const anchors = []
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = /href\s*=\s*"([^"]*)"/i.exec(m[1])?.[1] ?? ''
    anchors.push({ href, text: normalize(m[2].replace(/<[^>]*>/g, ' ')).toLowerCase() })
  }
  return anchors
}

function extractScripts(html) {
  const scripts = []
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1]
    scripts.push({
      src: /src\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? null,
      type: /type\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? null,
      body: m[2],
    })
  }
  return scripts
}

// —— 断言收集器：全量跑完输出失败清单（不 fail-fast，避免掩盖其他失败项）——
const failures = []
let passCount = 0
const ok = (page, label) => { passCount++; console.log(`  \u2713 ${label}`) }
const fail = (page, label, detail) => {
  failures.push(`[${page}] ${label}${detail ? ` —— ${detail}` : ''}`)
  console.log(`  \u2717 ${label}${detail ? ` —— ${detail}` : ''}`)
}

// —— 断言 1–5：逐页校验 dist/blog/*.html ——
console.log('—— check-seo-content: /blog/ 内容页断言（M2 · plan §3.3 T11）——')
for (const page of PAGES) {
  const label = `${page.num} ${page.slug}`
  console.log(`[${label}]`)
  const file = join(DIST, 'blog', `${page.slug}.html`)
  if (!existsSync(file)) { fail(label, '文件存在', file); continue }
  const html = readFileSync(file, 'utf8')
  ok(label, `文件存在 dist/blog/${page.slug}.html (${(html.length / 1024).toFixed(2)} KB)`)

  // title 含目标词（连续子串，大小写不敏感）
  const title = normalize(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '')
  if (title && title.toLowerCase().includes(page.keyword)) ok(label, `title 含目标词: "${title}"`)
  else fail(label, 'title 含目标词', `title="${title}" 目标词="${page.keyword}"`)

  // H1 含目标词（词元全覆盖：plan R1 允许 H1 微调，如 #3 把 UGC 挪至句尾）
  const h1 = normalize(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? '')
  const tokens = page.keyword.split(/\s+/)
  const h1Hit = h1 && tokens.every((t) => h1.toLowerCase().includes(t))
  if (h1Hit) ok(label, `H1 含目标词（词元全覆盖）: "${h1}"`)
  else fail(label, 'H1 含目标词（词元全覆盖）', `h1="${h1}" 目标词="${page.keyword}"`)

  // canonical = clean URL 自指（恰好 1 条，无 .html 后缀）
  const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/gi)]
    .map((m) => /href\s*=\s*"([^"]*)"/i.exec(m[0])?.[1] ?? '')
  const expectedCanonical = `${SITE_ORIGIN}/blog/${page.slug}`
  if (canonicals.length === 1 && canonicals[0] === expectedCanonical) ok(label, `canonical 自指 clean URL: ${canonicals[0]}`)
  else fail(label, 'canonical 自指 clean URL', `got=${JSON.stringify(canonicals)} expected="${expectedCanonical}"`)

  // OG 四要素：og:title / og:description / og:image / og:type=article
  const og = {}
  for (const m of html.matchAll(/<meta\b[^>]*property="og:([a-zA-Z]+)"[^>]*>/gi)) {
    og[m[1]] = /content\s*=\s*"([^"]*)"/i.exec(m[0])?.[1] ?? ''
  }
  if (og.title && og.description) ok(label, `og:title / og:description 齐备 ("${og.title}")`)
  else fail(label, 'og:title / og:description 齐备', `og.title="${og.title}" og.description="${og.description}"`)
  if (og.image && og.image.includes('/og-image.png')) ok(label, `og:image 指向 og-image.png: ${og.image}`)
  else fail(label, 'og:image 指向 og-image.png', `og.image="${og.image}"`)
  if (og.type === 'article') ok(label, 'og:type = article')
  else fail(label, 'og:type = article', `og.type="${og.type}"`)

  // script 白名单：无外链 src；非 JSON-LD 内联仅允许 GA4（googletagmanager 特征）
  const scripts = extractScripts(html)
  const external = scripts.filter((s) => s.src)
  if (external.length === 0) ok(label, `无外链 <script src>（共 ${scripts.length} 个 script）`)
  else fail(label, '无外链 <script src>', external.map((s) => s.src).join(', '))
  const ga4Inline = scripts.filter((s) => !s.type && /googletagmanager|gtag/i.test(s.body))
  const strayInline = scripts.filter((s) => !s.type && !/googletagmanager|gtag/i.test(s.body))
  if (ga4Inline.length >= 1 && strayInline.length === 0) ok(label, '内联 JS 仅 GA4 延迟加载（无业务 JS）')
  else fail(label, '内联 JS 仅 GA4 延迟加载', `ga4=${ga4Inline.length} 业务内联=${strayInline.length}`)

  // FAQPage JSON-LD：可 JSON.parse；3–5 条 Q/A；每条 Question/Answer 均为可见文本子串
  const jsonLdScripts = scripts.filter((s) => s.type === 'application/ld+json')
  const parsed = []
  let parseError = null
  for (const s of jsonLdScripts) {
    try { parsed.push(JSON.parse(s.body)) } catch (err) { parseError = err.message }
  }
  if (parseError === null) ok(label, `JSON-LD 可解析（${parsed.length} 个）`)
  else fail(label, 'JSON-LD 可解析', parseError)
  const faq = parsed.find((o) => o?.['@type'] === 'FAQPage')
  const visibleText = extractVisibleText(html)
  if (faq && Array.isArray(faq.mainEntity) && faq.mainEntity.length >= 3 && faq.mainEntity.length <= 5) {
    let faqAllMatch = true
    const mismatch = []
    for (const q of faq.mainEntity) {
      const qText = normalize(q?.name ?? '')
      const aText = normalize(q?.acceptedAnswer?.text ?? '')
      const qHit = qText && visibleText.includes(qText)
      const aHit = aText && visibleText.includes(aText)
      if (!qHit || !aHit) { faqAllMatch = false; mismatch.push(`Q:${qText.slice(0, 50)}…(q=${qHit},a=${aHit})`) }
    }
    if (faqAllMatch) ok(label, `FAQPage ${faq.mainEntity.length} 条 Q/A 与可见文本一致（子串匹配）`)
    else fail(label, 'FAQPage Q/A 与可见文本一致', mismatch.join(' | '))
  } else {
    fail(label, 'FAQPage mainEntity 3–5 条', `got=${faq?.mainEntity?.length ?? '缺失'}`)
  }

  // 内链：站内链接 ≥2；≥1 个 href="/" 且锚文本含 "UGC rate calculator"（大小写不敏感）
  const anchors = extractAnchors(html)
  const internal = anchors.filter((a) => a.href.startsWith('/') && !a.href.startsWith('//'))
  if (internal.length >= 2) ok(label, `站内链接 ≥2（实际 ${internal.length} 个）`)
  else fail(label, '站内链接 ≥2', `实际 ${internal.length} 个`)
  const calcAnchor = anchors.find((a) => a.href === '/' && a.text.includes('ugc rate calculator'))
  if (calcAnchor) ok(label, `href="/" 锚文本含 "UGC rate calculator": "${calcAnchor.text}"`)
  else fail(label, 'href="/" 锚文本含 "UGC rate calculator"', '未找到')

  // #1 次级 hub 义务：链向 #2/#3/#5 全部三篇
  if (page.hubLinks) {
    const hrefs = new Set(anchors.map((a) => a.href.replace(/^\//, '')))
    const missing = page.hubLinks.filter((l) => !hrefs.has(l))
    if (missing.length === 0) ok(label, 'hub 内链齐备（→ #2/#3/#5）')
    else fail(label, 'hub 内链齐备（→ #2/#3/#5）', `缺失 ${missing.join(', ')}`)
  }

  // #5 承接页：GUMROAD_URL 字面值出现 ≥2 次（无 UTM）
  if (page.gumroad) {
    const count = html.split(GUMROAD_URL).length - 1
    if (count >= 2) ok(label, `GUMROAD_URL 出现 ${count} 次（≥2）`)
    else fail(label, 'GUMROAD_URL 出现 ≥2 次', `实际 ${count} 次`)
  }

  // 关键数字抽查（C-DATA@1：该数字契约必含页命中）
  const numberMisses = page.numbers.filter(([, re]) => !re.test(html)).map(([n]) => n)
  if (numberMisses.length === 0) ok(label, `关键数字抽查 ${page.numbers.length}/${page.numbers.length} 命中 (${page.numbers.map(([n]) => n).join(' / ')})`)
  else fail(label, '关键数字抽查', `未命中: ${numberMisses.join(' / ')}`)
}

// —— 断言 6：dist/sitemap.xml ——
console.log('[sitemap.xml]')
const sitemapFile = join(DIST, 'sitemap.xml')
if (!existsSync(sitemapFile)) {
  fail('sitemap.xml', '文件存在', sitemapFile)
} else {
  const sitemap = readFileSync(sitemapFile, 'utf8')
  ok('sitemap.xml', '文件存在 dist/sitemap.xml')
  const locs = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => m[1].trim())
  if (locs.length === 7) ok('sitemap.xml', `恰好 7 个 <loc>`)
  else fail('sitemap.xml', '恰好 7 个 <loc>', `实际 ${locs.length} 个`)
  const missingExisting = SITEMAP_EXISTING.filter((u) => !locs.includes(u))
  const missingBlog = SITEMAP_BLOG.filter((u) => !locs.includes(u))
  if (missingExisting.length === 0) ok('sitemap.xml', '既有 3 URL 原样保留（/、/privacy、/terms）')
  else fail('sitemap.xml', '既有 3 URL 原样保留', `缺失 ${missingExisting.join(', ')}`)
  if (missingBlog.length === 0) ok('sitemap.xml', '4 个 blog clean URL 齐备')
  else fail('sitemap.xml', '4 个 blog clean URL 齐备', `缺失 ${missingBlog.join(', ')}`)
  // XML 良构：轻量栈式标签配对（排除声明/注释/自闭合）
  const stripped = sitemap.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '').replace(/<!DOCTYPE[^>]*>/gi, '')
  const stack = []
  let wfError = null
  for (const m of stripped.matchAll(/<(\/?)([a-zA-Z][\w.:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g)) {
    const [, closing, name, , selfClose] = m
    if (selfClose) continue
    if (closing) {
      const top = stack.pop()
      if (top !== name) { wfError = `</${name}> 与 <${top ?? 'NONE'}> 不配对`; break }
    } else stack.push(name)
  }
  if (!wfError && stack.length) wfError = `未闭合标签: ${stack.join(',')}`
  if (wfError === null) ok('sitemap.xml', 'XML 良构（标签配对检查通过）')
  else fail('sitemap.xml', 'XML 良构', wfError)
}

// —— 断言 7：dist/index.html 引用的 JS bundle 含 Guides 3 链接 slug ——
console.log('[index bundle]')
const indexFile = join(DIST, 'index.html')
if (!existsSync(indexFile)) {
  fail('index', '文件存在', indexFile)
} else {
  const indexHtml = readFileSync(indexFile, 'utf8')
  const jsSrcs = [...indexHtml.matchAll(/<script\b[^>]*src="(\/assets\/[^"]+\.js)"/gi)].map((m) => m[1])
  if (jsSrcs.length === 0) {
    fail('index', 'JS bundle 引用存在', 'index.html 未引用任何 /assets/*.js')
  } else {
    const bundle = jsSrcs.map((src) => {
      const p = join(DIST, src.replace(/^\//, ''))
      return existsSync(p) ? readFileSync(p, 'utf8') : ''
    }).join('\n')
    ok('index', `index.html 引用 JS bundle（${jsSrcs.join(', ')}）`)
    const missingSlugs = INDEX_BUNDLE_SLUGS.filter((s) => !bundle.includes(s))
    if (missingSlugs.length === 0) ok('index', `bundle 含 Guides 3 链接 slug（${INDEX_BUNDLE_SLUGS.join(' / ')}）`)
    else fail('index', 'bundle 含 Guides 3 链接 slug', `缺失 ${missingSlugs.join(', ')}`)
  }
}

// —— 汇总：失败 → 清单 + exit 1 ——
console.log('——')
if (failures.length > 0) {
  console.error(`❌ check-seo-content: ${failures.length} 项断言失败（通过 ${passCount} 项）——失败清单:`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  console.error('修复方向：改内容/工程产物向契约对齐（禁改 rates.ts/calc.ts/copy.ts）；本脚本只报障不修复。')
  process.exit(1)
}
console.log(`✅ check-seo-content: 全部 ${passCount} 项断言通过`)