import productData from './generated/products.json'
import postData from './generated/posts.json'
import { CATEGORIES } from './catalog'
import type { Category, Post, Product } from './types'

export const PRODUCTS = productData as Product[]
export const POSTS = postData as Post[]
export { CATEGORIES }

export const getProduct = (slug: string): Product | undefined => PRODUCTS.find((p) => p.slug === slug)
export const getPost = (slug: string): Post | undefined => POSTS.find((p) => p.slug === slug)
export const getCategory = (slug: string): Category | undefined => CATEGORIES.find((c) => c.slug === slug)
export const productsIn = (category: string): Product[] => PRODUCTS.filter((p) => p.category === category)

export const fromPrice = (p: Product): number => Math.min(...p.variants.map((v) => v.priceCents))

/** Related = same category first, then same nut, stable order, 4 items. */
export function relatedProducts(p: Product, n = 4): Product[] {
  const others = PRODUCTS.filter((o) => o.slug !== p.slug)
  const score = (o: Product) => (o.category === p.category ? 2 : 0) + (o.nut === p.nut && o.nut !== 'mixed' ? 1 : 0)
  return others
    .map((o, i) => ({ o, i, s: score(o) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((x) => x.o)
}

export const postsFor = (p: Product): Post[] => p.posts.map(getPost).filter((x): x is Post => !!x)
export const productsFor = (post: Post): Product[] => post.relatedProducts.map(getProduct).filter((x): x is Product => !!x)

/** Posts that link to a product, for "from the journal" blocks. */
export const postsMentioning = (slug: string): Post[] => POSTS.filter((p) => p.relatedProducts.includes(slug))

export function searchProducts(q: string): { products: Product[]; posts: Post[] } {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return { products: [], posts: [] }
  const hit = (text: string) => terms.every((t) => text.toLowerCase().includes(t))
  return {
    products: PRODUCTS.filter((p) => hit(`${p.name} ${p.tagline} ${p.nut} ${p.category}`)),
    posts: POSTS.filter((p) => hit(`${p.title} ${p.description}`)),
  }
}
