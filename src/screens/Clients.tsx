import { ArrowsClockwise, UsersThree } from '@phosphor-icons/react'
import { clients } from '../lib/data'
import { aed, longDate, plural } from '../lib/format'
import { Button, EmptyState, ICON_WEIGHT, PageHead, Pill, Progress } from '../components/ui'

export function Clients() {
  if (clients.length === 0) {
    return (
      <div className="page">
        <PageHead title="My clients" />
        <div className="card">
          <EmptyState
            icon={<UsersThree size={28} weight={ICON_WEIGHT} />}
            title="No funded clients yet"
            body="Once a case disburses the client moves here, with repayment progress and top-up eligibility."
          />
        </div>
      </div>
    )
  }

  const totalDisbursed = clients.reduce((s, c) => s + c.totalDisbursed, 0)

  return (
    <div className="page">
      <PageHead
        title="My clients"
        meta={`${plural(clients.length, 'client')} · ${aed(totalDisbursed)} disbursed through you`}
      />

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
            {clients.map((c) => (
              <tr key={c.id}>
                <td data-primary="true" data-label="">
                  <h3 style={{ fontSize: 'var(--text-h4)' }}>{c.company}</h3>
                  <p className="secondary text-sm">{c.industry} · last active {longDate(c.lastActivity)}</p>
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
                  {c.topUpEligibleInDays === 0 ? (
                    <Button size="sm">Request top-up</Button>
                  ) : c.maturesInDays <= 45 ? (
                    <Button size="sm" variant="secondary" icon={<ArrowsClockwise size={14} weight="bold" aria-hidden />}>
                      Renew
                    </Button>
                  ) : (
                    <span className="muted text-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs muted">
        We alert you 30 days before any facility matures. A renewal pays the same commission as a new case.
      </p>
    </div>
  )
}
