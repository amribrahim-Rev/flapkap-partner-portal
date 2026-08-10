/**
 * Turns the single-file build into an Artifact fragment.
 *
 * Artifacts are wrapped in their own <!doctype>/<head>/<body> skeleton at
 * publish time, so the file we hand over must contain page CONTENT only —
 * the <style>, the mount point, the module script, and a <title>.
 *
 *   node scripts/make-artifact.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const src = resolve('dist-single/index.html')
const out = resolve('../artifact/broker-portal.html')

const html = readFileSync(src, 'utf8')

const grabAll = (tag) => {
  const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, 'gi')
  return html.match(re) ?? []
}

const styles = grabAll('style')
const scripts = grabAll('script')
const bodyInner = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? '')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .trim()

if (!styles.length) throw new Error('no <style> found — did the singlefile build inline the CSS?')
if (!scripts.length) throw new Error('no <script> found — did the singlefile build inline the JS?')
if (!bodyInner.includes('id="root"')) throw new Error('mount point #root missing from body')

const fragment = [
  '<title>FlapKap Partner Portal</title>',
  '',
  '<!-- Single-file build of the broker portal. Everything below is inlined:',
  '     no external stylesheet, script, or font request, so it runs under a',
  '     strict CSP. Routing is hash-based, so deep links work on any host. -->',
  '',
  ...styles,
  '',
  bodyInner,
  '',
  ...scripts,
  '',
].join('\n')

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, fragment, 'utf8')

const kb = (n) => `${(n / 1024).toFixed(0)} kB`
console.log(`wrote ${out}`)
console.log(`  styles  ${styles.length}  (${kb(styles.join('').length)})`)
console.log(`  scripts ${scripts.length}  (${kb(scripts.join('').length)})`)
console.log(`  total   ${kb(fragment.length)}`)
console.log(`  no doctype/html/head/body: ${!/<(!doctype|html|head|body)\b/i.test(fragment)}`)
console.log(`  external refs: ${(fragment.match(/(src|href)="https?:\/\//g) ?? []).length}`)
