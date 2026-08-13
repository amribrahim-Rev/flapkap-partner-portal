import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle, UploadSimple, PencilSimpleLine, ChatCircleDots, Hourglass,
  ArrowRight, CaretRight, Check, TrendUp, WhatsappLogo, Target, ClipboardText,
  CreditCard, SquaresFour, Pulse, BookOpen,
} from '@phosphor-icons/react'
import {
  applications, broker, clients, commissionPaid, dealsPaid, payable, TODAY,
} from '../lib/data'
import { partA, partB, stageGroups, tiers } from '../lib/domain'
import { applyFilters, summary } from '../lib/reports'
import { aed, daysBetween, longDate, pct, plural } from '../lib/format'
import {
  Button, EmptyState, ICON_EMPTY, ICON_INLINE, ICON_PILL, ICON_ROW, ICON_WEIGHT,
  PageHead, Pill, Progress,
} from '../components/ui'

const payableTotal = payable.reduce((s, a) => s + (a.commission ?? 0), 0)
const topUpReady = clients.filter((c) => c.topUpEligibleInDays === 0)

/* ---- Quarterly target ----
   Gold's 4.5M is already cleared, so the bar that means anything is the one to
   the tier being chased. Same anatomy as the reference card, honest numbers. */
const nextTier = tiers.platinum
const quarterDisbursed = broker.quarter.disbursed
const quarterTarget = nextTier.quarterlyTarget
const quarterPct = (quarterDisbursed / quarterTarget) * 100
const daysLeftInQuarter = daysBetween(TODAY, broker.quarter.endsOn)
const bonusOnPace = partB(quarterDisbursed, broker.tier)

/* ---- Commission balance ----
   "Last 30 days" is measured on the date the money landed, not the date the
   deal disbursed — those are different questions and only one is the wallet. */
const paidLast30 = applications
  .filter((a) => a.commissionStatus === 'paid' && a.commissionDueOn && daysBetween(a.commissionDueOn, TODAY) <= 30)
  .reduce((s, a) => s + (a.commission ?? 0), 0)

/* ---- Partner pulse ----
   Twelve months, because a quarter six weeks old has no funded cases in it and
   a 0% approval rate would be a reporting artefact rather than a fact. */
const pulse = summary(applyFilters({ period: 'last12', from: '', to: '', industry: 'all', product: 'all' }))

/** What needs the broker, phrased as the action first and the client second. */
const tasks = [
  { id: 'a2', icon: ChatCircleDots, action: 'Answer query', company: 'Al Noor Trading', meta: 'Yousef Haddad · 23h to reply' },
  { id: 'a1', icon: PencilSimpleLine, action: 'Chase signature', company: 'Desert Rose Foods', meta: 'Fatima Al Rashid · expires 13 Aug' },
  { id: 'a5', icon: UploadSimple, action: 'Replace document', company: 'Emirates Auto Spare', meta: 'Rashid Bin Saeed · 48h left' },
  { id: 'a3', icon: Hourglass, action: 'Continue application', company: 'Sunrise Retail', meta: 'Priya Menon · 89 days protected' },
]

const funnel = stageGroups.filter((g) => g.inFunnel)

