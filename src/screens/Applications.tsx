import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FilePlus, CaretRight, Rows, MagnifyingGlass, CheckCircle, X, CaretDown } from '@phosphor-icons/react'
import { applications } from '../lib/data'
import { aging, groupOf, ownerLabel, stageGroups } from '../lib/domain'
import { longDate, num, plural } from '../lib/format'
import {
  Button, EmptyState, ICON_EMPTY, ICON_INLINE, ICON_ROW, ICON_WEIGHT,
  PageHead, Pill, SearchBar,
} from '../components/ui'

/** Stage pill tone per bucket — one colour vocabulary shared with the funnel. */
const bucketPill: Record<string, string> = {
  submitted: 'pill--flapkap',
  docs: 'pill--you',
  risk: 'pill--flapkap',
  conditional: 'pill--client',
  final: 'pill--client',
  funded: 'pill--done',
  rejected: 'pill--urgent',
}

const TODAY = new Date('2026-08-11').getTime()
const daysLeft = (iso: string) => Math.round((new Date(iso).getTime() - TODAY) / 86_400_000)

export function Applications() {
  const [params, setParams] = useSearchParams()
  const justCreated = params.get('new') === '1'
  const [stage, setStage] = useState<string>(params.get('group') ?? 'all')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    let list = applications
    if (stage !== 'all') {
      const g = stageGroups.find((x) => x.key === stage)
      if (g) list = list.filter((a) => g.stages.includes(a.stage))
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      /* The three things a broker actually remembers: the company, the person
         they deal with, and the reference on the email. */
      list = list.filter((a) =>
        a.company.toLowerCase().includes(needle)
        || a.ref.toLowerCase().includes(needle)
        || a.contactName.toLowerCase().includes(needle))
    }
    return list
  }, [stage, q])

  const dirty = q.trim() !== '' || stage !== 'all'

  return (
    <div className="page">
      <PageHead
        eyebrow={`${plural(applications.length, 'case')} in your desk`}
        title="Cases"
        meta="The fastest way to answer “where's my money?”"
        actions={
          <Button icon={<FilePlus size={ICON_INLINE} weight="bold" aria-hidden />} onClick={() => { window.location.hash = '#/new-case' }}>
            New case
          </Button>
        }
      />

      {justCreated && (
        <div className="item item--success">
          <CheckCircle size={ICON_ROW} weight="fill" color="var(--success)" aria-hidden />
          <p className="grow text-sm">Case registered and locked to you for 30 days.</p>
          <button className="btn-icon btn-icon--plain" aria-label="Dismiss" onClick={() => setParams({})}>
            <X size={ICON_INLINE} weight="bold" aria-hidden />
          </button>
        </div>
      )}

      <SearchBar
        value={q}
        onChange={setQ}
        placeholder="Search company, client or case ID"
        onReset={() => { setQ(''); setStage('all') }}
        resettable={dirty}
      >
        <div className="select-wrap" style={{ flex: '0 0 auto' }}>
          <label className="sr-only" htmlFor="stage-filter">Filter by stage</label>
          <select id="stage-filter" className="select" value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="all">All stages</option>
            {stageGroups.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label} ({applications.filter((a) => g.stages.includes(a.stage)).length})
              </option>
            ))}
          </select>
          <CaretDown size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />
        </div>
      </SearchBar>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={q ? <MagnifyingGlass size={ICON_EMPTY} weight={ICON_WEIGHT} /> : <Rows size={ICON_EMPTY} weight={ICON_WEIGHT} />}
            title={q ? `Nothing matches “${q}”` : 'No cases at this stage'}
            body={q
              ? 'Try the company name as it appears on the trade licence, the contact, or the FK reference.'
              : 'Change the stage filter, or register a new case.'}
            action={<Button variant="secondary" onClick={() => { setQ(''); setStage('all') }}>Reset filters</Button>}
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">
              Cases, showing the stage, whose move it is, how long protection lasts and when it was created.
            </caption>
            <thead>
              <tr>
                <th scope="col">Case</th>
                <th scope="col">Stage</th>
                <th scope="col" className="right">Amount</th>
                <th scope="col">Next move</th>
                <th scope="col">Protection</th>
                <th scope="col">Created</th>
                <th scope="col"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const bucket = groupOf(a.stage)
                const age = aging(a.daysInStage, a.stageSla)
                const amount = a.disbursedAmount ?? a.offer?.amount ?? a.requestedAmount
                const settled = a.owner === 'done' || a.owner === 'closed'
                const protection = a.protectedUntil ? daysLeft(a.protectedUntil) : null
                return (
                  <tr key={a.id}>
                    <td data-primary="true" data-label="">
                      <Link to={`/cases/${a.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        <h3 style={{ fontSize: 'var(--text-h4)' }}>{a.company}</h3>
                        <p className="secondary text-sm">{a.contactName} · {a.ref}</p>
                      </Link>
                    </td>
                    <td data-label="Stage">
                      <Pill tone={bucketPill[bucket?.key ?? 'submitted']} noDot>{bucket?.label ?? '—'}</Pill>
                    </td>
                    <td data-label="Amount" className="num">
                      {amount ? `AED ${num(amount)}` : <span className="muted">—</span>}
                    </td>
                    {/* Whose move and how long in one cell: two facts a broker
                        scans for that only mean something together. */}
                    <td data-label="Next move" className="text-sm nowrap">
                      {settled ? (
                        <span className="secondary">Complete</span>
                      ) : (
                        <span style={{
                          color: a.owner === 'you' ? 'var(--warning)'
                            : age === 'late' ? 'var(--danger-text)'
                            : 'var(--text-secondary)',
                          fontWeight: 600,
                        }}>
                          {ownerLabel[a.owner].replace("'s move", '').replace(' move', '')} · {a.daysInStage}d
                        </span>
                      )}
                    </td>
                    <td data-label="Protection" className="text-sm nowrap">
                      {protection === null ? (
                        <span className="muted">—</span>
                      ) : (
                        <span style={{ color: protection <= 10 ? 'var(--warning)' : 'var(--success-ink)', fontWeight: 600 }}>
                          {protection}d left
                        </span>
                      )}
                    </td>
                    <td data-label="Created" className="secondary text-sm nowrap">{longDate(a.submittedOn)}</td>
                    <td data-label="">
                      <Link to={`/cases/${a.id}`} className="btn-icon" aria-label={`Open ${a.company}`}>
                        <CaretRight size={ICON_INLINE} weight="bold" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs muted">
        Showing {plural(rows.length, 'case')}{dirty ? ' matching your filters' : ''}. Amounts in AED. Protection is
        the window in which no other partner can submit the same trade licence.
      </p>
    </div>
  )
}
