import { useEffect, useState } from 'react'
import { Sun, Moon } from '@phosphor-icons/react'
import { IconButton, ICON_WEIGHT } from './ui'

export type Theme = 'dark' | 'light'

const KEY = 'flapkap-theme'

/** Dark is the product's identity, so it is the default rather than the OS
 *  preference. An explicit choice by the broker always wins and persists. */
export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* private mode — fall through to the default */
  }
  return 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* nothing to do; the attribute is already set for this session */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => { applyTheme(theme) }, [theme])

  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <IconButton
      label={`Switch to ${next} mode`}
      plain
      onClick={() => setTheme(next)}
      aria-pressed={theme === 'light'}
    >
      {theme === 'dark'
        ? <Sun size={20} weight={ICON_WEIGHT} />
        : <Moon size={20} weight={ICON_WEIGHT} />}
    </IconButton>
  )
}
