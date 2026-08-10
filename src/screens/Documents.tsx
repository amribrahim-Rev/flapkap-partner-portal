import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, CaretDown, CaretRight, ChatCircleDots, Files, CalendarX, ArrowClockwise, Paperclip,
} from '@phosphor-icons/react'
import { liveApplications } from '../lib/data'
import { docStatusLabel, docStatusPill } from '../lib/domain'
import { countdown, plural } from '../lib/format'
import { Clock, EmptyState, ICON_WEIGHT, PageHead, Pill } from '../components/ui'
import type { Application, DocumentItem, Query } from '../lib/types'

/**
 * One block per client, everything they owe nested inside it.
 *
 * The previous version listed each outstanding document and each query as its
 * own top-level row, so a client with three problems appeared three times and
 * the page read as noise. Grouping means the count in the heading is the work,
 * and the detail is one click away.
 */
interface Item {
  kind: 'query' | 'doc'
  query?: Query
  doc?: DocumentItem
}

interface Group {
  app: Application
  items: Item[]
  urgentHours?: number
}

const groups: Group[] = liveApplications
  .map((app) => {
    const items: Item[] = [
      ...app.queries.filter((q) => !q.resolved).map((q) => ({ kind: 'query' as const, query: q })),
      ...app.documents
        .filter((d) => d.status === 'rejected' || d.status === 'replacement_required' || (d.required && d.status === 'pending'))
        .map((d) => ({ kind: 'doc' as const, doc: d })),
    ]
    const hours = app.queries.filter((q) => !q.resolved).map((q) => q.dueInHours)
    return { app, items, urgentHours: hours.length ? Math.min(...hours) : undefined }
  })
  .filter((g) => g.items.length > 0)
  /* Soonest deadline first; then most outstanding. */
  .sort((a, b) => (a.urgentHours ?? 9e9) - (b.urgentHours ?? 9e9) || b.items.length - a.items.length)

const expiring = liveApplications.flatMap((app) =>
  app.documents
    .filter((d) => d.expiresInDays !== undefined && d.expiresInDays < 60)
    .map((d) => ({ app, doc: d })),
)

const totalItems = groups.reduce((s, g) => s + g.items.length, 0)

export function Documents() {
  const [open, setOpen] = useState<string | null>(groups[0]?.app.id ?? null)

  if (groups.length === 0) {
    return (
      <div className="page">
        <PageHead title="Documents & queries" />
        <div className="card">
          <EmptyState
            icon={<Check size={28} weight={ICON_WEIGHT} />}
            title="Everything is in"
            body="No document missing, no query open. We raise anything new here first, then by email."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHead
        title="Documents & queries"
        meta={`${plural(totalItems, 'item')} across ${plural(groups.length, 'client')}`}
      />

      <div className="list">
        {groups.map(({ app, items, urgentHours }) => {
          const isOpen = open === app.id
          const queries = items.filter((i) => i.kind === 'query').length
          const docs = items.filter((i) => i.kind === 'doc').length
          return (
            <div className="group" key={app.id}>
              <button
                className="group__head"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : app.id)}
              >
                <span className="grow">
                  <span className="semibold" style={{ display: 'block', fontSize: 'var(--text-h4)' }}>{app.company}</span>
                  <span className="secondary text-sm">
                    {[queries && plural(queries, 'query', 'queries'), docs && plural(docs, 'document')]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                {urgentHours !== undefined && (
                  <Clock tone={urgentHours < 24 ? 'urgent' : 'soon'}>{countdown(urgentHours)}</Clock>
                )}
                <CaretDown
                  size={16}
                  weight="bold"
                  aria-hidden
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
                />
              </button>

              {isOpen && (
                <div className="group__body tabpanel">
                  {items.map((item, i) =>
                    item.kind === 'query' ? (
                      <div className="group__item" key={`q${i}`}>
                        <ChatCircleDots size={19} weight={ICON_WEIGHT} color="var(--danger-text)" aria-hidden style={{ marginTop: 2, flex: '0 0 auto' }} />
                        <div className="grow">
                          <h3 style={{ fontSize: 'var(--text-h4)' }}>{item.query!.subject}</h3>
                          <p className="secondary text-sm" style={{ marginTop: 3 }}>{item.query!.messages[0]?.body}</p>
                        </div>
                        <Link to={`/cases/${app.id}`} className="btn btn--primary btn--sm nowrap">Reply</Link>
                      </div>
                    ) : (
                      <div className="group__item" key={`d${i}`}>
                        <Files size={19} weight={ICON_WEIGHT} color="var(--text-muted)" aria-hidden style={{ marginTop: 2, flex: '0 0 auto' }} />
                        <div className="grow">
                          <div className="row-tight wrap" style={{ gap: 'var(--sp-2)' }}>
                            <h3 style={{ fontSize: 'var(--text-h4)' }}>{item.doc!.name}</h3>
                            <Pill tone={docStatusPill[item.doc!.status]}>{docStatusLabel[item.doc!.status]}</Pill>
                          </div>
                          {item.doc!.rejection && (
                            <p className="secondary text-sm" style={{ marginTop: 3 }}>
                              {item.doc!.rejection.reason} <strong style={{ color: 'var(--text)' }}>Send instead:</strong>{' '}
                              {item.doc!.rejection.example}
                            </p>
                          )}
                        </div>
                        <Link
                          to={`/cases/${app.id}`}
                          className="btn btn--secondary btn--sm nowrap"
                        >
                          {item.doc!.status === 'pending'
                            ? <><Paperclip size={14} weight={ICON_WEIGHT} aria-hidden /> Upload</>
                            : <><ArrowClockwise size={14} weight="bold" aria-hidden /> Replace</>}
                        </Link>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {expiring.length > 0 && (
        <section aria-labelledby="expiring">
          <h2 id="expiring" style={{ marginBottom: 'var(--sp-3)' }}>Expiring soon</h2>
          <div className="list">
            {expiring.map(({ app, doc }) => (
              <Link key={`${app.id}-${doc.id}`} to={`/cases/${app.id}`} className="line">
                <CalendarX size={17} weight={ICON_WEIGHT} color="var(--warning)" aria-hidden />
                <span className="grow">
                  <span className="semibold">{app.company}</span>{' '}
                  <span className="secondary text-sm">— {doc.name}</span>
                </span>
                <Clock tone="soon">{plural(doc.expiresInDays!, 'day')}</Clock>
                <CaretRight size={14} weight="bold" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs muted">
        A case only ever goes on hold automatically. Declining a live deal is a decision a person makes.
      </p>
    </div>
  )
}
