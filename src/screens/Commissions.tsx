import { DownloadSimple } from '@phosphor-icons/react'
import { applications, broker, commissionPaid, dealsPaid, payable, expected } from '../lib/data'
import { partA, tiers, FEE_FLOOR } from '../lib/domain'
import { aed, longDate, num, pct, plural } from '../lib/format'
import { Button, Callout, ICON_WEIGHT, PageHead, Pill, SectionHead, StatStrip } from '../components/ui'

const tier = tiers[broker.tier]

const payableTotal = payable.reduce((s, a) => s + (a.commission ?? 0), 0)
const expectedTotal = expected.reduce((s, a) => s + (a.commission ?? 0), 0)

const deals = applications
  .filter((a) => a.disbursedAmount && a.offer)
  .sort((x, y) => (x.disbursedOn! < y.disbursedOn! ? 1 : -1))

/** Part B share attributable to a single deal, once the quarter is secured. */
const goldBonus = (disbursed: number) => disbursed * tier.bonusRate
const goldTotal = deals.reduce((s, a) => s + goldBonus(a.disbursedAmount!), 0)

export function Commissions() {
  return (
    <div className="page">
      <PageHead
        title="Commissions"
        meta="We raise the invoice and pay automatically — you never bill us."
        actions={
          <Button variant="secondary" icon={<DownloadSimple size={17} weight={ICON_WEIGHT} aria-hidden />}>
            Download statement
          </Button>
        }
      />

      <section className="card" aria-label="Commission summary">
        <StatStrip
          stats={[
            { label: 'Paid', value: aed(commissionPaid), note: `${plural(dealsPaid, 'deal')} this year` },
            { label: 'Payable', value: aed(payableTotal), tone: 'primary', note: "Awaiting the client's first repayment" },
            { label: 'In live offers', value: aed(expectedTotal), tone: 'muted', note: 'Not earned until funded' },
          ]}
        />
      </section>

      <section>
        <SectionHead
          title="Deal by deal"
          action={
            <span className="text-sm">
              <span className="secondary">Gold bonus to date </span>
              <strong className="tnum" style={{ color: 'var(--gold-ink)' }}>{aed(goldTotal)}</strong>
            </span>
          }
        />
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">
              Every disbursed deal, its arrangement fee, your commission and the Gold quarterly bonus it earns.
            </caption>
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Disbursed</th>
                <th scope="col" className="right">Amount</th>
                <th scope="col" className="right">Fee</th>
                <th scope="col" className="right">Your commission</th>
                <th scope="col" className="right" style={{ color: 'var(--gold-ink)' }}>Gold bonus</th>
                <th scope="col" className="right">Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((a) => (
                <tr key={a.id}>
                  <td data-primary="true" data-label="">
                    <h3 style={{ fontSize: 'var(--text-h4)' }}>{a.company}</h3>
                  </td>
                  <td data-label="Disbursed" className="secondary text-sm">{longDate(a.disbursedOn!)}</td>
                  <td data-label="Amount" className="num">{num(a.disbursedAmount!)}</td>
                  <td data-label="Fee" className="num">{pct(a.offer!.feeRate)}</td>
                  <td data-label="Your commission" className="num">{num(a.commission!)}</td>
                  <td data-label="Gold bonus" className="num" style={{ color: 'var(--gold-ink)' }}>
                    {num(goldBonus(a.disbursedAmount!))}
                  </td>
                  <td data-label="Status" className="right">
                    {a.commissionStatus === 'paid'
                      ? <Pill tone="pill--done">Paid {longDate(a.commissionDueOn!)}</Pill>
                      : <Pill tone="pill--client">Due {longDate(a.commissionDueOn!)}</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs muted" style={{ marginTop: 'var(--sp-3)' }}>
          Amounts in AED. Commission is {(0.75 * 100).toFixed(0)}% of the arrangement fee. The Gold bonus adds{' '}
          {(tier.bonusRate * 100).toFixed(2)}% of everything disbursed in the quarter, once the target is met.
          Interest the client pays goes entirely to FlapKap and never affects either figure.
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
