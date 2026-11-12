import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import type { Plugin } from 'vite'

/**
 * Serves the functions in `api/` from the dev server the way Vercel does in
 * production: `/api/labi/turn` runs the `POST` export of `api/labi/turn.ts`.
 */
export function apiRoutes(): Plugin {
  return {
    name: 'api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (!path.startsWith('/api/')) return next()
        const file = `${path}.ts`
        // Files and folders starting with "_" are helpers, not routes.
        const routable = /^\/api(\/[a-z0-9][a-z0-9-]*)+$/.test(path)
        if (!routable || !existsSync(join(server.config.root, file))) {
          res.statusCode = 404
          return res.end()
        }

        const abort = new AbortController()
        res.on('close', () => abort.abort())
        try {
          const routes = await server.ssrLoadModule(file)
          const handler = routes[req.method ?? ''] as
            ((request: Request) => Promise<Response>) | undefined
          if (!handler) {
            res.statusCode = 405
            return res.end()
          }
          const headers = new Headers(req.headers as Record<string, string>)
          headers.set('x-real-ip', req.socket.remoteAddress ?? 'unknown')
          const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
          const response = await handler(
            new Request(`http://${req.headers.host}${req.url}`, {
              method: req.method,
              headers,
              body: hasBody
                ? (Readable.toWeb(req) as ReadableStream)
                : undefined,
              duplex: 'half',
              signal: abort.signal,
            } as RequestInit),
          )
          res.writeHead(response.status, Object.fromEntries(response.headers))
          if (response.body) {
            const reader = response.body.getReader()
            abort.signal.addEventListener('abort', () => void reader.cancel())
            for (;;) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(value)
            }
          }
          res.end()
        } catch (error) {
          if (abort.signal.aborted) return
          console.error(`[api] ${path}:`, error)
          if (!res.headersSent) res.statusCode = 500
          res.end()
        }
      })
    },
  }
}
