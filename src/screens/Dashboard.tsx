import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FilePlus, CheckCircle, ChatCircleDots, FileX, Signature, Hourglass,
  CaretRight, TrendUp,
} from '@phosphor-icons/react'
import { applications, broker, clients, payable, expected } from '../lib/data'
import { partB, tiers, stageGroups } from '../lib/domain'
import { aed, plural } from '../lib/format'
import {
  Button, Chip, Clock, Donut, EmptyState, ICON_WEIGHT, PageHead, SectionHead, StatStrip,
} from '../components/ui'

const tier = tiers[broker.tier]
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

      {/* 1. Target and top-ups side by side — how the quarter is going, and the
             cheapest way to move it, in the same glance. */}
      <div className="dash-grid">

        {/* The figures and the ring say the same thing two ways: absolute on
            the left, proportional on the right. */}
        <section className="card card--xl" aria-labelledby="target">
          <div className="between wrap" style={{ alignItems: 'center', gap: 'var(--sp-6)' }}>
            <div className="grow" style={{ minWidth: 210 }}>
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

        </section>

        {/* Top-ups sit in the rail: compact lines, no per-row buttons — the
            whole line is the target. */}
        <aside>
          <section className="card" aria-labelledby="topups" style={{ height: '100%' }}>
            <div className="between wrap" style={{ alignItems: 'baseline' }}>
              <h2 id="topups">Ready for a top-up</h2>
              <Link to="/clients" className="text-sm semibold">All clients</Link>
            </div>

            {topUpReady.length > 0 ? (
              <>
                <p className="secondary text-sm" style={{ marginTop: 4 }}>
                  Repaid enough to borrow again. Same commission as a new case.
                </p>
                <div style={{ marginTop: 'var(--sp-4)' }}>
                  {topUpReady.map((c) => (
                    <Link key={c.id} to="/clients" className="task-line">
                      <TrendUp size={19} weight={ICON_WEIGHT} className="task-line__icon" color="var(--success-ink)" aria-hidden />
                      <span className="grow">
                        <span className="task-line__title" style={{ display: 'block' }}>{c.company}</span>
                        <span className="task-line__meta">{c.repaidPct}% repaid on {aed(c.totalDisbursed)}</span>
                      </span>
                      <CaretRight size={15} weight="bold" aria-hidden style={{ marginTop: 4, flex: '0 0 auto' }} />
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p className="secondary text-sm" style={{ marginTop: 'var(--sp-4)' }}>
                No client is far enough through repayment yet. We will surface them here the moment one is.
              </p>
            )}
          </section>
        </aside>
      </div>

      {/* 2. Waiting on you — full width again. Neutral surfaces; urgency lives
             in the time chip, not in a coloured panel. */}
      {tasks.length > 0 ? (
        <section aria-labelledby="waiting">
          <SectionHead
            id="waiting"
            title="Waiting on you"
            action={<span className="secondary text-sm">{plural(tasks.length, 'item')}</span>}
          />
          <ul className="list">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link to={`/cases/${t.id}`} className="item item--link" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Chip tone={t.urgent ? 'warning' : 'neutral'}><t.icon size={19} weight={ICON_WEIGHT} /></Chip>
                  <div className="grow">
                    <h3 style={{ fontSize: 'var(--text-h4)' }}>{t.title}</h3>
                    <p className="secondary text-sm">{t.body}</p>
                  </div>
                  <div className="item__actions">
                    <Clock tone={t.urgent ? 'soon' : 'calm'}>{t.clock}</Clock>
                    <span className="btn btn--secondary btn--sm nowrap">
                      {t.cta} <CaretRight size={14} weight="bold" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card">
          <EmptyState
            icon={<CheckCircle size={30} weight={ICON_WEIGHT} />}
            title="Nothing waiting on you"
            body="Every live case is with your client or with us."
            action={<Button variant="secondary" onClick={() => navigate('/cases')}>View pipeline</Button>}
          />
        </section>
      )}

      {/* 3. Money, in three figures. */}
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
               plotting it produced a shape that bulged at the bottom and read
               as an upside-down funnel. */
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
