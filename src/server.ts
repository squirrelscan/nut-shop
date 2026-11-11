import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { SITE } from '#/config/site'
import { faultRoute } from '#/server/fault-routes'
import { finalize } from '#/server/headers'

const start = createStartHandler({ handler: defaultStreamHandler })

const isLocal = (host: string) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) || host.endsWith('.localhost')

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    // Plain http must 301 to https (the Cloudflare zone setting is primary; this is the fallback).
    const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '')
    if (proto === 'http' && !isLocal(url.host)) {
      url.protocol = 'https:'
      return new Response(null, { status: 301, headers: { Location: url.toString() } })
    }
    const response = (await faultRoute(request)) ?? (await start(request))
    return finalize(request, response, new Date(`${SITE.buildDate}T00:00:00Z`).toUTCString())
  },
}
