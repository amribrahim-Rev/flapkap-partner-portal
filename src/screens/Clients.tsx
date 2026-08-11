import { Link } from 'react-router-dom'
import { ArrowsClockwise, UsersThree, CaretRight, TrendUp } from '@phosphor-icons/react'
import { applications, clients } from '../lib/data'
import { aed, longDate, plural } from '../lib/format'
import {
  Button, Donut, EmptyState, ICON_EMPTY, ICON_INLINE, ICON_PILL, ICON_WEIGHT, PageHead, Pill, Progress,
} from '../components/ui'

/**
 * Milestones on LIFETIME disbursal.
 *
 * The quarterly target card can be missed; this number never goes down, which
 * is what makes it the right place for milestone mechanics. Same anatomy as the
 * target card — figure, bar, ring, one sentence — because that pattern already
 * works and reusing it costs nothing.
 */
const MILESTONES = [1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000]

/** Link a funded client back to the case that funded them, where one exists. */
function caseFor(company: string) {
  return applications.find((a) => a.company === company && a.disbursedAmount)
}

export function Clients() {
  if (clients.length === 0) {
    return (
      <div className="page">
        <PageHead title="Clients" />
        <div className="card">
          <EmptyState
            icon={<UsersThree size={ICON_EMPTY} weight={ICON_WEIGHT} />}
            title="No funded clients yet"
            body="Once a case disburses the client moves here, with repayment progress and top-up eligibility."
          />
        </div>
      </div>
    )
  }

  const totalDisbursed = clients.reduce((s, c) => s + c.totalDisbursed, 0)
  const next = MILESTONES.find((m) => m > totalDisbursed) ?? totalDisbursed
  const prev = [...MILESTONES].reverse().find((m) => m <= totalDisbursed) ?? 0
  const readyNow = clients.filter((c) => c.topUpEligibleInDays === 0).length
  const maturingSoon = clients.filter((c) => c.maturesInDays <= 45).length

  return (
    <div className="page">
      <PageHead
        eyebrow={`${plural(clients.length, 'client')} funded`}
        title="Clients"
        meta="Repeat business is the cheapest commission you can earn."
      />

      {/* Lifetime disbursal, given the weight it deserves. It was a 14px
          subtitle; AED 2.95M placed through you is the whole story of the page. */}
      <section className="card card--xl" aria-labelledby="lifetime">
        <div className="between wrap" style={{ alignItems: 'center', gap: 'var(--sp-6)' }}>
          <div className="grow" style={{ minWidth: 210 }}>
            <h2 id="lifetime" className="wallet__label">Disbursed through you</h2>
            <p className="wallet__balance">{aed(totalDisbursed)}</p>
            <p className="secondary text-sm">of your {aed(next, { compact: true })} milestone</p>

            <div className="bar" style={{ margin: 'var(--sp-5) 0 var(--sp-3)' }}>
              <i style={{ width: `${Math.max(2, ((totalDisbursed - prev) / Math.max(1, next - prev)) * 100)}%` }} />
            </div>

            <p className="secondary text-sm">
              <strong style={{ color: 'var(--text)' }}>{aed(next - totalDisbursed, { compact: true })}</strong> to go
              {readyNow > 0 && <> · <strong style={{ color: 'var(--success-ink)' }}>{plural(readyNow, 'client')} ready for a top-up</strong></>}
              {maturingSoon > 0 && <> · {plural(maturingSoon, 'facility', 'facilities')} maturing soon</>}
            </p>
          </div>

          <Donut
            value={totalDisbursed - prev}
            max={next - prev}
            caption={`to ${aed(next, { compact: true })}`}
            label={`Lifetime disbursal against the ${aed(next)} milestone`}
          />
        </div>
      </section>

      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Funded clients, repayment progress and top-up eligibility.</caption>
          <thead>
            <tr>
              <th scope="col">Client</th>
              <th scope="col" className="right">Disbursed</th>
              <th scope="col">Repaid</th>
              <th scope="col">Matures</th>
              <th scope="col">Top-up</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const linked = caseFor(c.company)
              return (
                <tr key={c.id}>
                  <td data-primary="true" data-label="">
                    {linked ? (
                      <Link to={`/cases/${linked.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        <h3 style={{ fontSize: 'var(--text-h4)' }}>{c.company}</h3>
                        <p className="secondary text-sm">{c.industry} · last active {longDate(c.lastActivity)}</p>
                      </Link>
                    ) : (
                      <>
                        <h3 style={{ fontSize: 'var(--text-h4)' }}>{c.company}</h3>
                        <p className="secondary text-sm">{c.industry} · last active {longDate(c.lastActivity)}</p>
                      </>
                    )}
                  </td>
                  <td data-label="Disbursed" className="num">{aed(c.totalDisbursed)}</td>
                  <td data-label="Repaid" style={{ minWidth: 130 }}>
                    <div className="row-tight" style={{ gap: 'var(--sp-3)' }}>
                      <span className="grow"><Progress value={c.repaidPct} tone="success" label={`${c.company} repayment progress`} /></span>
                      <span className="tnum text-sm semibold">{c.repaidPct}%</span>
                    </div>
                  </td>
                  <td data-label="Matures">
                    {c.maturesInDays <= 45
                      ? <Pill tone="pill--you">{plural(c.maturesInDays, 'day')}</Pill>
                      : <span className="secondary text-sm">{plural(c.maturesInDays, 'day')}</span>}
                  </td>
                  <td data-label="Top-up">
                    {c.topUpEligibleInDays === 0
                      ? <Pill tone="pill--done">Eligible now</Pill>
                      : <span className="muted text-sm">in {plural(c.topUpEligibleInDays, 'day')}</span>}
                  </td>
                  <td data-label="">
                    <div className="row-tight" style={{ justifyContent: 'flex-end' }}>
                      {c.topUpEligibleInDays === 0 ? (
                        <Button size="sm" icon={<TrendUp size={ICON_PILL} weight="bold" aria-hidden />}>Request top-up</Button>
                      ) : c.maturesInDays <= 45 ? (
                        <Button size="sm" variant="secondary" icon={<ArrowsClockwise size={ICON_PILL} weight="bold" aria-hidden />}>
                          Renew
                        </Button>
                      ) : null}
                      {linked && (
                        <Link to={`/cases/${linked.id}`} className="btn-icon" aria-label={`Open ${c.company}`}>
                          <CaretRight size={ICON_INLINE} weight="bold" aria-hidden />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs muted">
        We alert you 30 days before any facility matures. A renewal pays the same commission as a new case, and
        counts toward your quarterly bonus.
      </p>
    </div>
  )
}

