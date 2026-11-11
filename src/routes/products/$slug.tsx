import { createFileRoute, notFound } from '@tanstack/react-router'
import { getProduct } from '#/content'
import { ProductPage } from '#/pages/shop'
import { productHead } from '#/seo/head'

export const Route = createFileRoute('/products/$slug')({
  loader: ({ params }) => {
    const product = getProduct(params.slug)
    if (!product) throw notFound()
    return { slug: product.slug }
  },
  head: ({ loaderData }) => (loaderData ? productHead(getProduct(loaderData.slug)!) : {}),
  component: Component,
})

function Component() {
  const { slug } = Route.useLoaderData()
  return <ProductPage product={getProduct(slug)!} />
}
