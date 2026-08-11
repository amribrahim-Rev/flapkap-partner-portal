import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

/* Self-hosted, so there is no request to a font CDN — which also means the
   single-file build works under a strict CSP. Latin subset only, to keep the
   inlined payload to glyphs this portal actually renders.

   Bricolage Grotesque carries headings and figures; Hanken Grotesk carries
   everything else. Same pairing as FlapKap's internal commercial dashboard. */
import '@fontsource/bricolage-grotesque/latin-600.css'
import '@fontsource/bricolage-grotesque/latin-700.css'
import '@fontsource/hanken-grotesk/latin-400.css'
import '@fontsource/hanken-grotesk/latin-500.css'
import '@fontsource/hanken-grotesk/latin-600.css'
import '@fontsource/hanken-grotesk/latin-700.css'

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import { router } from './router'
import { applyTheme, readTheme } from './components/ThemeToggle'

/* Set the theme before the first paint, otherwise the app flashes dark for a
   frame before a light-mode user's choice is applied. */
applyTheme(readTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
