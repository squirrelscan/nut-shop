import { createFileRoute } from '@tanstack/react-router'
import { STATIC_PAGES } from '#/content/pages'
import { StaticPageView } from '#/pages/content'
import { staticHead } from '#/seo/head'

const page = STATIC_PAGES.contact

export const Route = createFileRoute('/contact')({
  head: () => staticHead(page),
  component: () => <StaticPageView page={page} />,
})
