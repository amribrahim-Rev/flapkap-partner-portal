import { Link } from 'react-router-dom'
import { DownloadSimple, Medal, CaretRight, Check } from '@phosphor-icons/react'
import { applications, broker, commissionPaid, dealsPaid, payable, expected, paidCases } from '../lib/data'
import { partA, tiers, FEE_FLOOR } from '../lib/domain'
import { aed, longDate, num, pct, plural } from '../lib/format'
import {
  Button, Callout, ICON_INLINE, ICON_PILL, ICON_ROW, ICON_WEIGHT, PageHead, Pill, SectionHead,
} from '../components/ui'

const tier = tiers[broker.tier]

const payableTotal = payable.reduce((s, a) => s + (a.commission ?? 0), 0)
const expectedTotal = expected.reduce((s, a) => s + (a.commission ?? 0), 0)

const deals = applications
  .filter((a) => a.disbursedAmount && a.offer)
  .sort((x, y) => (x.disbursedOn! < y.disbursedOn! ? 1 : -1))

const goldBonus = (disbursed: number) => disbursed * tier.bonusRate
const goldTotal = deals.reduce((s, a) => s + goldBonus(a.disbursedAmount!), 0)

/**
 * Milestones on LIFETIME earnings.
 *
 * Lifetime is the only honest number to gamify, because it can only go up — a
 * quarterly target can be missed, a lifetime total cannot. The mechanic rewards
 * nothing; it states a true figure in a way that reads as progress.
 *
 * Deliberately absent: points, badges, streaks, levels, celebration effects.
 * This is the broker's income. Dressing income up as a game reads as
 * trivialising it, and to a partner who just had a deal declined it would read
 * as worse than that. The register is a good banking app. The mechanic is
 * anticipation, not reward.
 */
const MILESTONES = [50_000, 100_000, 250_000, 500_000, 1_000_000]
const nextMilestone = MILESTONES.find((m) => m > commissionPaid) ?? commissionPaid
const prevMilestone = [...MILESTONES].reverse().find((m) => m <= commissionPaid) ?? 0
const milestoneShare = (commissionPaid - prevMilestone) / Math.max(1, nextMilestone - prevMilestone)

/** Earnings by month of disbursal, last six. */
const monthly = (() => {
  const map = new Map<string, number>()
  paidCases.forEach((c) => {
    if (!c.disbursedOn) return
    const k = c.disbursedOn.slice(0, 7)
    map.set(k, (map.get(k) ?? 0) + (c.commission ?? 0))
  })
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([k, v]) => ({ key: k, label: new Date(`${k}-01`).toLocaleDateString('en-GB', { month: 'short' }), value: v }))
})()
const peak = Math.max(...monthly.map((m) => m.value), 1)

const daysTo = (iso: string) => Math.round((new Date(iso).getTime() - new Date('2026-08-11').getTime()) / 86_400_000)

