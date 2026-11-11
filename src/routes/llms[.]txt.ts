import { createFileRoute } from '@tanstack/react-router'
import { llmsTxt } from '#/seo/sitemap'

export const Route = createFileRoute('/llms.txt')({
  server: { handlers: { GET: () => new Response(llmsTxt(), { headers: { 'content-type': 'text/plain; charset=utf-8' } }) } },
})
