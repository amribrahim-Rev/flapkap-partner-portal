import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FilePlus, CaretRight, Rows, MagnifyingGlass, CheckCircle, X } from '@phosphor-icons/react'
import { applications } from '../lib/data'
import { aging, ownerLabel, ownerPill, stageGroups, stageLabel } from '../lib/domain'
import { num, pct, plural } from '../lib/format'
import { Button, Clock, EmptyState, Field, ICON_WEIGHT, PageHead, Pill } from '../components/ui'

/** Filters mirror the dashboard funnel exactly — one definition, two views. */
const filters = [{ key: 'all', label: 'All' }, ...stageGroups.map((g) => ({ key: g.key, label: g.label }))]

export function Applications() {
  const [params, setParams] = useSearchParams()
  const justCreated = params.get('new') === '1'
  const [filter, setFilter] = useState<string>(params.get('group') ?? 'all')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    let list = applications
    if (filter !== 'all') {
      const g = stageGroups.find((x) => x.key === filter)
      if (g) list = list.filter((a) => g.stages.includes(a.stage))
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      list = list.filter((a) => a.company.toLowerCase().includes(needle) || a.ref.toLowerCase().includes(needle))
    }
    return list
  }, [filter, q])

  const counts = useMemo(() => Object.fromEntries(
    filters.map((f) => {
      if (f.key === 'all') return [f.key, applications.length]
      const g = stageGroups.find((x) => x.key === f.key)
      return [f.key, g ? applications.filter((a) => g.stages.includes(a.stage)).length : 0]
    }),
  ) as Record<string, number>, [])

  return (
    <div className="page">
      <PageHead
        title="My cases"
        meta={`${applications.length} total`}
        actions={
          <Button icon={<FilePlus size={18} weight="bold" aria-hidden />} onClick={() => (window.location.hash = '#/new-case')}>
            New case
          </Button>
        }
      />

      {justCreated && (
        <div className="item item--success">
          <CheckCircle size={20} weight="fill" color="var(--success)" aria-hidden />
          <p className="grow text-sm">Case registered and locked to you for 30 days.</p>
          <button className="btn-icon btn-icon--plain" aria-label="Dismiss" onClick={() => setParams({})}>
            <X size={16} weight="bold" aria-hidden />
          </button>
        </div>
      )}

      <div className="between wrap" style={{ gap: 'var(--sp-4)', alignItems: 'flex-end' }}>
        <div className="filters" role="group" aria-label="Filter cases by stage">
          {filters.map((f) => (
            <button key={f.key} className="filter" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label} <span className="filter__n">{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div style={{ minWidth: 220 }}>
          <Field label="Search" id="case-search" placeholder="Company or reference" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={q ? <MagnifyingGlass size={28} weight={ICON_WEIGHT} /> : <Rows size={28} weight={ICON_WEIGHT} />}
            title={q ? `Nothing matches “${q}”` : 'No cases at this stage'}
            body={q ? 'Try the company name as it appears on the trade licence.' : 'Change the filter, or register a new case.'}
            action={q
              ? <Button variant="secondary" onClick={() => setQ('')}>Clear search</Button>
              : <Button onClick={() => setFilter('all')}>Show all cases</Button>}
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Cases, showing whose move each is waiting on, its stage and your commission.</caption>
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Whose move</th>
                <th scope="col">Stage</th>
                <th scope="col">Waiting</th>
                <th scope="col" className="right">Amount</th>
                <th scope="col" className="right">Fee</th>
                <th scope="col" className="right">Your commission</th>
                <th scope="col"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const age = aging(a.daysInStage, a.stageSla)
                const amount = a.disbursedAmount ?? a.offer?.amount ?? a.requestedAmount
                const settled = a.owner === 'done' || a.owner === 'closed'
                return (
                  <tr key={a.id}>
                    <td data-primary="true" data-label="">
                      <Link to={`/cases/${a.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        <h3 style={{ fontSize: 'var(--text-h4)' }}>{a.company}</h3>
                        <p className="secondary text-sm">{a.industry}</p>
                      </Link>
                    </td>
                    <td data-label="Whose move"><Pill tone={ownerPill[a.owner]}>{ownerLabel[a.owner]}</Pill></td>
                    <td data-label="Stage" className="text-sm">{stageLabel[a.stage]}</td>
                    <td data-label="Waiting">
                      {settled ? <span className="muted text-sm">—</span> : (
                        <Clock tone={age === 'late' ? 'urgent' : age === 'due' ? 'soon' : 'calm'}>
                          {plural(a.daysInStage, 'day')}
                        </Clock>
                      )}
                    </td>
                    <td data-label="Amount" className="num">{amount ? num(amount) : <span className="muted">—</span>}</td>
                    <td data-label="Fee" className="num">{a.offer ? pct(a.offer.feeRate) : <span className="muted">—</span>}</td>
                    <td data-label="Your commission" className="num">
                      {a.commission
                        ? <span style={{ color: a.commissionStatus === 'paid' ? 'var(--success)' : 'var(--text-secondary)' }}>{num(a.commission)}</span>
                        : <span className="muted">—</span>}
                    </td>
                    <td data-label="">
                      <Link to={`/cases/${a.id}`} className="btn-icon" aria-label={`Open ${a.company}`}>
                        <CaretRight size={16} weight="bold" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
