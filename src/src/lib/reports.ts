import { applications, caseHistory, TODAY } from './data'
import { stageGroups, stageLabel } from './domain'
import type { ClosedCase, Product, Stage } from './types'

/* ------------------------------------------------------------------
   One normalised row per case, live or closed, so every report filters
   and aggregates the same shape. Without this each block would reimplement
   "which cases count" and they would quietly drift apart.
   ------------------------------------------------------------------ */

export interface Row {
  id: string
  company: string
  industry: string
  product?: Product
  submittedOn: string
  /** The date a report should bucket this row under. */
  decidedOn?: string
  amount?: number
  feeRate?: number
  commission?: number
  status: 'live' | 'funded' | 'declined' | 'withdrawn'
  diedAtStage?: Stage
  declineReason?: string
  daysToOutcome?: number
}

const closedRows: Row[] = caseHistory.map((c: ClosedCase) => ({
  id: c.id,
  company: c.company,
  industry: c.industry,
  product: c.product,
  submittedOn: c.submittedOn,
  decidedOn: c.disbursedOn ?? c.submittedOn,
  amount: c.disbursedAmount,
  feeRate: c.feeRate,
  commission: c.commission,
  status: c.outcome,
  diedAtStage: c.diedAtStage,
  declineReason: c.declineReason,
  daysToOutcome: c.daysToOutcome,
}))

const liveRows: Row[] = applications.map((a) => ({
  id: a.id,
  company: a.company,
  industry: a.industry,
  product: a.offer?.product,
  submittedOn: a.submittedOn,
  decidedOn: a.disbursedOn,
  amount: a.disbursedAmount ?? a.offer?.amount ?? a.requestedAmount,
  feeRate: a.offer?.feeRate,
  commission: a.commission,
  status:
    a.disbursedAmount ? 'funded'
    : a.stage === 'declined' || a.stage === 'aip_declined' ? 'declined'
    : 'live',
  diedAtStage: a.stage === 'declined' ? 'credit_review' : a.stage === 'aip_declined' ? 'aip_review' : undefined,
  declineReason: a.decline?.category,
  daysToOutcome: a.daysInStage,
}))

export const allRows: Row[] = [...closedRows, ...liveRows]

export const industries = [...new Set(allRows.map((r) => r.industry))].sort()

/* ------------------------------------------------------------------
   Filters
   ------------------------------------------------------------------ */

export type PeriodKey = 'quarter' | 'last_quarter' | 'ytd' | 'last12' | 'custom'

export const periods: { key: PeriodKey; label: string }[] = [
  { key: 'quarter', label: 'This quarter' },
  { key: 'last_quarter', label: 'Last quarter' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'last12', label: 'Last 12 months' },
  { key: 'custom', label: 'Custom' },
]

export interface Filters {
  period: PeriodKey
  from: string
  to: string
  industry: string
  product: string
}

/** Resolve a preset into concrete dates so every block filters identically. */
export function resolveRange(f: Filters): { from: string; to: string } {
  const today = new Date(TODAY)
  const y = today.getFullYear()
  const q = Math.floor(today.getMonth() / 3)
  /* Format from local date parts. toISOString() converts local midnight to
     UTC, which in any timezone ahead of UTC rolls the date back a day — it
     reported Q3 as starting 30 June. */
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  switch (f.period) {
    case 'quarter':
      return { from: iso(new Date(y, q * 3, 1)), to: TODAY }
    case 'last_quarter': {
      const start = new Date(y, (q - 1) * 3, 1)
      const end = new Date(y, q * 3, 0)
      return { from: iso(start), to: iso(end) }
    }
    case 'ytd':
      return { from: `${y}-01-01`, to: TODAY }
    case 'last12': {
      const start = new Date(today)
      start.setFullYear(start.getFullYear() - 1)
      return { from: iso(start), to: TODAY }
    }
    case 'custom':
      return { from: f.from, to: f.to }
  }
}

/**
 * Rows are bucketed by SUBMISSION date, not decision date. A broker asking
 * "how did Q2 go" means the cases they sent in Q2 — bucketing by decision
 * would credit their Q2 work to Q3 and make conversion unreadable.
 */
export function applyFilters(f: Filters): Row[] {
  const { from, to } = resolveRange(f)
  return allRows.filter((r) => {
    if (r.submittedOn < from || r.submittedOn > to) return false
    if (f.industry !== 'all' && r.industry !== f.industry) return false
    if (f.product !== 'all' && r.product !== f.product) return false
    return true
  })
}

/* ------------------------------------------------------------------
   Aggregations
   ------------------------------------------------------------------ */

export function summary(rows: Row[]) {
  const funded = rows.filter((r) => r.status === 'funded')
  const decided = rows.filter((r) => r.status !== 'live')
  const disbursed = funded.reduce((s, r) => s + (r.amount ?? 0), 0)
  const commission = funded.reduce((s, r) => s + (r.commission ?? 0), 0)
  return {
    submitted: rows.length,
    funded: funded.length,
    live: rows.filter((r) => r.status === 'live').length,
    /* Conversion counts only cases that reached a decision. Including live
       cases would understate it and drift every time the page is opened. */
    conversion: decided.length ? funded.length / decided.length : 0,
    disbursed,
    commission,
    avgDeal: funded.length ? disbursed / funded.length : 0,
    avgDaysToFund: funded.length
      ? funded.reduce((s, r) => s + (r.daysToOutcome ?? 0), 0) / funded.length
      : 0,
  }
}

