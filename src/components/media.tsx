import { fault } from '../../faults/runtime'
import type { Product } from '#/content/types'

/** Product illustration. Faults: image-missing-alt (raw-almonds), image-missing-dimensions (raw-cashews). */
export function ProductImage({ product, width = 400, height = 300, priority = false, className }: { product: Product; width?: number; height?: number; priority?: boolean; className?: string }) {
  const noAlt = fault('image-missing-alt') && product.slug === 'raw-almonds'
  const noDims = fault('image-missing-dimensions') && product.slug === 'raw-cashews'
  const props: Record<string, unknown> = {
    src: `/img/products/${product.slug}.svg`,
    loading: priority ? 'eager' : 'lazy',
    decoding: 'async',
    className,
  }
  if (priority) props.fetchPriority = 'high'
  if (!noAlt) props.alt = `Illustration of ${product.name.toLowerCase()} in the style of The Nut Shop`
  if (!noDims) {
    props.width = width
    props.height = height
  }
  return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
}

export function Img({ src, alt, width, height, priority = false, className }: { src: string; alt: string; width: number; height: number; priority?: boolean; className?: string }) {
  return <img src={src} alt={alt} width={width} height={height} loading={priority ? 'eager' : 'lazy'} decoding="async" className={className} {...(priority ? { fetchPriority: 'high' as const } : {})} />
}
