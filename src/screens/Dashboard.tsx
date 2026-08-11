import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, CheckCircle, UploadSimple, PencilSimpleLine, ChatCircleDots, Hourglass,
  ArrowRight, CaretRight,
} from '@phosphor-icons/react'
import { applications, broker, clients, commissionPaid, payable, expected } from '../lib/data'
import { partB, stageGroups, tiers } from '../lib/domain'
import { aed, longDate, plural } from '../lib/format'
import {
  Button, Donut, EmptyState, ICON_EMPTY, ICON_INLINE, ICON_PILL, ICON_WEIGHT, PageHead, Pill,
} from '../components/ui'

const tier = tiers[broker.tier]
const gap = Math.max(0, tier.quarterlyTarget - broker.quarter.disbursed)
const bonus = partB(tier.quarterlyTarget, broker.tier)
const daysLeft = Math.round(
  (new Date(broker.quarter.endsOn).getTime() - new Date('2026-08-11').getTime()) / 86_400_000,
)

const payableTotal = payable.reduce((s, a) => s + (a.commission ?? 0), 0)
const expectedTotal = expected.reduce((s, a) => s + (a.commission ?? 0), 0)
const topUpReady = clients.filter((c) => c.topUpEligibleInDays === 0)

/** What needs the broker, phrased as the action first and the client second. */
const tasks = [
  { id: 'a2', icon: ChatCircleDots, action: 'Answer query', company: 'Al Noor Trading', meta: 'Yousef Haddad · 23h to reply' },
  { id: 'a1', icon: PencilSimpleLine, action: 'Chase signature', company: 'Desert Rose Foods', meta: 'Fatima Al Rashid · expires 13 Aug' },
  { id: 'a5', icon: UploadSimple, action: 'Replace document', company: 'Emirates Auto Spare', meta: 'Rashid Bin Saeed · 48h left' },
  { id: 'a3', icon: Hourglass, action: 'Continue application', company: 'Sunrise Retail', meta: 'Priya Menon · 89 days protected' },
]

const funnel = stageGroups.filter((g) => g.inFunnel)