/** Commission by calendar month of disbursal, oldest first. */
export function byMonth(rows: Row[]): { key: string; label: string; commission: number; disbursed: number; deals: number }[] {
  const map = new Map<string, { commission: number; disbursed: number; deals: number }>()
  rows.filter((r) => r.status === 'funded' && r.decidedOn).forEach((r) => {
    const key = r.decidedOn!.slice(0, 7)
    const cur = map.get(key) ?? { commission: 0, disbursed: 0, deals: 0 }
    cur.commission += r.commission ?? 0
    cur.disbursed += r.amount ?? 0
    cur.deals += 1
    map.set(key, cur)
  })
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      key,
      label: new Date(`${key}-01`).toLocaleDateString('en-GB', { month: 'short' }),
      ...v,
    }))
}

/** Cumulative reach per stage bucket, plus what was lost at each one. */
export function dropOff(rows: Row[]) {
  const funnelGroups = stageGroups.filter((g) => g.inFunnel)
  const order = funnelGroups.map((g) => g.key)

  /* Where did each row get to? Live rows sit at their current bucket; closed
     rows reached the bucket they died in, or the end if they funded. */
  const reachedIndex = (r: Row): number => {
    if (r.status === 'funded') return order.length - 1
    if (r.diedAtStage) {
      const g = funnelGroups.findIndex((x) => x.stages.includes(r.diedAtStage!))
      return g === -1 ? 0 : g
    }
    const live = applications.find((a) => a.id === r.id)
    if (live) {
      const g = funnelGroups.findIndex((x) => x.stages.includes(live.stage))
      return g === -1 ? 0 : g
    }
    return 0
  }

  const reach = rows.map(reachedIndex)
  const last = order.length - 1
  const fundedCount = rows.filter((r) => r.status === 'funded').length

  return funnelGroups.map((g, i) => {
    /* The final bucket counts cases that ACTUALLY funded. A case sitting at
       "preparing disbursement" is inside that stage group but has not funded,
       and counting it here made the funnel disagree with the summary. */
    const reached = i === last ? fundedCount : reach.filter((x) => x >= i).length

    /* "Lost" means died here — declined or withdrawn. A live case still
       sitting at this stage has not been lost, and counting it as such
       overstated drop-off at whichever stage happened to be busy. */
    const lost = rows.filter(
      (r, idx) => (r.status === 'declined' || r.status === 'withdrawn') && reach[idx] === i,
    ).length

    return {
      key: g.key,
      label: g.label,
      tone: g.tone,
      reached,
      lost,
      share: rows.length ? reached / rows.length : 0,
    }
  })
}

export function byIndustry(rows: Row[]) {
  const map = new Map<string, Row[]>()
  rows.forEach((r) => map.set(r.industry, [...(map.get(r.industry) ?? []), r]))
  return [...map.entries()]
    .map(([industry, list]) => ({ industry, ...summary(list) }))
    .sort((a, b) => b.commission - a.commission || b.submitted - a.submitted)
}

export function declineReasons(rows: Row[]) {
  const map = new Map<string, number>()
  rows
    .filter((r) => (r.status === 'declined' || r.status === 'withdrawn') && r.declineReason)
    .forEach((r) => map.set(r.declineReason!, (map.get(r.declineReason!) ?? 0) + 1))
  return [...map.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
}

/** Average days a funded case spent before disbursal, per stage bucket. */
export function stageDurations(rows: Row[]) {
  const funded = rows.filter((r) => r.status === 'funded' && r.daysToOutcome)
  const avgTotal = funded.length ? funded.reduce((s, r) => s + (r.daysToOutcome ?? 0), 0) / funded.length : 0
  /* Split the observed total across the journey using each stage's own SLA as
     the weight, so the shares always add back to the real measured total. */
  const weights: { stage: Stage; sla: number }[] = [
    { stage: 'lead', sla: 1 },
    { stage: 'aip_review', sla: 3 },
    { stage: 'docs_pending', sla: 7 },
    { stage: 'credit_review', sla: 4 },
    { stage: 'offer_issued', sla: 5 },
    { stage: 'disbursing', sla: 2 },
  ]
  const totalSla = weights.reduce((s, w) => s + w.sla, 0)
  return weights.map((w) => ({
    stage: w.stage,
    label: stageLabel[w.stage],
    days: avgTotal ? (w.sla / totalSla) * avgTotal : 0,
    target: w.sla,
  }))
}

/* ------------------------------------------------------------------
   Export
   ------------------------------------------------------------------ */

export function toCsv(rows: Row[]): string {
  const head = ['Company', 'Industry', 'Product', 'Submitted', 'Decided', 'Status', 'Amount AED', 'Fee %', 'Commission AED', 'Reason']
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = rows.map((r) => [
    r.company, r.industry, r.product ?? '', r.submittedOn, r.decidedOn ?? '', r.status,
    r.amount ?? '', r.feeRate != null ? (r.feeRate * 100).toFixed(2) : '',
    r.commission != null ? Math.round(r.commission) : '', r.declineReason ?? '',
  ].map(esc).join(','))
  return [head.join(','), ...body].join('\n')
}
