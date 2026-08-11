import type { Application, ClientRecord, ClosedCase, DocumentItem, NotificationItem, Product, Tier } from './types'
import { partA } from './domain'

/** Fixed reference date so every figure on screen reconciles. */
export const TODAY = '2026-08-10'

export const broker = {
  name: 'Omar Abdelaziz',
  initials: 'OA',
  company: 'Gulf Advisory Partners',
  tier: 'gold' as Tier,
  memberSince: '2025-11-04',
  partnerManager: { name: 'Sara Khalil', initials: 'SK', phone: '+971 50 118 4402' },
  /** Quarter to date, Q3 2026. */
  quarter: {
    label: 'Q3 2026',
    endsOn: '2026-09-30',
    disbursed: 4_900_000,
    months: [
      { label: 'Jul', disbursed: 2_600_000, status: 'hit' as const },
      { label: 'Aug', disbursed: 2_300_000, status: 'hit' as const },
      { label: 'Sep', disbursed: 0, status: 'upcoming' as const },
    ],
    /** Consecutive months at or above the monthly target. */
    streakMonths: 4,
  },
  /** Quality score gating the tier bonus. Volume alone must not unlock it. */
  qualityScore: 78,
  qualityFloor: 70,
}

/* ---------------- Document templates ---------------- */

/**
 * Four required documents. That is the whole list — anything else is only
 * ever requested case-by-case as a credit query, never presented up front as
 * a wall of uploads.
 */
function docs(overrides: Partial<Record<string, Partial<DocumentItem>>> = {}): DocumentItem[] {
  const base: DocumentItem[] = [
    {
      id: 'bank_6m',
      name: 'Bank statements — last 6 months',
      description: 'Six consecutive months, downloaded straight from the bank portal. The latest must be within 15 days.',
      status: 'pending', required: true,
    },
    {
      id: 'aecb',
      name: 'AECB consent',
      description: 'Download the consent letter, have the owner sign it, and upload it back. It lets us pull the Al Etihad Credit Bureau report for the business and its shareholders.',
      status: 'pending', required: true,
    },
    {
      id: 'trade_licence',
      name: 'Trade licence',
      description: 'A copy of every valid trade licence held by the business, issued by the relevant UAE authority.',
      status: 'pending', required: true,
    },
    {
      id: 'vat',
      name: 'VAT returns — last 12 months',
      description: 'Twelve months of filed returns, each quarter as a separate PDF from the FTA portal.',
      status: 'pending', required: true,
    },
  ]
  return base.map((d) => ({ ...d, ...(overrides[d.id] ?? {}) }))
}

const allVerified = { bank_6m: { status: 'verified' as const }, aecb: { status: 'verified' as const }, trade_licence: { status: 'verified' as const }, vat: { status: 'verified' as const } }

/* ---------------- Applications ---------------- */

