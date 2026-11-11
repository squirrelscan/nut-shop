import { createFileRoute, notFound } from '@tanstack/react-router'
import { getPost } from '#/content'
import { PostPage } from '#/pages/content'
import { postHead } from '#/seo/head'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = getPost(params.slug)
    if (!post) throw notFound()
    return { slug: post.slug }
  },
  head: ({ loaderData }) => (loaderData ? postHead(getPost(loaderData.slug)!) : {}),
  component: Component,
})

function Component() {
  const { slug } = Route.useLoaderData()
  return <PostPage post={getPost(slug)!} />
}
