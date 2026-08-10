import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FilePlus, CheckCircle, ChatCircleDots, FileX, Signature, Hourglass,
  CaretRight, TrendUp,
} from '@phosphor-icons/react'
import { applications, broker, clients, payable, expected } from '../lib/data'
import { partB, tiers, tierOrder, stageGroups } from '../lib/domain'
import { aed, plural } from '../lib/format'
import {
  Button, Clock, Donut, EmptyState, ICON_WEIGHT, PageHead, SectionHead, StatStrip,
} from '../components/ui'

const tier = tiers[broker.tier]
const nextTier = tierOrder[tierOrder.indexOf(broker.tier) + 1]
const gap = Math.max(0, tier.quarterlyTarget - broker.quarter.disbursed)
const bonus = partB(tier.quarterlyTarget, broker.tier)
const daysLeft = Math.round(
  (new Date(broker.quarter.endsOn).getTime() - new Date('2026-08-10').getTime()) / 86_400_000,
)

const payableTotal = payable.reduce((s, a) => s + (a.commission ?? 0), 0)
const expectedTotal = expected.reduce((s, a) => s + (a.commission ?? 0), 0)

const topUpReady = clients.filter((c) => c.topUpEligibleInDays === 0)

/** Only what genuinely needs the broker, with the reason in one line. */
const tasks = [
  { id: 'a2', icon: ChatCircleDots, title: 'Al Noor Trading', body: 'Credit query unanswered — Q2 VAT return', clock: '23h left', urgent: true, cta: 'Reply' },
  { id: 'a1', icon: Signature, title: 'Desert Rose Foods', body: 'AED 620K offer unsigned since 6 Aug', clock: 'Expires 13 Aug', urgent: true, cta: 'Resend' },
  { id: 'a5', icon: FileX, title: 'Emirates Auto Spare', body: 'Bank statement unreadable, needs replacing', clock: '48h left', urgent: false, cta: 'Explain' },
  { id: 'a3', icon: Hourglass, title: 'Sunrise Retail', body: 'Approved in principle, documents not started', clock: '4 days', urgent: false, cta: 'Continue' },
]

const funnel = stageGroups.filter((g) => g.inFunnel)

