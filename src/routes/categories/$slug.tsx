import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCategory } from '#/content'
import { CategoryPage } from '#/pages/shop'
import { categoryHead } from '#/seo/head'

export const Route = createFileRoute('/categories/$slug')({
  loader: ({ params }) => {
    const category = getCategory(params.slug)
    if (!category) throw notFound()
    return { slug: category.slug }
  },
  head: ({ loaderData }) => (loaderData ? categoryHead(getCategory(loaderData.slug)!) : {}),
  component: Component,
})

function Component() {
  const { slug } = Route.useLoaderData()
  return <CategoryPage category={getCategory(slug)!} />
}
