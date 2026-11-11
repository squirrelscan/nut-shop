/**
 * Compiles src/content/products/*.json and src/content/posts/*.md into
 * src/content/generated/*.json (committed). Validates links and sizes.
 * Run: bun run content
 */
import { marked } from 'marked'
import { CATEGORIES } from '../src/content/catalog'
import type { Post, Product } from '../src/content/types'

const root = new URL('../src/content/', import.meta.url).pathname
const products: Product[] = []
for (const f of [...new Bun.Glob('products/*.json').scanSync(root)].sort()) {
  products.push(JSON.parse(await Bun.file(root + f).text()) as Product)
}
const postFiles = [...new Bun.Glob('posts/*.md').scanSync(root)].sort()
const productSlugs = new Set(products.map((p) => p.slug))
const catSlugs = new Set(CATEGORIES.map((c) => c.slug))
const postSlugs = new Set(postFiles.map((f) => f.replace(/^posts\/|\.md$/g, '')))

const errors: string[] = []
const err = (m: string) => errors.push(m)

for (const p of products) {
  if (!catSlugs.has(p.category)) err(`${p.slug}: bad category ${p.category}`)
  const words = p.description.join(' ').split(/\s+/).length
  if (words < 150 || words > 300) err(`${p.slug}: description ${words} words`)
  for (const s of p.posts) if (!postSlugs.has(s)) err(`${p.slug}: unknown post ${s}`)
  for (const s of p.contains ?? []) if (!productSlugs.has(s)) err(`${p.slug}: unknown contains ${s}`)
  if (p.metaDescription.length < 110 || p.metaDescription.length > 160) err(`${p.slug}: meta length ${p.metaDescription.length}`)
}

function checkLinks(owner: string, text: string) {
  for (const m of text.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const path = m[1]!
    const [, kind, slug] = path.split('/')
    const ok =
      (kind === 'products' && productSlugs.has(slug!)) ||
      (kind === 'categories' && catSlugs.has(slug!)) ||
      (kind === 'blog' && postSlugs.has(slug!)) ||
      ['/about', '/faq', '/shipping-and-returns', '/shop', '/contact'].includes(path)
    if (!ok) err(`${owner}: bad link ${path}`)
  }
}

const posts: Post[] = []
for (const f of postFiles) {
  const slug = f.replace(/^posts\/|\.md$/g, '')
  const raw = await Bun.file(root + f).text()
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) { err(`${slug}: no frontmatter`); continue }
  const fm: Record<string, string> = {}
  for (const line of m[1]!.split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  const body = m[2]!.trim()
  checkLinks(slug, body)
  const words = body.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').split(/\s+/).length
  if (words < 600 || words > 1000) err(`${slug}: ${words} words`)
  if (!fm.description || fm.description.length < 110 || fm.description.length > 160) err(`${slug}: description length ${fm.description?.length}`)
  const rel = (fm.relatedProducts ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  for (const s of rel) if (!productSlugs.has(s)) err(`${slug}: unknown related product ${s}`)
  let html = await marked.parse(body)
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" rel="noopener"')
  posts.push({
    slug,
    title: fm.title!,
    description: fm.description!,
    date: fm.date!,
    topic: fm.topic as Post['topic'],
    relatedProducts: rel,
    html,
    words,
  })
}
posts.sort((a, b) => b.date.localeCompare(a.date))

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
await Bun.write(root + 'generated/products.json', JSON.stringify(products, null, 1) + '\n')
await Bun.write(root + 'generated/posts.json', JSON.stringify(posts, null, 1) + '\n')
console.log(`content ok: ${products.length} products, ${posts.length} posts`)
