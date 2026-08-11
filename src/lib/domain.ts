import type { DocStatus, Owner, Product, Stage, Tier, TierConfig } from './types'

/* ------------------------------------------------------------------
   Labels. Internal names never reach the broker; these do.
   ------------------------------------------------------------------ */

export const stageLabel: Record<Stage, string> = {
  lead: 'Case received',
  aip_review: 'Under review by our credit team',
  aip_approved: 'Approved in principle',
  aip_declined: 'Not approved at AIP',
  full_app: 'Full application in progress',
  docs_pending: 'Collecting documents',
  credit_review: 'Credit assessment',
  offer_issued: 'Offer awaiting signature',
  offer_accepted: 'Offer signed',
  disbursing: 'Preparing disbursement',
  disbursed: 'Funded',
  commission_payable: 'Commission payable',
  commission_paid: 'Commission paid',
  declined: 'Not approved',
}

export const ownerLabel: Record<Owner, string> = {
  you: 'Your move',
  client: "Client's move",
  flapkap: 'FlapKap',
  done: 'Paid',
  closed: 'Closed',
}

/** One class per owner, so state is expressed the same way everywhere. */
export const ownerPill: Record<Owner, string> = {
  you: 'pill--you',
  client: 'pill--client',
  flapkap: 'pill--flapkap',
  done: 'pill--done',
  closed: 'pill--closed',
}

export const docStatusLabel: Record<DocStatus, string> = {
  verified: 'Verified',
  under_review: 'Under review',
  rejected: 'Rejected',
  replacement_required: 'Replacement required',
  pending: 'Pending',
}

export const docStatusPill: Record<DocStatus, string> = {
  verified: 'pill--done',
  under_review: 'pill--flapkap',
  rejected: 'pill--urgent',
  replacement_required: 'pill--you',
  pending: 'pill--closed',
}

export const productLabel: Record<Product, string> = {
  short_term_loan: 'Business short-term loan',
  invoice_discounting: 'Invoice discounting',
}

/* ------------------------------------------------------------------
   Stage groups — the broker's six buckets.

   One definition, used by both the dashboard funnel and the case filters, so
   the two can never disagree about what "under risk review" means.
   ------------------------------------------------------------------ */

export interface StageGroup {
  key: string
  label: string
  stages: Stage[]
  /** Funnel bar tint, as a token: a tint that reads on #070b13 is invisible
      on a light ground, so each theme supplies its own value. */
  tone: string
  /** Rejected sits outside the funnel; it is an exit, not a step. */
  inFunnel: boolean
}

export const stageGroups: StageGroup[] = [
  { key: 'submitted',   label: 'Cases submitted',   stages: ['lead'],                                                              tone: 'rgba(154,164,186,0.08)', inFunnel: true },
  { key: 'docs',        label: 'Uploading docs',    stages: ['docs_pending', 'full_app'],                                          tone: 'var(--funnel-2)', inFunnel: true },
  { key: 'risk',        label: 'Under risk review', stages: ['aip_review', 'credit_review'],                                       tone: 'var(--funnel-3)', inFunnel: true },
  { key: 'conditional', label: 'Conditional offer', stages: ['aip_approved'],                                                      tone: 'var(--funnel-4)', inFunnel: true },
  { key: 'final',       label: 'Final offer',       stages: ['offer_issued', 'offer_accepted'],                                    tone: 'var(--funnel-5)', inFunnel: true },
  { key: 'funded',      label: 'Funded',            stages: ['disbursing', 'disbursed', 'commission_payable', 'commission_paid'],   tone: 'var(--funnel-6)', inFunnel: true },
  { key: 'rejected',    label: 'Rejected',          stages: ['declined', 'aip_declined'],                                          tone: 'var(--funnel-0)', inFunnel: false },
]

export function groupOf(stage: Stage): StageGroup | undefined {
  return stageGroups.find((g) => g.stages.includes(stage))
}

/* ------------------------------------------------------------------
   Commission. Two parts, per section 16 of the spec.
   ------------------------------------------------------------------ */

export const FEE_FLOOR = 0.015
/** Broker's share of the gross arrangement fee above the floor. */
export const BROKER_FEE_SHARE = 0.75
/** At exactly the floor the schedule pays 1.0% of the disbursal instead. */
export const FLOOR_BROKER_RATE = 0.01

export const tiers: Record<Tier, TierConfig> = {
  silver:   { key: 'silver',   label: 'Silver',   monthlyTarget: 1_000_000, quarterlyTarget: 3_000_000, bonusRate: 0.0015 },
  gold:     { key: 'gold',     label: 'Gold',     monthlyTarget: 1_500_000, quarterlyTarget: 4_500_000, bonusRate: 0.0020 },
  platinum: { key: 'platinum', label: 'Platinum', monthlyTarget: 2_500_000, quarterlyTarget: 7_500_000, bonusRate: 0.0025 },
}

export const tierOrder: Tier[] = ['silver', 'gold', 'platinum']

/**
 * Part A — commission on a single deal.
 *
 * NOTE: the two branches do not meet. At exactly 1.5% the broker receives
 * 1.0% of the disbursal; a hair above it they receive 75% of the gross fee,
 * which is more. On AED 500K that is 5,000 vs 5,663 — a 13% step for a
 * rounding change. Flagged in design/SPEC-REVIEW.md section A2; implemented
 * as specified rather than silently smoothed.
 */
export function partA(disbursal: number, feeRate: number): number {
  if (feeRate <= FEE_FLOOR) return disbursal * FLOOR_BROKER_RATE
  return disbursal * feeRate * BROKER_FEE_SHARE
}

/** What FlapKap retains of the arrangement fee. Interest is separate. */
export function flapkapRetains(disbursal: number, feeRate: number): number {
  return disbursal * feeRate - partA(disbursal, feeRate)
}

/** Part B — quarterly volume bonus, once the tier target is secured. */
export function partB(quarterDisbursed: number, tier: Tier): number {
  return quarterDisbursed * tiers[tier].bonusRate
}

/* ------------------------------------------------------------------
   Case protection, per section 6.
   ------------------------------------------------------------------ */

export const PROTECTION_DAYS = { lead: 30, aipApproved: 60, fullApp: 90 } as const

/* ------------------------------------------------------------------
   Aging. Lets the UI say "2 days of ~3" instead of a bare number.
   ------------------------------------------------------------------ */

export type Aging = 'ok' | 'due' | 'late'

export function aging(daysInStage: number, sla: number): Aging {
  if (daysInStage <= sla) return 'ok'
  if (daysInStage <= sla * 2) return 'due'
  return 'late'
}

export const agingClock: Record<Aging, string> = {
  ok: 'clock--calm',
  due: 'clock--soon',
  late: 'clock--urgent',
}