/** Card header: title, one-line subtitle, and the card's own glyph on the right. */
function CardHead({ id, title, sub, icon }: { id: string; title: string; sub: string; icon: ReactNode }) {
  return (
    <div className="card__head">
      <div>
        <h2 id={id}>{title}</h2>
        <p className="secondary text-sm" style={{ marginTop: 3 }}>{sub}</p>
      </div>
      <span className="card__ico" aria-hidden>{icon}</span>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const counts = funnel.map((g) => ({ ...g, n: applications.filter((a) => g.stages.includes(a.stage)).length }))
  const widest = Math.max(...counts.map((c) => c.n), 1)

  return (
    <div className="page">
      {/* No action here: the top bar already carries "New case" and two
          identical primary buttons within 60px of each other read as a bug. */}
      <PageHead
        title={`Good morning, ${broker.name.split(' ')[0]}`}
        meta={`${longDate(TODAY)} · Here is what needs your attention today.`}
      />

      <div className="dash">

        {/* ---------- Quarterly target ---------- */}
        <section className="card card--xl card--rings" aria-labelledby="target">
          <CardHead
            id="target"
            title="Quarterly target"
            sub={`${broker.quarter.label} · ${plural(daysLeftInQuarter, 'day')} left`}
            icon={<Target size={ICON_ROW} weight={ICON_WEIGHT} color="var(--gold-ink)" />}
          />

          <p className="dash__figure" style={{ marginTop: 'var(--sp-5)' }}>
            {aed(quarterDisbursed, { compact: true })}
            <span className="dash__figure-of"> of {aed(quarterTarget, { compact: true })}</span>
          </p>
          <p className="secondary text-sm" style={{ marginTop: 4 }}>
            {quarterPct.toFixed(1)}% of the {nextTier.label} target is disbursed
          </p>

          <div style={{ marginTop: 'var(--sp-4)' }}>
            <Progress value={quarterPct} tone="gold" large label="Quarterly disbursal against the Platinum target" />
          </div>

          <div className="between wrap text-sm" style={{ marginTop: 'var(--sp-3)', gap: 'var(--sp-3)' }}>
            <span className="secondary">On pace to unlock {aed(bonusOnPace)} bonus</span>
            <span className="semibold">{aed(quarterTarget - quarterDisbursed, { compact: true })} to go</span>
          </div>
        </section>

        {/* ---------- Waiting on you ---------- */}
        <section className="card card--xl" aria-labelledby="waiting">
          <CardHead
            id="waiting"
            title="Waiting on you"
            sub={`${plural(tasks.length, 'action')} to keep cases moving`}
            icon={<ClipboardText size={ICON_ROW} weight={ICON_WEIGHT} color="var(--primary-text)" />}
          />

          {tasks.length > 0 ? (
            <div style={{ marginTop: 'var(--sp-4)' }}>
              {tasks.map((t) => (
                <Link key={t.id} to={`/cases/${t.id}`} className="task-line">
                  <span className="doc-row__icon" aria-hidden>
                    <t.icon size={ICON_INLINE} weight={ICON_WEIGHT} />
                  </span>
                  <span className="grow">
                    <span className="task-line__title" style={{ display: 'block' }}>{t.action}</span>
                    <span className="task-line__meta">{t.company} · {t.meta.split(' · ')[1] ?? t.meta}</span>
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

        {/* ---------- Commission balance ---------- */}
        <section className="card card--xl" aria-labelledby="balance">
          <CardHead
            id="balance"
            title="Commission balance"
            sub="Paid to you this year"
            icon={<CreditCard size={ICON_ROW} weight={ICON_WEIGHT} color="var(--success-ink)" />}
          />

          <p className="dash__figure" style={{ marginTop: 'var(--sp-5)', color: 'var(--success-ink)' }}>
            {aed(commissionPaid)}
          </p>
          <p className="secondary text-sm" style={{ marginTop: 4 }}>
            {aed(payableTotal)} pending release
          </p>

          <div className="dash__pair">
            <div>
              <p className="dash__sub-figure">{aed(paidLast30)}</p>
              <p className="text-xs muted">Last 30 days</p>
            </div>
            <div>
              <p className="dash__sub-figure">{dealsPaid}</p>
              <p className="text-xs muted">Deals paid</p>
            </div>
          </div>

          <p className="text-xs muted" style={{ marginTop: 'var(--sp-4)' }}>
            <Link to="/commissions">Open your wallet</Link> for what is payable and when it lands.
          </p>
        </section>

        {/* ---------- Your pipeline ---------- */}
        <section className="card card--xl dash__two" aria-labelledby="pipeline">
          <div className="card__head">
            <div>
              <h2 id="pipeline">Your pipeline</h2>
              <p className="secondary text-sm" style={{ marginTop: 3 }}>Click a stage to see the clients inside it</p>
            </div>
            <div className="row-tight">
              <Link to="/cases" className="text-sm semibold row-tight" style={{ gap: 6 }}>
                All cases <ArrowRight size={ICON_PILL} weight="bold" aria-hidden />
              </Link>
              <span className="card__ico" aria-hidden>
                <SquaresFour size={ICON_ROW} weight={ICON_WEIGHT} color="var(--primary-text)" />
              </span>
            </div>
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

        {/* ---------- Partner pulse ---------- */}
        <section className="card card--xl" aria-labelledby="pulse">
          <CardHead
            id="pulse"
            title="Partner pulse"
            sub="Across the last 12 months"
            icon={<Pulse size={ICON_ROW} weight={ICON_WEIGHT} color="var(--gold-ink)" />}
          />

          <div className="dash__pulse">
            <div>
              <p className="dash__sub-figure">{aed(pulse.disbursed, { compact: true })}</p>
              <p className="text-xs muted">Disbursal volume</p>
            </div>
            <div>
              <p className="dash__sub-figure">{pct(pulse.conversion, 0)}</p>
              <p className="text-xs muted">Approval rate</p>
            </div>
            <div>
              <p className="dash__sub-figure">{pulse.avgDaysToFund.toFixed(1)}d</p>
              <p className="text-xs muted">Avg. to funding</p>
            </div>
          </div>

          <p className="text-xs muted" style={{ marginTop: 'var(--sp-4)' }}>
            <Link to="/reports">See where cases stop</Link> and what each industry converts at.
          </p>
        </section>

        {/* ---------- Ready for a top-up — kept from our build ---------- */}
        {topUpReady.length > 0 && (
          <section className="card card--xl dash__wide" aria-labelledby="topups">
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

            {/* Each card leads with what the top-up is WORTH to the broker.
                It used to show "AED 870,000 disbursed · 44% repaid", which is
                information, not a reason to pick up the phone. */}
            <div className="tile-grid" style={{ marginTop: 'var(--sp-4)' }}>
              {topUpReady.map((c) => {
                const estimate = partA(c.totalDisbursed, 0.0175)
                return (
                  <div className="topup" key={c.id}>
                    <div className="between" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: 'var(--text-h4)' }}>{c.company}</h3>
                        <p className="text-xs muted">{c.industry}</p>
                      </div>
                      <Pill tone="pill--done" noDot>
                        <Check size={ICON_PILL} weight="bold" aria-hidden /> Eligible
                      </Pill>
                    </div>

                    <div className="topup__earn">
                      <p className="text-xs muted">A similar facility would pay you about</p>
                      <p className="topup__figure">{aed(estimate)}</p>
                    </div>

                    <div>
                      <div className="between text-xs" style={{ marginBottom: 5 }}>
                        <span className="secondary">{c.repaidPct}% repaid on {aed(c.totalDisbursed)}</span>
                        <span className="muted">no missed payments</span>
                      </div>
                      <Progress value={c.repaidPct} tone="success" label={`${c.company} repayment progress`} />
                    </div>

                    <div className="row-tight">
                      <Button size="sm" icon={<TrendUp size={ICON_PILL} weight="bold" aria-hidden />}>
                        Request top-up
                      </Button>
                      <Button size="sm" variant="secondary" icon={<WhatsappLogo size={ICON_PILL} weight={ICON_WEIGHT} aria-hidden />}>
                        Message
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ---------- Need a hand? ---------- */}
        <section className="card card--xl dash__wide" aria-labelledby="help">
          <div className="between wrap" style={{ alignItems: 'center', gap: 'var(--sp-5)' }}>
            <div className="row">
              <span className="avatar avatar--lg" aria-hidden>{broker.partnerManager.initials}</span>
              <div>
                <h2 id="help">Need a hand?</h2>
                <p className="secondary text-sm" style={{ marginTop: 3 }}>
                  {broker.partnerManager.name} usually replies in under 2 hours.
                </p>
              </div>
            </div>
            <div className="row-tight wrap">
              <Button size="sm" icon={<ChatCircleDots size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                Message {broker.partnerManager.name.split(' ')[0]}
              </Button>
              <Button size="sm" variant="secondary" icon={<BookOpen size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                Partner playbook
              </Button>
            </div>
          </div>
        </section>
      </div>

      <p className="text-xs muted">
        Illustrative sample data for this build. Your live partner desk updates these figures automatically.
      </p>
    </div>
  )
}