export function Dashboard() {
  const navigate = useNavigate()
  const counts = funnel.map((g) => ({ ...g, n: applications.filter((a) => g.stages.includes(a.stage)).length }))
  const widest = Math.max(...counts.map((c) => c.n), 1)

  return (
    <div className="page">
      <PageHead
        eyebrow={longDate('2026-08-11')}
        title={`Good morning, ${broker.name.split(' ')[0]}`}
        meta="Your partner desk, in plain language."
        actions={
          <Button icon={<Plus size={ICON_INLINE} weight="bold" aria-hidden />} onClick={() => navigate('/new-case')}>
            Submit a case
          </Button>
        }
      />

      <div className="overview">

        {/* Quarterly target — figures left, ring right. */}
        <section className="card card--xl" aria-labelledby="target">
          <h2 id="target" className="micro">Quarterly target</h2>
          <div className="row-tight wrap" style={{ marginTop: 'var(--sp-3)' }}>
            <Pill tone="pill--gold">{tier.label} tier</Pill>
            <span className="secondary text-sm">{broker.quarter.label}</span>
          </div>

          <div className="between wrap" style={{ alignItems: 'center', gap: 'var(--sp-5)', marginTop: 'var(--sp-5)' }}>
            <div className="grow" style={{ minWidth: 190 }}>
              <p className="wallet__balance" style={{ margin: 0 }}>
                {aed(broker.quarter.disbursed)}
                <small style={{ display: 'block' }}>of {aed(tier.quarterlyTarget)}</small>
              </p>
              <div className="bar" style={{ margin: 'var(--sp-4) 0 var(--sp-3)' }}>
                <i style={{ width: `${(broker.quarter.disbursed / tier.quarterlyTarget) * 100}%` }} />
              </div>
              <p className="secondary text-sm">
                {gap > 0
                  ? <><strong style={{ color: 'var(--text)' }}>{aed(gap, { compact: true })}</strong> to your {aed(bonus)} bonus · {plural(daysLeft, 'day')} left</>
                  : <>Bonus secured — {aed(bonus)}</>}
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

        {/* Waiting on you. */}
        <section className="card card--xl" aria-labelledby="waiting">
          <div className="between wrap" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 id="waiting">Waiting on you</h2>
              <p className="secondary text-sm" style={{ marginTop: 3 }}>Small moves that keep cases moving.</p>
            </div>
            <Link to="/cases" className="text-sm semibold row-tight" style={{ gap: 6 }}>
              View all <ArrowRight size={ICON_PILL} weight="bold" aria-hidden />
            </Link>
          </div>

          {tasks.length > 0 ? (
            <div style={{ marginTop: 'var(--sp-4)' }}>
              {tasks.map((t) => (
                <Link key={t.id} to={`/cases/${t.id}`} className="task-line">
                  <span className="doc-row__icon" aria-hidden>
                    <t.icon size={ICON_INLINE} weight={ICON_WEIGHT} />
                  </span>
                  <span className="grow">
                    <span className="task-line__title" style={{ display: 'block' }}>{t.action} · {t.company}</span>
                    <span className="task-line__meta">{t.meta}</span>
                  </span>
                  <CaretRight size={ICON_PILL} weight="bold" aria-hidden style={{ marginTop: 4, flex: '0 0 auto' }} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle size={ICON_EMPTY} weight={ICON_WEIGHT} />}
              title="Nothing waiting on you"
              body="Every live case is with your client or with us."
            />
          )}
        </section>

        {/* Commission summary — the three states of money, figure on the right. */}
        <section className="card card--xl" aria-labelledby="money">
          <div className="between wrap" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 id="money">Commission summary</h2>
              <p className="secondary text-sm" style={{ marginTop: 3 }}>Clear money, no surprises.</p>
            </div>
            <Link to="/commissions" className="text-sm semibold row-tight" style={{ gap: 6 }}>
              Details <ArrowRight size={ICON_PILL} weight="bold" aria-hidden />
            </Link>
          </div>

          <div style={{ marginTop: 'var(--sp-4)' }}>
            <div className="money-row">
              <span>
                <span className="semibold" style={{ display: 'block' }}>Paid to you</span>
                <span className="text-xs muted">Released after first repayment</span>
              </span>
              <span className="money-row__figure" style={{ color: 'var(--success-ink)' }}>{aed(commissionPaid)}</span>
            </div>
            <div className="money-row">
              <span>
                <span className="semibold" style={{ display: 'block' }}>Payable</span>
                <span className="text-xs muted">{plural(payable.length, 'deal')} funded, awaiting first repayment</span>
              </span>
              <span className="money-row__figure" style={{ color: 'var(--gold-ink)' }}>{aed(payableTotal)}</span>
            </div>
            <div className="money-row">
              <span>
                <span className="semibold" style={{ display: 'block' }}>In live offers</span>
                <span className="text-xs muted">Not earned until the deal funds</span>
              </span>
              <span className="money-row__figure" style={{ color: 'var(--primary-text)' }}>{aed(expectedTotal)}</span>
            </div>
          </div>

          <p className="text-xs muted" style={{ marginTop: 'var(--sp-4)' }}>
            You earn 75% of the arrangement fee. At the 1.50% floor you earn a flat 1.0% of disbursal.
          </p>
        </section>

        {/* Pipeline as labelled tracks, each one clickable through to its cases. */}
        <section className="card card--xl" aria-labelledby="pipeline">
          <div className="between wrap" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 id="pipeline">Pipeline</h2>
              <p className="secondary text-sm" style={{ marginTop: 3 }}>Click a stage to see the clients inside it.</p>
            </div>
            <Link to="/cases" className="text-sm semibold row-tight" style={{ gap: 6 }}>
              All cases <ArrowRight size={ICON_PILL} weight="bold" aria-hidden />
            </Link>
          </div>

          <div style={{ marginTop: 'var(--sp-4)' }}>
            {counts.map((g) => (
              <button
                key={g.key}
                className="track-row"
                onClick={() => navigate(`/cases?group=${g.key}`)}
                aria-label={`${g.label}: ${plural(g.n, 'case')}`}
              >
                <span className="text-sm">{g.label}</span>
                <span className="track-row__bar">
                  <span className="track-row__fill" style={{ width: `${Math.max(3, (g.n / widest) * 100)}%`, background: g.tone }} />
                </span>
                <span className="track-row__n">{g.n}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Ready for a top-up, spanning both columns. */}
        {topUpReady.length > 0 && (
          <section className="card card--xl overview__wide" aria-labelledby="topups">
            <div className="between wrap" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 id="topups">Ready for a top-up</h2>
                <p className="secondary text-sm" style={{ marginTop: 3 }}>
                  Existing clients with healthy repayment signals.
                </p>
              </div>
              <Link to="/clients" className="text-sm semibold row-tight" style={{ gap: 6 }}>
                Client performance <ArrowRight size={ICON_PILL} weight="bold" aria-hidden />
              </Link>
            </div>

            <div className="tile-grid" style={{ marginTop: 'var(--sp-4)' }}>
              {topUpReady.map((c) => (
                <Link key={c.id} to="/clients" className="tile">
                  <span className="grow">
                    <span className="semibold" style={{ display: 'block' }}>{c.company}</span>
                    <span className="text-xs muted">{aed(c.totalDisbursed)} disbursed · {c.repaidPct}% repaid</span>
                  </span>
                  <Pill tone="pill--done" noDot>Eligible</Pill>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <p className="text-xs muted">
        Illustrative sample data for this build. Your live partner desk updates these figures automatically.
      </p>
    </div>
  )
}
