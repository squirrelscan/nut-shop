import { createFileRoute } from '@tanstack/react-router'
import { rssXml } from '#/seo/sitemap'

export const Route = createFileRoute('/blog/rss.xml')({
  server: { handlers: { GET: () => new Response(rssXml(), { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } }) } },
})
