/** Money is always shown with its currency. Never a bare number. */
export function aed(value: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) {
    if (Math.abs(value) >= 1_000_000) {
      const m = value / 1_000_000
      return `AED ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
    }
    if (Math.abs(value) >= 1_000) return `AED ${Math.round(value / 1_000)}K`
  }
  return `AED ${Math.round(value).toLocaleString('en-AE')}`
}

/** Same, without the prefix, for table cells that already have a currency header. */
export function num(value: number): string {
  return Math.round(value).toLocaleString('en-AE')
}

export function pct(rate: number, dp = 2): string {
  return `${(rate * 100).toFixed(dp)}%`
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function plural(n: number, one: string, many?: string): string {
  return `${n} ${n === 1 ? one : many ?? `${one}s`}`
}

/** "23h left", "3 days left" — never an animated ticker. */
export function countdown(hours: number): string {
  if (hours <= 0) return 'Overdue'
  if (hours < 48) return `${hours}h left`
  return `${Math.round(hours / 24)} days left`
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime()
  return Math.round(ms / 86_400_000)
}
