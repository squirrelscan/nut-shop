import { useSyncExternalStore } from 'react'

export type CartLine = { slug: string; weightG: number; qty: number }
const KEY = 'nutshop-cart'
let cache: CartLine[] | null = null
const listeners = new Set<() => void>()
const EMPTY: CartLine[] = []

function load(): CartLine[] {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartLine[]
  } catch {
    cache = []
  }
  return cache
}

function save(lines: CartLine[]): void {
  cache = lines
  try {
    localStorage.setItem(KEY, JSON.stringify(lines))
  } catch {
    /* storage may be blocked */
  }
  listeners.forEach((l) => l())
}

export function addToCart(slug: string, weightG: number): void {
  const lines = load()
  const hit = lines.find((l) => l.slug === slug && l.weightG === weightG)
  save(hit ? lines.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l)) : [...lines, { slug, weightG, qty: 1 }])
}
export const setQty = (slug: string, weightG: number, qty: number): void =>
  save(load().flatMap((l) => (l.slug === slug && l.weightG === weightG ? (qty > 0 ? [{ ...l, qty }] : []) : [l])))
export const clearCart = (): void => save([])

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
export const useCart = (): CartLine[] => useSyncExternalStore(subscribe, load, () => EMPTY)