export const applications: Application[] = [
  {
    id: 'a1',
    ref: 'FLP-2026-0741',
    company: 'Desert Rose Foods',
    industry: 'Food & beverage',
    contactName: 'Fatima Al Rashid',
    contactPhone: '+971 50 •••• 34',
    stage: 'offer_issued',
    owner: 'you',
    submittedOn: '2026-07-12',
    daysInStage: 11,
    stageSla: 5,
    requestedAmount: 700_000,
    offer: {
      amount: 620_000,
      product: 'short_term_loan',
      tenureMonths: 6,
      feeRate: 0.02,
      interestRateMonthly: 0.015,
      conditions: [
        'Personal guarantee from the majority shareholder',
        'Standing instruction from the primary operating account',
      ],
      expiresOn: '2026-08-13',
      shareLink: 'https://sign.flapkap.com/o/7f3a91',
      clientViewedAt: '2026-08-06T14:22:00',
    },
    commission: partA(620_000, 0.02),
    commissionStatus: 'pending_disbursal',
    documents: docs({
        trade_licence: { status: 'verified', uploadedAt: '2026-07-14', expiresInDays: 25 },
        vat: { status: 'verified', uploadedAt: '2026-07-15', insight: 'Turnover last 4 quarters: AED 5.1M' },
        bank_6m: { status: 'verified', uploadedAt: '2026-07-16', insight: 'Avg balance AED 85K · 2 bounced cheques' },
        aecb: { status: 'verified', uploadedAt: '2026-07-18' },
      }),
    queries: [],
    protectedUntil: '2026-10-10',
  },
  {
    id: 'a2',
    ref: 'FLP-2026-0802',
    company: 'Al Noor Trading',
    industry: 'Wholesale',
    contactName: 'Yousef Haddad',
    contactPhone: '+971 55 •••• 08',
    stage: 'credit_review',
    owner: 'you',
    submittedOn: '2026-07-28',
    daysInStage: 6,
    stageSla: 3,
    requestedAmount: 450_000,
    documents: docs({
      trade_licence: { status: 'verified', uploadedAt: '2026-07-29' },
      vat: {
        status: 'rejected',
        uploadedAt: '2026-07-30',
        rejection: {
          reason: 'Q2 2026 return is missing from the set — only three quarters were uploaded.',
          example: 'Four consecutive quarterly returns, each as a separate PDF from the FTA portal.',
        },
      },
      bank_6m: { status: 'verified', uploadedAt: '2026-07-29', insight: 'Avg balance AED 41K · monthly credits AED 320K' },
      aecb: { status: 'under_review', uploadedAt: '2026-08-02' },
    }),
    queries: [
      {
        id: 'q1',
        subject: 'VAT proof for Q2 2026',
        raisedAt: '2026-08-08T09:15:00',
        dueInHours: 23,
        escalation: 24,
        resolved: false,
        messages: [
          {
            from: 'credit',
            at: '2026-08-08T09:15:00',
            body: 'The VAT set is missing Q2 2026. Please upload the filed return for that quarter so we can reconcile declared turnover against bank credits.',
          },
        ],
      },
    ],
    protectedUntil: '2026-10-26',
  },
  {
    id: 'a3',
    ref: 'FLP-2026-0698',
    company: 'Sunrise Retail',
    industry: 'Retail',
    contactName: 'Priya Menon',
    contactPhone: '+971 52 •••• 71',
    stage: 'aip_approved',
    owner: 'you',
    submittedOn: '2026-07-02',
    daysInStage: 3,
    stageSla: 3,
    requestedAmount: 480_000,
    documents: docs({
      trade_licence: { status: 'verified', uploadedAt: '2026-07-04' },
      vat: { status: 'verified', uploadedAt: '2026-07-04' },
      bank_6m: { status: 'verified', uploadedAt: '2026-07-05' },
    }),
    queries: [],
    protectedUntil: '2026-09-03',
    waitlistedPartners: 0,
  },
  {
    id: 'a4',
    ref: 'FLP-2026-0811',
    company: 'Gulf Tech Supplies',
    industry: 'IT services',
    contactName: 'Ahmed Siddiqui',
    contactPhone: '+971 56 •••• 19',
    stage: 'aip_review',
    owner: 'flapkap',
    submittedOn: '2026-08-05',
    daysInStage: 2,
    stageSla: 3,
    requestedAmount: 300_000,
    documents: docs({
      trade_licence: { status: 'verified', uploadedAt: '2026-08-05' },
      vat: { status: 'under_review', uploadedAt: '2026-08-06' },
      bank_6m: { status: 'under_review', uploadedAt: '2026-08-06' },
    }),
    queries: [],
    protectedUntil: '2026-08-18',
    waitlistedPartners: 1,
  },
  {
    id: 'a5',
    ref: 'FLP-2026-0833',
    company: 'Emirates Auto Spare',
    industry: 'Automotive parts',
    contactName: 'Rashid Bin Saeed',
    contactPhone: '+971 50 •••• 55',
    stage: 'docs_pending',
    owner: 'you',
    submittedOn: '2026-08-01',
    daysInStage: 4,
    stageSla: 5,
    requestedAmount: 250_000,
    documents: docs({
      trade_licence: { status: 'verified', uploadedAt: '2026-08-02' },
      vat: { status: 'pending' },
      bank_6m: {
        status: 'replacement_required',
        uploadedAt: '2026-08-03',
        rejection: {
          reason: 'Scan is unreadable — the pages are photographed at an angle and the balances cannot be read.',
          example: 'A PDF downloaded straight from the bank portal, not a photo of a printout.',
        },
      },
    }),
    queries: [],
    protectedUntil: '2026-08-31',
  },
  {
    id: 'a6',
    ref: 'FLP-2026-0402',
    company: 'Marina Logistics',
    industry: 'Logistics',
    contactName: 'Hanan Darwish',
    contactPhone: '+971 54 •••• 92',
    stage: 'commission_paid',
    owner: 'done',
    submittedOn: '2026-05-03',
    daysInStage: 2,
    stageSla: 5,
    offer: {
      amount: 870_000, product: 'short_term_loan', tenureMonths: 9,
      feeRate: 0.0175, interestRateMonthly: 0.015, conditions: [],
      expiresOn: '2026-05-28', signedAt: '2026-05-26T11:02:00', clientViewedAt: '2026-05-25T18:40:00',
    },
    disbursedAmount: 870_000,
    disbursedOn: '2026-06-03',
    commission: partA(870_000, 0.0175),
    commissionStatus: 'paid',
    commissionDueOn: '2026-08-08',
    documents: docs(allVerified),
    queries: [],
  },
  {
    id: 'a7',
    ref: 'FLP-2026-0655',
    company: 'Pearl Interiors',
    industry: 'Contracting',
    contactName: 'Layla Nasser',
    contactPhone: '+971 55 •••• 27',
    stage: 'declined',
    owner: 'closed',
    submittedOn: '2026-06-19',
    daysInStage: 47,
    stageSla: 3,
    documents: docs({ trade_licence: { status: 'verified' }, vat: { status: 'verified' }, bank_6m: { status: 'verified' } }),
    queries: [],
    decline: {
      category: 'AECB issue — low score, bounced cheques',
      reason: 'AECB score of 512 with three returned cheques in the last nine months, against a minimum of 600 and a clean six-month window.',
      tellClient:
        'FlapKap can’t proceed right now because of returned cheques on the credit bureau record. That record improves as the cheques age out — we can look again in three months with a clean run behind us.',
      reapplyAfter: '2026-11-19',
      improve: [
        'Six consecutive months with no returned cheques',
        'A current AECB report showing the score above 600',
        'Latest two quarters of VAT filed on time',
      ],
    },
  },
  {
    id: 'a8',
    ref: 'FLP-2026-0790',
    company: 'Bright Star Medical',
    industry: 'Healthcare',
    contactName: 'Dr Samir Fahmy',
    contactPhone: '+971 50 •••• 63',
    stage: 'commission_payable',
    owner: 'flapkap',
    submittedOn: '2026-06-14',
    daysInStage: 19,
    stageSla: 30,
    offer: {
      amount: 1_100_000, product: 'invoice_discounting', tenureMonths: 6,
      feeRate: 0.015, interestRateMonthly: 0.015, conditions: [],
      expiresOn: '2026-07-18', signedAt: '2026-07-16T09:30:00',
    },
    disbursedAmount: 1_100_000,
    disbursedOn: '2026-07-22',
    commission: partA(1_100_000, 0.015),
    commissionStatus: 'awaiting_first_repayment',
    commissionDueOn: '2026-08-18',
    documents: docs(allVerified),
    queries: [],
  },
  {
    id: 'a9',
    ref: 'FLP-2026-0821',
    company: 'Cedar Grove Cafes',
    industry: 'Food & beverage',
    contactName: 'Nadia Chalhoub',
    contactPhone: '+971 56 •••• 41',
    stage: 'commission_payable',
    owner: 'flapkap',
    submittedOn: '2026-06-28',
    daysInStage: 12,
    stageSla: 30,
    offer: {
      amount: 340_000, product: 'short_term_loan', tenureMonths: 6,
      feeRate: 0.02, interestRateMonthly: 0.015, conditions: [],
      expiresOn: '2026-07-25', signedAt: '2026-07-24T16:10:00',
    },
    disbursedAmount: 340_000,
    disbursedOn: '2026-07-29',
    commission: partA(340_000, 0.02),
    commissionStatus: 'awaiting_first_repayment',
    commissionDueOn: '2026-09-01',
    documents: [],
    queries: [],
  },
  {
    id: 'a10',
    ref: 'FLP-2026-0840',
    company: 'Falcon Freight',
    industry: 'Logistics',
    contactName: 'Mariam Al Zaabi',
    contactPhone: '+971 52 •••• 30',
    stage: 'lead',
    owner: 'flapkap',
    submittedOn: '2026-08-09',
    daysInStage: 1,
    stageSla: 1,
    requestedAmount: 600_000,
    documents: docs(),
    queries: [],
    protectedUntil: '2026-09-08',
  },
  {
    id: 'a11',
    ref: 'FLP-2026-0842',
    company: 'Oasis Print House',
    industry: 'Printing',
    contactName: 'Tariq Aziz',
    contactPhone: '+971 55 •••• 77',
    stage: 'disbursing',
    owner: 'flapkap',
    submittedOn: '2026-07-05',
    daysInStage: 2,
    stageSla: 2,
    offer: {
      amount: 400_000, product: 'short_term_loan', tenureMonths: 6,
      feeRate: 0.0225, interestRateMonthly: 0.015, conditions: [],
      expiresOn: '2026-08-20', signedAt: '2026-08-08T10:05:00', clientViewedAt: '2026-08-07T20:15:00',
    },
    commission: partA(400_000, 0.0225),
    commissionStatus: 'pending_disbursal',
    documents: [],
    queries: [],
  },
]

