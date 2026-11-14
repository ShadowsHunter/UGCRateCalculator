// scripts/check-bundle-size.mjs —— 整站 gzip JS 预算检查（D01 §7.4 / spec §7）。
// 口径：dist/assets/*.js 的 gzip 字节累加必须 < 35KB（35×1024）。
// GA4 等外域脚本与 CSS 不计入。postbuild 阶段自动执行，超限退出码 1。
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const BUDGET_BYTES = 35 * 1024
const assetsDir = fileURLToPath(new URL('../dist/assets/', import.meta.url))

// 目录单次读取：ENOENT → 友好报错 exit 1；其余读取异常显式抛出（构建异常不应被吞）
let entries
try {
  entries = readdirSync(assetsDir)
} catch (err) {
  if (err && err.code === 'ENOENT') {
    console.error(`❌ check-bundle-size: dist/assets 目录不存在（${assetsDir}），请先执行 vite build`)
    process.exit(1)
  }
  throw err
}

const jsFiles = entries.filter((f) => f.endsWith('.js'))
if (jsFiles.length === 0) {
  console.error(`❌ check-bundle-size: dist/assets 下未找到任何 .js 产物`)
  process.exit(1)
}

const rows = []
let totalGzip = 0
for (const file of jsFiles) {
  const raw = readFileSync(join(assetsDir, file))
  const gzip = gzipSync(raw).length
  totalGzip += gzip
  rows.push({ file, raw: raw.length, gzip })
}

const fmt = (n) => `${(n / 1024).toFixed(2)} KB`
console.log('—— JS gzip 预算明细（dist/assets/*.js）——')
for (const r of rows) {
  console.log(`  ${r.file}  raw ${fmt(r.raw)} → gzip ${fmt(r.gzip)}`)
}
console.log(`合计 gzip: ${fmt(totalGzip)} / 预算 ${fmt(BUDGET_BYTES)}`)

if (totalGzip >= BUDGET_BYTES) {
  console.error('❌ check-bundle-size: 超出 35KB 预算，构建失败（排查手段见 D01 §7.4 ①②③）')
  process.exit(1)
}

console.log('✅ check-bundle-size: gzip JS 预算检查通过')