export function Dashboard() {
  const navigate = useNavigate()
  const [open, setOpen] = useState<string | null>(null)

  const counts = funnel.map((g) => ({
    ...g,
    cases: applications.filter((a) => g.stages.includes(a.stage)),
  }))

  return (
    <div className="page">
      <PageHead
        title={`Good morning, ${broker.name.split(' ')[0]}`}
        meta={`${broker.company} · ${tier.label} partner`}
        actions={
          <Button icon={<FilePlus size={18} weight="bold" aria-hidden />} onClick={() => navigate('/new-case')}>
            New case
          </Button>
        }
      />

      {/* 1. Target and top-ups in the main column, what needs the broker in a
             rail beside them — "how am I doing" and "what must I do" readable
             in one look, without scrolling between the two. */}
      <div className="dash-grid">
        <div className="dash-grid__main">

          {/* Target. The figures and the ring say the same thing two ways:
              absolute on the left, proportional on the right. */}
          <section className="card card--xl" aria-labelledby="target">
            <div className="between wrap" style={{ alignItems: 'center', gap: 'var(--sp-6)' }}>
              <div className="grow" style={{ minWidth: 220 }}>
                <h2 id="target">Quarterly target</h2>
                <div className="row-tight wrap" style={{ marginTop: 'var(--sp-3)' }}>
                  <span className="pill pill--gold">{tier.label} tier</span>
                  <span className="secondary text-sm">{broker.quarter.label}</span>
                  <span className="text-sm" style={{ color: 'var(--warning)', fontWeight: 600 }}>
                    {plural(daysLeft, 'day')} left
                  </span>
                </div>

                <p className="target__figure" style={{ marginTop: 'var(--sp-5)' }}>
                  {aed(broker.quarter.disbursed)}
                  <small>of {aed(tier.quarterlyTarget)} disbursed</small>
                </p>

                <div className="bar" style={{ margin: 'var(--sp-4) 0 var(--sp-3)' }}>
                  <i style={{ width: `${(broker.quarter.disbursed / tier.quarterlyTarget) * 100}%` }} />
                </div>

                <p className="secondary text-sm">
                  {gap > 0
                    ? <><strong style={{ color: 'var(--text)' }}>{aed(gap, { compact: true })}</strong> to secure your {aed(bonus)} bonus</>
                    : <>Bonus secured — <strong style={{ color: 'var(--success-ink)' }}>{aed(bonus)}</strong></>}
                </p>
              </div>

              <Donut
                value={broker.quarter.disbursed}
                max={tier.quarterlyTarget}
                caption="to target"
                label={`${broker.quarter.label} disbursal against the ${tier.label} target`}
              />
            </div>

            {nextTier && (
              <div className="region">
                <p className="secondary text-sm">
                  {tier.label} pays {(tier.bonusRate * 100).toFixed(2)}% on everything you disburse this quarter.{' '}
                  {tiers[nextTier].label} pays {(tiers[nextTier].bonusRate * 100).toFixed(2)}% —{' '}
                  <strong style={{ color: 'var(--success-ink)' }}>
                    {aed(partB(tiers[nextTier].quarterlyTarget, nextTier) - bonus)} more a quarter
                  </strong>.
                </p>
              </div>
            )}
          </section>

          {/* Ready for a top-up — the second part of this column. */}
          {topUpReady.length > 0 && (
            <section className="card" aria-labelledby="topups">
              <div className="between wrap" style={{ alignItems: 'baseline' }}>
                <h2 id="topups">Ready for a top-up</h2>
                <Link to="/clients" className="text-sm semibold">All clients</Link>
              </div>
              <p className="secondary text-sm" style={{ marginTop: 4 }}>
                Repaid enough to borrow again. Same commission as a new case.
              </p>
              <div style={{ marginTop: 'var(--sp-4)' }}>
                {topUpReady.map((c) => (
                  <Link key={c.id} to="/clients" className="task-line">
                    <TrendUp size={19} weight={ICON_WEIGHT} className="task-line__icon" color="var(--success-ink)" aria-hidden />
                    <span className="grow">
                      <span className="task-line__title" style={{ display: 'block' }}>{c.company}</span>
                      <span className="task-line__meta">
                        {c.repaidPct}% repaid on {aed(c.totalDisbursed)}
                      </span>
                    </span>
                    <CaretRight size={15} weight="bold" aria-hidden style={{ marginTop: 4, flex: '0 0 auto' }} />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Rail: what needs the broker. Compact lines, no per-row buttons —
            the whole line is the target. */}
        <aside>
          <section className="card" aria-labelledby="waiting">
            <div className="between wrap" style={{ alignItems: 'baseline' }}>
              <h2 id="waiting">Waiting on you</h2>
              <span className="secondary text-sm">{plural(tasks.length, 'item')}</span>
            </div>

            {tasks.length > 0 ? (
              <>
                <p className="secondary text-sm" style={{ marginTop: 4 }}>
                  Small moves that keep cases going.
                </p>
                <div style={{ marginTop: 'var(--sp-4)' }}>
                  {tasks.map((t) => (
                    <Link key={t.id} to={`/cases/${t.id}`} className="task-line">
                      <t.icon
                        size={19}
                        weight={ICON_WEIGHT}
                        className="task-line__icon"
                        color={t.urgent ? 'var(--warning)' : 'var(--text-secondary)'}
                        aria-hidden
                      />
                      <span className="grow">
                        <span className="task-line__title" style={{ display: 'block' }}>{t.cta} · {t.title}</span>
                        <span className="task-line__meta">{t.body}</span>
                      </span>
                      <Clock tone={t.urgent ? 'soon' : 'calm'}>{t.clock}</Clock>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={<CheckCircle size={26} weight={ICON_WEIGHT} />}
                title="Nothing waiting on you"
                body="Every live case is with your client or with us."
                action={<Button variant="secondary" size="sm" onClick={() => navigate('/cases')}>View pipeline</Button>}
              />
            )}
          </section>
        </aside>
      </div>

      {/* 2. Money, in three figures. */}
      <section className="card" aria-label="Commission summary">
        <StatStrip
          stats={[
            { label: 'Paid to you', value: aed(broker.commissionPaidYtd), note: `${plural(broker.dealsPaidYtd, 'deal')} this year` },
            { label: 'Payable', value: aed(payableTotal), tone: 'primary', note: 'Awaiting first repayment' },
            { label: 'In live offers', value: aed(expectedTotal), tone: 'muted', note: 'Not earned until funded' },
          ]}
        />
      </section>

      {/* 4. Funnel. The silhouette shows the journey; the figures carry the
             volume; every band opens its client list, so a count is never a
             dead end. */}
      <section aria-labelledby="pipeline">
        <SectionHead
          id="pipeline"
          title="Your pipeline"
          action={<Link to="/cases" className="text-sm semibold">See all cases</Link>}
        />
        <div className="funnel">
          {counts.map((g, i) => {
            const isOpen = open === g.key
            /* Width tapers by POSITION in the journey, not by how many cases
               happen to be sitting at each stage. Occupancy is not monotonic —
               plotting it produced a bar chart bulging at the bottom that read
               as an upside-down funnel. Position always narrows, so the
               silhouette now says "this is a journey" and the numbers carry
               the volume. */
            const width = 100 - (i / Math.max(1, counts.length - 1)) * 42
            const value = g.cases.reduce((s, a) => s + (a.disbursedAmount ?? a.offer?.amount ?? a.requestedAmount ?? 0), 0)
            return (
              <div key={g.key}>
                <div className="funnel__row">
                  <button
                    className="funnel__bar"
                    style={{ width: `${width}%`, background: g.tone }}
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : g.key)}
                  >
                    <span className="funnel__count">
                      {g.cases.length}
                      {value > 0 && <span> · {aed(value, { compact: true })}</span>}
                    </span>
                    <span className="funnel__name">{g.label}</span>
                  </button>
                </div>

                {isOpen && (
                  <div className="funnel__panel tabpanel">
                    {g.cases.length === 0 ? (
                      <p className="secondary text-sm" style={{ textAlign: 'center' }}>No cases at this stage.</p>
                    ) : (
                      g.cases.map((a) => (
                        <Link key={a.id} to={`/cases/${a.id}`} className="line">
                          <span className="grow semibold">{a.company}</span>
                          <span className="secondary text-sm nowrap">
                            {a.disbursedAmount ?? a.offer?.amount ?? a.requestedAmount
                              ? aed(a.disbursedAmount ?? a.offer?.amount ?? a.requestedAmount ?? 0)
                              : '—'}
                          </span>
                          <CaretRight size={14} weight="bold" aria-hidden />
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="funnel__hint">Select any stage to see the clients in it.</p>
      </section>
    </div>
  )
}