/* ---------------- Closed case history ----------------
   Jan–May 2026, deliberately not overlapping the live pipeline above, so
   nothing is counted twice. Every commission figure is computed by partA()
   rather than typed in, which is why the reports reconcile with the dashboard.
   ------------------------------------------------------------------ */

function funded(
  id: string, company: string, industry: string, product: Product,
  submittedOn: string, disbursedOn: string, amount: number, feeRate: number, daysToOutcome: number,
): ClosedCase {
  return {
    id, company, industry, product, submittedOn, disbursedOn,
    disbursedAmount: amount, feeRate, commission: partA(amount, feeRate),
    outcome: 'funded', daysToOutcome,
  }
}

export const caseHistory: ClosedCase[] = [
  funded('h1',  'Zayed Furnishings',  'Retail',            'short_term_loan',     '2025-12-02', '2026-01-14',   450_000, 0.0175, 43),
  funded('h2',  'Nile Textiles',      'Manufacturing',     'invoice_discounting', '2025-12-11', '2026-01-27',   300_000, 0.0200, 47),
  funded('h3',  'Sahara Cold Chain',  'Logistics',         'short_term_loan',     '2026-01-06', '2026-02-11',   700_000, 0.0175, 36),
  funded('h4',  'Palm View Clinics',  'Healthcare',        'short_term_loan',     '2026-01-19', '2026-02-24',   380_000, 0.0150, 36),
  funded('h5',  'Gulf Stationery',    'Wholesale',         'invoice_discounting', '2026-02-03', '2026-03-10',   260_000, 0.0225, 35),
  funded('h6',  'Emirates Bakehouse', 'Food & beverage',   'short_term_loan',     '2026-02-16', '2026-03-25',   520_000, 0.0200, 37),
  funded('h7',  'Delta Auto Care',    'Automotive parts',  'short_term_loan',     '2026-03-09', '2026-04-13',   340_000, 0.0175, 35),
  funded('h8',  'Skyline Interiors',  'Contracting',       'short_term_loan',     '2026-03-24', '2026-04-29',   610_000, 0.0150, 36),
  funded('h9',  'Oasis Pharma',       'Healthcare',        'invoice_discounting', '2026-04-07', '2026-05-12',   880_000, 0.0175, 35),
  funded('h10', 'Rapid Courier',      'Logistics',         'short_term_loan',     '2026-04-21', '2026-05-26',   240_000, 0.0225, 35),

  /* Declined. The reason strings are the spec's own categories, so the
     drop-off report tells a broker what to pre-screen rather than just that
     they lost. */
  { id: 'h11', company: 'Dune Logistics',      industry: 'Logistics',        product: 'short_term_loan',     submittedOn: '2026-01-13', outcome: 'declined', diedAtStage: 'credit_review', declineReason: 'AECB score below minimum', daysToOutcome: 12 },
  { id: 'h12', company: 'Corniche Cafe',       industry: 'Food & beverage',  product: 'short_term_loan',     submittedOn: '2026-02-09', outcome: 'declined', diedAtStage: 'aip_review',    declineReason: 'Revenue below minimum',      daysToOutcome: 4  },
  { id: 'h13', company: 'Sandstone Build',     industry: 'Contracting',      product: 'short_term_loan',     submittedOn: '2026-03-02', outcome: 'declined', diedAtStage: 'credit_review', declineReason: 'High cash deposit ratio',    daysToOutcome: 15 },
  { id: 'h14', company: 'Lantern Retail',      industry: 'Retail',           product: 'invoice_discounting', submittedOn: '2026-03-30', outcome: 'declined', diedAtStage: 'aip_review',    declineReason: 'Low average balance',        daysToOutcome: 5  },
  { id: 'h15', company: 'Harbour Traders',     industry: 'Wholesale',        product: 'short_term_loan',     submittedOn: '2026-04-14', outcome: 'declined', diedAtStage: 'docs_pending',  declineReason: 'Documents never completed',  daysToOutcome: 31 },
  { id: 'h16', company: 'Vista Fitness',       industry: 'Fitness',          product: 'short_term_loan',     submittedOn: '2026-04-27', outcome: 'withdrawn', diedAtStage: 'offer_issued', declineReason: 'Client took another offer',  daysToOutcome: 28 },
]

