import { fault } from '../../faults/runtime'

const isDev = Boolean(import.meta.env?.DEV)

export function cspValue(): string {
  return [
    "default-src 'self'",
    // TanStack Start inlines its hydration/bootstrap scripts, so inline is required here.
    `script-src 'self' 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    isDev ? '' : 'upgrade-insecure-requests',
  ]
    .filter(Boolean)
    .join('; ')
}

/** Security headers for every response. */
export function securityHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
  if (!fault('csp-removed')) h['Content-Security-Policy'] = cspValue()
  if (!fault('hsts-xfo-removed')) {
    h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    h['X-Frame-Options'] = 'DENY'
  }
  return h
}

/** Cache policy by content type. HTML revalidates; validators are added by the caller. */
export function cacheControl(contentType: string, pathname: string): string {
  if (fault('no-cache-validators') && contentType.includes('text/html')) return 'no-store'
  if (pathname.startsWith('/_fault/')) return 'no-store'
  if (contentType.includes('text/html')) return 'public, max-age=0, must-revalidate'
  if (/\.(xml|txt)$/.test(pathname)) return 'public, max-age=3600, must-revalidate'
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  return 'public, max-age=3600, must-revalidate'
}

export const wantsValidators = (contentType: string): boolean => !(fault('no-cache-validators') && contentType.includes('text/html'))

async function etagOf(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return `"${[...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')}"`
}

/** Adds security + cache headers, an ETag and Last-Modified, and answers If-None-Match with 304. */
export async function finalize(request: Request, response: Response, lastModified: string): Promise<Response> {
  const headers = new Headers(response.headers)
  for (const [k, v] of Object.entries(securityHeaders())) headers.set(k, v)
  const ct = headers.get('content-type') ?? ''
  const { pathname } = new URL(request.url)
  headers.set('Cache-Control', cacheControl(ct, pathname))
  const cacheable = request.method === 'GET' && response.status === 200 && !pathname.startsWith('/_fault/') && wantsValidators(ct)
  if (!cacheable) return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, statusText: response.statusText, headers })
  const body = await response.arrayBuffer()
  const etag = await etagOf(body)
  headers.set('ETag', etag)
  headers.set('Last-Modified', lastModified)
  headers.set('Vary', 'Accept-Encoding')
  headers.delete('content-length')
  const inm = request.headers.get('if-none-match')
  if (inm && inm.split(',').map((s) => s.trim()).includes(etag)) return new Response(null, { status: 304, headers })
  return new Response(body, { status: 200, headers })
}
