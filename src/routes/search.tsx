import { createFileRoute } from '@tanstack/react-router'
import { SearchPage } from '#/pages/misc'
import { noindexHead } from '#/seo/head'

export const Route = createFileRoute('/search')({
  validateSearch: (s: Record<string, unknown>): { q: string } => ({ q: typeof s.q === 'string' ? s.q.slice(0, 80) : '' }),
  head: () => noindexHead('Search', '/search'),
  component: Component,
})

function Component() {
  const { q } = Route.useSearch()
  return <SearchPage q={q} />
}