/* ---------------- Clients ---------------- */

export const clients: ClientRecord[] = [
  {
    id: 'c1', company: 'Marina Logistics', industry: 'Logistics',
    facilities: 1, totalDisbursed: 870_000, repaidPct: 44, maturesInDays: 118,
    topUpEligibleInDays: 0,
    crossSell: { product: 'invoice_discounting', indicativeLimit: 300_000 },
    lastActivity: '2026-08-08',
  },
  {
    id: 'c2', company: 'Bright Star Medical', industry: 'Healthcare',
    facilities: 1, totalDisbursed: 1_100_000, repaidPct: 12, maturesInDays: 156,
    topUpEligibleInDays: 62, lastActivity: '2026-07-22',
  },
  {
    id: 'c3', company: 'Horizon Fit Studios', industry: 'Fitness',
    facilities: 2, totalDisbursed: 640_000, repaidPct: 91, maturesInDays: 24,
    topUpEligibleInDays: 0,
    crossSell: { product: 'short_term_loan', indicativeLimit: 450_000 },
    lastActivity: '2026-08-01',
  },
  {
    id: 'c4', company: 'Cedar Grove Cafes', industry: 'Food & beverage',
    facilities: 1, totalDisbursed: 340_000, repaidPct: 4, maturesInDays: 172,
    topUpEligibleInDays: 88, lastActivity: '2026-07-29',
  },
]

