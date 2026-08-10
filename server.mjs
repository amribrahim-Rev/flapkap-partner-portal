/**
 * Static file server for the built app.
 *
 * Deliberately hand-rolled rather than shelling out to `serve`: that pulled in
 * 169 packages and, more importantly, only picks up the port through argument
 * interpolation that does not survive npm's script runner on every platform.
 * It silently bound 3000 while PORT said otherwise — which on Railway means a
 * failed healthcheck and a dead deploy. Reading process.env.PORT directly
 * cannot go wrong.
 */
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const ROOT = resolve('dist')
const PORT = Number(process.env.PORT) || 8080
const HOST = '0.0.0.0'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

/** Resolve a URL to a file inside ROOT, or null if it escapes or is missing. */
function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
  const target = normalize(join(ROOT, clean))
  // Path traversal guard: never serve anything outside dist/.
  if (!target.startsWith(ROOT)) return null
  try {
    const s = statSync(target)
    if (s.isDirectory()) return resolveFile(join(clean, 'index.html'))
    return target
  } catch {
    return null
  }
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }).end('Method not allowed')
    return
  }

  // Any unknown path falls back to index.html so client-side routing works.
  const file = resolveFile(req.url ?? '/') ?? join(ROOT, 'index.html')
  const ext = extname(file).toLowerCase()

  // Vite fingerprints asset filenames, so they can be cached hard. The HTML
  // entry point must never be, or a deploy leaves users on the old bundle.
  // Compare on forward slashes: path.join yields backslashes on Windows, so
  // testing for "/assets/" directly silently never matched there.
  const cache = file.split('\\').join('/').includes('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache'

  res.writeHead(200, {
    'content-type': TYPES[ext] ?? 'application/octet-stream',
    'cache-control': cache,
    'x-content-type-options': 'nosniff',
  })

  if (req.method === 'HEAD') { res.end(); return }

  createReadStream(file)
    .on('error', () => { res.end() })
    .pipe(res)
})

server.listen(PORT, HOST, () => {
  console.log(`Serving ${ROOT} on http://${HOST}:${PORT}`)
})