export function Commissions() {
  return (
    <div className="page">
      <PageHead
        eyebrow="Money earned"
        title="Your wallet"
        meta="We raise the invoice and pay automatically — you never bill us."
        actions={
          <Button variant="secondary" icon={<DownloadSimple size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
            Download statement
          </Button>
        }
      />

      {/* 1. Balance. One object, not three stats: earned, arriving and expected
             are one story about the same money. */}
      <section className="card card--xl wallet" aria-labelledby="balance">
        <div className="wallet__main">
          <h2 id="balance" className="wallet__label">Earned with FlapKap</h2>
          <p className="wallet__balance">{aed(commissionPaid)}</p>
          <p className="secondary text-sm">{plural(dealsPaid, 'deal')} paid out</p>

          <div className="wallet__milestone">
            <div className="bar">
              <i style={{ width: `${Math.max(2, milestoneShare * 100)}%` }} />
            </div>
            <p className="secondary text-sm" style={{ marginTop: 'var(--sp-3)' }}>
              <strong style={{ color: 'var(--text)' }}>{aed(nextMilestone - commissionPaid)}</strong>{' '}
              to your {aed(nextMilestone)} milestone
            </p>
          </div>
        </div>

        <dl className="wallet__side">
          <div>
            <dt className="secondary text-sm">On its way</dt>
            <dd className="wallet__figure" style={{ color: 'var(--primary-text)' }}>{aed(payableTotal)}</dd>
            <p className="text-xs muted">{plural(payable.length, 'deal')} funded, awaiting first repayment</p>
          </div>
          <div>
            <dt className="secondary text-sm">In live offers</dt>
            <dd className="wallet__figure muted">{aed(expectedTotal)}</dd>
            <p className="text-xs muted">Not earned until the deal funds</p>
          </div>
        </dl>
      </section>

      {/* 2. Arrivals. Never a bare "pending" — the mechanism and a date, always. */}
      {payable.length > 0 && (
        <section className="card" aria-labelledby="arriving">
          <SectionHead
            id="arriving"
            title="Arriving"
            action={<span className="secondary text-sm">Released after your client's first repayment</span>}
          />
          <div className="list">
            {payable.map((a) => {
              const days = a.commissionDueOn ? daysTo(a.commissionDueOn) : null
              return (
                <Link key={a.id} to={`/cases/${a.id}`} className="item item--link item--inset">
                  <div className="grow">
                    <h3 style={{ fontSize: 'var(--text-h4)' }}>{a.company}</h3>
                    <ol className="steps" aria-label="Payout progress">
                      <li data-state="done">Funded {longDate(a.disbursedOn!)}</li>
                      <li data-state="now">First repayment</li>
                      <li>Paid to you</li>
                    </ol>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="wallet__row-figure">{aed(a.commission ?? 0)}</p>
                    {days !== null && (
                      <p className="text-xs" style={{ color: 'var(--primary-text)', fontWeight: 600 }}>
                        {days <= 0 ? 'Due now' : `arrives in ${plural(days, 'day')}`}
                      </p>
                    )}
                  </div>
                  <CaretRight size={ICON_INLINE} weight="bold" aria-hidden />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 3. The bonus pot. The one genuinely game-like mechanic that fits here,
             because both the money and the threshold are real. */}
      <section className="card" aria-labelledby="bonus">
        <div className="between wrap" style={{ alignItems: 'flex-start', gap: 'var(--sp-6)' }}>
          <div className="grow" style={{ minWidth: 220 }}>
            <h2 id="bonus" className="row-tight" style={{ gap: 8 }}>
              <Medal size={ICON_ROW} weight="fill" color="var(--gold-ink)" aria-hidden />
              {tier.label} bonus pot
            </h2>
            <p className="secondary text-sm" style={{ marginTop: 6 }}>
              An extra {(tier.bonusRate * 100).toFixed(2)}% on everything you disburse this quarter, released once
              you reach {aed(tier.quarterlyTarget, { compact: true })}.
            </p>
            <div className="bar" style={{ margin: 'var(--sp-5) 0 var(--sp-3)' }}>
              <i style={{ width: `${(broker.quarter.disbursed / tier.quarterlyTarget) * 100}%` }} />
            </div>
            <p className="secondary text-sm">
              {aed(broker.quarter.disbursed, { compact: true })} of {aed(tier.quarterlyTarget, { compact: true })} disbursed ·{' '}
              <strong style={{ color: 'var(--text)' }}>
                {aed(tier.quarterlyTarget - broker.quarter.disbursed, { compact: true })} to unlock
              </strong>
            </p>
          </div>
          <div className="wallet__pot">
            <p className="text-xs muted">Accumulated</p>
            <p className="wallet__figure" style={{ color: 'var(--gold-ink)' }}>{aed(goldTotal)}</p>
          </div>
        </div>
      </section>

      {/* 4. Earnings over time. The money page had no chart and Reports had all
             nineteen; this is the one that belongs here. */}
      {monthly.length > 1 && (
        <section className="card" aria-labelledby="trend">
          <SectionHead id="trend" title="Last 6 months" action={<Link to="/reports" className="text-sm semibold">Full reports</Link>} />
          <div className="chart" style={{ height: 150 }}>
            {monthly.map((m) => (
              <div className="chart__col" key={m.key} title={`${m.label}: ${aed(m.value)}`}>
                <span className="chart__val">{Math.round(m.value / 1000)}k</span>
                <span className="chart__bar" style={{ height: `${Math.max(4, (m.value / peak) * 100)}%` }} />
                <span className="chart__x">{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. The ledger, now with clickable rows. Reading a figure and having
             nowhere to click was the worst dead end in the audit. */}
      <section>
        <SectionHead
          title="Deal by deal"
          action={
            <span className="text-sm">
              <span className="secondary">Bonus earned </span>
              <strong className="tnum" style={{ color: 'var(--gold-ink)' }}>{aed(goldTotal)}</strong>
            </span>
          }
        />
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">
              Every disbursed deal, its arrangement fee, your commission and the bonus it earns.
            </caption>
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Disbursed</th>
                <th scope="col" className="right">Amount</th>
                <th scope="col" className="right">Fee</th>
                <th scope="col" className="right">Your commission</th>
                <th scope="col" className="right" style={{ color: 'var(--gold-ink)' }}>{tier.label} bonus</th>
                <th scope="col" className="right">Status</th>
                <th scope="col"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {deals.map((a) => (
                <tr key={a.id}>
                  <td data-primary="true" data-label="">
                    <Link to={`/cases/${a.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <h3 style={{ fontSize: 'var(--text-h4)' }}>{a.company}</h3>
                      <p className="secondary text-sm">{a.industry}</p>
                    </Link>
                  </td>
                  <td data-label="Disbursed" className="secondary text-sm">{longDate(a.disbursedOn!)}</td>
                  <td data-label="Amount" className="num">{num(a.disbursedAmount!)}</td>
                  <td data-label="Fee" className="num">{pct(a.offer!.feeRate)}</td>
                  <td data-label="Your commission" className="num">{num(a.commission!)}</td>
                  <td data-label={`${tier.label} bonus`} className="num" style={{ color: 'var(--gold-ink)' }}>
                    {num(goldBonus(a.disbursedAmount!))}
                  </td>
                  <td data-label="Status" className="right">
                    {a.commissionStatus === 'paid'
                      ? <Pill tone="pill--done"><Check size={ICON_PILL} weight="bold" aria-hidden /> Paid {longDate(a.commissionDueOn!)}</Pill>
                      : <Pill tone="pill--client">Due {longDate(a.commissionDueOn!)}</Pill>}
                  </td>
                  <td data-label="">
                    <Link to={`/cases/${a.id}`} className="btn-icon" aria-label={`Open ${a.company}`}>
                      <CaretRight size={ICON_INLINE} weight="bold" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs muted" style={{ marginTop: 'var(--sp-3)' }}>
          Amounts in AED. Commission is 75% of the arrangement fee. The interest your client pays goes entirely to
          FlapKap and never affects either figure.
        </p>
      </section>

      <Callout tone="warning">
        <strong>Floor rate.</strong> At exactly {pct(FEE_FLOOR, 1)} the schedule pays 1.00% of the disbursal rather
        than 75% of the fee — {aed(partA(1_100_000, 0.015))} instead of {aed(1_100_000 * 0.015 * 0.75)} on Bright
        Star Medical. Flagged for review in the commission policy.
      </Callout>
    </div>
  )
}
