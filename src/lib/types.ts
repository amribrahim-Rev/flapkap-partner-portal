/* Domain model. Mirrors the stages and vocabulary in Master-Broker-Portal-v1. */

/** Internal pipeline stage. Broker-facing labels live in `stageLabel`. */
export type Stage =
  | 'lead'
  | 'aip_review'
  | 'aip_approved'
  | 'aip_declined'
  | 'full_app'
  | 'docs_pending'
  | 'credit_review'
  | 'offer_issued'
  | 'offer_accepted'
  | 'disbursing'
  | 'disbursed'
  | 'commission_payable'
  | 'commission_paid'
  | 'declined'

/** Whose court the ball is in. The primary scan dimension in the whole app. */
export type Owner = 'you' | 'client' | 'flapkap' | 'done' | 'closed'

/** Document status vocabulary, verbatim from section 11 of the spec. */
export type DocStatus = 'verified' | 'under_review' | 'rejected' | 'replacement_required' | 'pending'

export type Product = 'short_term_loan' | 'invoice_discounting'

export type Tier = 'silver' | 'gold' | 'platinum'

export interface TierConfig {
  key: Tier
  label: string
  monthlyTarget: number
  quarterlyTarget: number
  bonusRate: number
}

export interface DocumentItem {
  id: string
  name: string
  description: string
  status: DocStatus
  /** Four required documents, and nothing else unless credit asks. */
  required: boolean
  /** Rejection reason plus what a good version looks like. */
  rejection?: { reason: string; example: string }
  /** Populated by extraction once a file is read. */
  insight?: string
  expiresInDays?: number
  uploadedAt?: string
}

export interface Query {
  id: string
  subject: string
  raisedAt: string
  dueInHours: number
  /** 0 = raised, 24/48/72 = escalation rung reached. */
  escalation: 0 | 24 | 48 | 72
  messages: { from: 'credit' | 'broker'; body: string; at: string }[]
  resolved: boolean
}

export interface Offer {
  amount: number
  product: Product
  tenureMonths: number
  /** Arrangement fee charged to the client. Drives Part A commission. */
  feeRate: number
  /** Monthly flat interest. Goes 100% to FlapKap; never affects commission. */
  interestRateMonthly: number
  conditions: string[]
  expiresOn: string
  shareLink?: string
  clientViewedAt?: string
  signedAt?: string
}

export interface Application {
  id: string
  ref: string
  company: string
  industry: string
  contactName: string
  contactPhone: string
  contactEmail: string
  stage: Stage
  owner: Owner
  submittedOn: string
  /** Days sat in the current stage. */
  daysInStage: number
  /** Typical days for this stage, so aging can be judged rather than guessed. */
  stageSla: number
  requestedAmount?: number
  offer?: Offer
  disbursedAmount?: number
  disbursedOn?: string
  /** Commission Part A on this deal, once a fee exists. */
  commission?: number
  commissionStatus?: 'pending_disbursal' | 'awaiting_first_repayment' | 'payable' | 'paid'
  commissionDueOn?: string
  documents: DocumentItem[]
  queries: Query[]
  /** Case protection expiry, ISO date. */
  protectedUntil?: string
  waitlistedPartners?: number
  /** Populated when the case is declined. */
  decline?: {
    category: string
    reason: string
    tellClient: string
    reapplyAfter: string
    improve: string[]
  }
}

export interface ClientRecord {
  id: string
  company: string
  industry: string
  facilities: number
  totalDisbursed: number
  repaidPct: number
  maturesInDays: number
  topUpEligibleInDays: number
  crossSell?: { product: Product; indicativeLimit: number }
  lastActivity: string
}

/**
 * A closed case from before the current pipeline window. Reports need a year
 * of history to be worth opening; the live `applications` array only covers
 * the last few weeks.
 */
export interface ClosedCase {
  id: string
  company: string
  industry: string
  product: Product
  submittedOn: string
  /** Set when the case funded. */
  disbursedOn?: string
  disbursedAmount?: number
  feeRate?: number
  commission?: number
  /** How far it got before dying. Used for drop-off analysis. */
  outcome: 'funded' | 'declined' | 'withdrawn'
  diedAtStage?: Stage
  declineReason?: string
  /** Working days from submission to decision or disbursal. */
  daysToOutcome: number
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  at: string
  channels: ('in_app' | 'email' | 'whatsapp')[]
  tone: 'info' | 'success' | 'warning' | 'danger'
  read: boolean
  href?: string
}