/* ---------------- Notifications ----------------
   Channel discipline: in-app for everything, email for money and decisions,
   WhatsApp only when something is lost inside 48 hours. See AUDIT.md B3.
   ------------------------------------------------------------------ */

export const notifications: NotificationItem[] = [
  {
    id: 'n1', tone: 'danger', read: false, at: '2026-08-09T09:15:00',
    title: 'Credit query overdue — Al Noor Trading',
    body: 'VAT proof for Q2 2026 is still outstanding. The case goes on hold if it is not answered.',
    channels: ['in_app', 'email', 'whatsapp'], href: '/cases/a2',
  },
  {
    id: 'n2', tone: 'warning', read: false, at: '2026-08-08T12:00:00',
    title: 'Offer expires in 3 days — Desert Rose Foods',
    body: 'AED 620,000 offer issued 30 Jul. The client opened the signing link on 6 Aug but has not signed.',
    channels: ['in_app', 'email', 'whatsapp'], href: '/cases/a1',
  },
  {
    id: 'n3', tone: 'success', read: false, at: '2026-08-08T08:30:00',
    title: 'Commission paid — Marina Logistics',
    body: 'AED 11,419 paid against INV-2026-0318.',
    channels: ['in_app', 'email'], href: '/commissions',
  },
  {
    id: 'n4', tone: 'info', read: true, at: '2026-08-06T16:45:00',
    title: 'Approved in principle — Sunrise Retail',
    body: 'Indicative AED 480,000, short-term loan, 6 months. Complete the full application to keep case protection.',
    channels: ['in_app', 'email', 'whatsapp'], href: '/cases/a3',
  },
  {
    id: 'n5', tone: 'info', read: true, at: '2026-08-05T10:12:00',
    title: 'Case received — Falcon Freight',
    body: 'FLP-2026-0840 registered. Duplicate check passed and the trade licence is locked to you for 30 days.',
    channels: ['in_app'], href: '/cases/a10',
  },
  {
    id: 'n6', tone: 'danger', read: true, at: '2026-08-02T11:20:00',
    title: 'Not approved — Pearl Interiors',
    body: 'AECB issue. Reason and what to tell the client are on the case.',
    channels: ['in_app', 'email'], href: '/cases/a7',
  },
]

