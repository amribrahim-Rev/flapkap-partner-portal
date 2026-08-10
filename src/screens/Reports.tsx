import { DownloadSimple } from '@phosphor-icons/react'
import { applications, broker, clients } from '../lib/data'
import { tiers } from '../lib/domain'
import { aed, pct, plural } from '../lib/format'
import { Button, Callout, ICON_WEIGHT, PageHead, SectionHead, StatStrip } from '../components/ui'

const tier = tiers[broker.tier]

const submitted = applications.length
const funded = applications.filter((a) => a.disbursedAmount).length
const declined = applications.filter((a) => a.stage === 'declined' || a.stage === 'aip_declined').length
const conversion = funded / submitted

/** Simple funnel counts. Deliberately not a chart library — the numbers are
    few enough that a bar built from a div reads faster than a plotted chart. */
const funnel = [
  { label: 'Cases submitted', n: submitted },
  { label: 'Passed AIP', n: applications.filter((a) => !['lead', 'aip_review', 'aip_declined'].includes(a.stage)).length },
  { label: 'Offer issued', n: applications.filter((a) => a.offer).length },
  { label: 'Funded', n: funded },
]
const top = Math.max(...funnel.map((f) => f.n))

export function Reports() {
  return (
    <div className="page">
      <PageHead
        title="Reports"
        meta="Your own numbers, for the quarter to date."
        actions={
          <Button variant="secondary" icon={<DownloadSimple size={17} weight={ICON_WEIGHT} aria-hidden />}>
            Export CSV
          </Button>
        }
      />

      <section className="card">
        <StatStrip
          stats={[
            { label: 'Cases submitted', value: String(submitted) },
            { label: 'Funded', value: String(funded), tone: 'success' },
            { label: 'Conversion', value: pct(conversion, 0) },
            { label: 'Declined', value: String(declined), tone: 'muted' },
          ]}
        />
      </section>

      <section className="card">
        <SectionHead title="Your funnel" />
        <ul style={{ display: 'grid', gap: 'var(--sp-4)' }}>
          {funnel.map((f) => (
            <li key={f.label}>
              <div className="between text-sm" style={{ marginBottom: 6 }}>
                <span>{f.label}</span>
                <span className="tnum semibold">{f.n}</span>
              </div>
              <div className="progress" role="img" aria-label={`${f.label}: ${f.n} of ${top}`}>
                <span className="progress__fill" style={{ width: `${(f.n / top) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <div className="region">
          <p className="secondary text-sm">
            {pct(conversion, 0)} of what you submit reaches disbursal. The single biggest lever is the
            pre-eligibility check before you register a case — cases that clear it convert at roughly twice the rate.
          </p>
        </div>
      </section>

      <section className="card">
        <SectionHead title="Against your target" />
        <StatStrip
          stats={[
            { label: `${broker.quarter.label} disbursed`, value: aed(broker.quarter.disbursed, { compact: true }) },
            { label: 'Quarterly target', value: aed(tier.quarterlyTarget, { compact: true }), tone: 'muted' },
            { label: 'Clients funded', value: String(clients.length) },
            { label: 'Avg deal size', value: aed(applications.filter((a) => a.disbursedAmount).reduce((s, a) => s + a.disbursedAmount!, 0) / Math.max(1, funded), { compact: true }) },
          ]}
        />
      </section>

      <Callout tone="info">
        This view is intentionally thin for now. Tell your partner manager which cut you actually use —
        by month, by industry, by product — and it gets built rather than guessed at.
      </Callout>

      <p className="text-xs muted">
        Based on {plural(submitted, 'case')} on your book. Figures are illustrative sample data.
      </p>
    </div>
  )
}
