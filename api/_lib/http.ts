import { rateLimit, type Rule } from './rate-limit.js'

export function json(
  body: unknown,
  status = 200,
  headers?: Record<string, string>,
) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

export const fail = (
  status: number,
  message: string,
  headers?: Record<string, string>,
) => json({ error: message }, status, headers)

function clientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}

/** A browser on another site sends that site's Origin; only our own pages may call the API. */
function isCrossSite(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return request.headers.get('sec-fetch-site') === 'cross-site'
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return new URL(origin).host !== host
  } catch {
    return true
  }
}

const DAY = 86_400

export const TIRED = 'Labi perlu istirahat sebentar. Coba lagi nanti.'
export const BUSY =
  'Labi sedang menjawab banyak pertanyaan, coba lagi sebentar ya.'

/**
 * The checks every Labi endpoint starts with. Returns the response to send
 * when the request is refused, otherwise null.
 */
export async function guard(
  request: Request,
  name: string,
  limits: {
    perMinute: number
    perDay: number
    totalPerDay: number
    totalPerMinute?: number
  },
): Promise<Response | null> {
  if (isCrossSite(request)) return fail(403, 'Permintaan ditolak.')
  const ip = clientIp(request)
  const rules: Rule[] = [
    { key: `${name}:ip:${ip}`, limit: limits.perMinute, windowSeconds: 60 },
    { key: `${name}:ip:${ip}`, limit: limits.perDay, windowSeconds: DAY },
    { key: `${name}:all`, limit: limits.totalPerDay, windowSeconds: DAY },
  ]
  if (limits.totalPerMinute !== undefined) {
    rules.push({
      key: `${name}:all`,
      limit: limits.totalPerMinute,
      windowSeconds: 60,
      message: BUSY,
    })
  }
  const refusal = await rateLimit(rules)
  if (!refusal) return null
  return fail(429, refusal.rule.message ?? TIRED, {
    'Retry-After': String(refusal.wait),
  })
}