/* ---------------- Derived views ---------------- */

/**
 * Commission actually paid, and the deals behind it — derived, never typed in.
 * Reports that disagree with the dashboard are worse than no reports, and the
 * only way to guarantee they agree is to compute both from one place.
 */
export const paidCases = [
  ...caseHistory.filter((c) => c.outcome === 'funded'),
  ...applications
    .filter((a) => a.commissionStatus === 'paid')
    .map((a) => ({
      id: a.id, company: a.company, industry: a.industry,
      product: a.offer!.product, submittedOn: a.submittedOn,
      disbursedOn: a.disbursedOn, disbursedAmount: a.disbursedAmount,
      feeRate: a.offer!.feeRate, commission: a.commission,
      outcome: 'funded' as const, daysToOutcome: 0,
    })),
]

export const commissionPaid = paidCases.reduce((s, c) => s + (c.commission ?? 0), 0)
export const dealsPaid = paidCases.length

export const actionRequired = applications.filter((a) => a.owner === 'you')

export const liveApplications = applications.filter(
  (a) => a.stage !== 'commission_paid' && a.stage !== 'declined',
)

export function byId(id: string): Application | undefined {
  return applications.find((a) => a.id === id)
}

/** Commission earned but not yet released, plus why it is held. */
export const payable = applications.filter((a) => a.commissionStatus === 'awaiting_first_repayment')

/** Expected from cases that have an offer but are not yet funded. */
export const expected = applications.filter((a) => a.commissionStatus === 'pending_disbursal')

