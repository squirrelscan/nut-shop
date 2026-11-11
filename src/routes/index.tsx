import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '#/pages/shop'
import { homeHead } from '#/seo/head'

export const Route = createFileRoute('/')({ head: () => homeHead(), component: HomePage })
