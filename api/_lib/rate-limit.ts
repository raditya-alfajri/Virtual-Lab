import { env } from './env.js'

/** Adds `1` to `key` and returns the new count; the key expires `ttl` seconds after its first use. */
export type CounterStore = (key: string, ttl: number) => Promise<number>

const counters = new Map<string, { count: number; expires: number }>()

/** Counts in this server instance only. */
export const memoryStore: CounterStore = async (key, ttl) => {
  const now = Date.now()
  if (counters.size > 10_000) {
    for (const [k, v] of counters) if (v.expires <= now) counters.delete(k)
  }
  const entry = counters.get(key)
  if (!entry || entry.expires <= now) {
    counters.set(key, { count: 1, expires: now + ttl * 1000 })
    return 1
  }
  return ++entry.count
}

/** Counts in Upstash Redis, shared by every instance. */
const upstashStore =
  (url: string, token: string): CounterStore =>
  async (key, ttl) => {
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, ttl, 'NX'],
      ]),
    })
    if (!response.ok) throw new Error(`Upstash ${response.status}`)
    const [incr] = (await response.json()) as { result: number }[]
    return incr.result
  }

function defaultStore(): CounterStore {
  const upstash = env.upstash
  if (!upstash) return memoryStore
  const shared = upstashStore(upstash.url, upstash.token)
  // A limiter that is down must not take the assistant down with it.
  return (key, ttl) => shared(key, ttl).catch(() => memoryStore(key, ttl))
}

export type Rule = { key: string; limit: number; windowSeconds: number }

/**
 * Fixed-window limiter. Returns the seconds to wait when any rule is over its
 * limit, otherwise null. Every rule is counted, also when an earlier one fails.
 */
export async function rateLimit(
  rules: Rule[],
  store: CounterStore = defaultStore(),
  now = Date.now(),
): Promise<number | null> {
  const seconds = now / 1000
  const waits = await Promise.all(
    rules.map(async ({ key, limit, windowSeconds }) => {
      const window = Math.floor(seconds / windowSeconds)
      const count = await store(`labi:${key}:${window}`, windowSeconds)
      return count > limit
        ? Math.ceil((window + 1) * windowSeconds - seconds)
        : 0
    }),
  )
  const wait = Math.max(...waits)
  return wait > 0 ? wait : null
}
