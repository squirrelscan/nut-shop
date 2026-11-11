import { createFileRoute } from '@tanstack/react-router'
import { OrderDemoPage } from '#/pages/misc'
import { noindexHead } from '#/seo/head'

export const Route = createFileRoute('/order-demo')({ head: () => noindexHead('Demo checkout', '/order-demo'), component: OrderDemoPage })
