import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '#/pages/misc'
import { noindexHead } from '#/seo/head'

export const Route = createFileRoute('/cart')({ head: () => noindexHead('Cart', '/cart'), component: CartPage })
