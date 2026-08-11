import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, ArrowRight, ChatCircleDots, FileText, CalendarX, UploadSimple, WhatsappLogo,
} from '@phosphor-icons/react'
import { liveApplications } from '../lib/data'
import { docStatusPill } from '../lib/domain'
import { countdown, plural } from '../lib/format'
import {
  Button, Clock, EmptyState, ICON_EMPTY, ICON_INLINE, ICON_PILL, ICON_WEIGHT, PageHead, Pill,
} from '../components/ui'
import type { Application, DocumentItem, Query } from '../lib/types'

/**
 * A client-first view: one card per client, everything they owe inside it.
 *
 * Status words are short and human rather than our internal vocabulary — a
 * broker reading "Replacement required" has to translate it; "Needs update"
 * they just understand.
 */
const statusWord: Record<DocumentItem['status'], string> = {
  pending: 'Missing',
  rejected: 'Rejected',
  replacement_required: 'Needs update',
  under_review: 'With us',
  verified: 'Clean',
}

interface Group {
  app: Application
  docs: DocumentItem[]
  queries: Query[]
  soonestHours?: number
}

const groups: Group[] = liveApplications
  .map((app) => {
    const docs = app.documents.filter(
      (d) => d.status === 'rejected' || d.status === 'replacement_required' || (d.required && d.status === 'pending'),
    )
    const queries = app.queries.filter((q) => !q.resolved)
    const hours = queries.map((q) => q.dueInHours)
    return { app, docs, queries, soonestHours: hours.length ? Math.min(...hours) : undefined }
  })
  .filter((g) => g.docs.length > 0 || g.queries.length > 0)
  .sort((a, b) => (a.soonestHours ?? 9e9) - (b.soonestHours ?? 9e9) || b.docs.length - a.docs.length)

const expiring = liveApplications.flatMap((app) =>
  app.documents.filter((d) => d.expiresInDays !== undefined && d.expiresInDays < 60).map((d) => ({ app, doc: d })),
)

const totalItems = groups.reduce((s, g) => s + g.docs.length + g.queries.length, 0)

export function Documents() {
  /** Optimistic local state, so "Mark received" does something immediately. */
  const [received, setReceived] = useState<Record<string, boolean>>({})

  if (groups.length === 0) {
    return (
      <div className="page">
        <PageHead eyebrow="Client files" title="Documents & queries" />
        <div className="card">
          <EmptyState
            icon={<Check size={ICON_EMPTY} weight={ICON_WEIGHT} />}
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
        eyebrow="Client files"
        title="Documents & queries"
        meta="A client-first view of what is clean, missing and worth a nudge."
        actions={
          <span className="secondary text-sm">
            {plural(totalItems, 'item')} across {plural(groups.length, 'client')}
          </span>
        }
      />

      {groups.map(({ app, docs, queries, soonestHours }) => (
        <section className="card" key={app.id} aria-labelledby={`c-${app.id}`}>
          {/* "Open case" is always present — a broker reading a document problem
              wants the case it belongs to, not a dead end. */}
          <div className="between wrap" style={{ alignItems: 'flex-start', gap: 'var(--sp-4)' }}>
            <div>
              <h2 id={`c-${app.id}`}>{app.company}</h2>
              <p className="secondary text-sm" style={{ marginTop: 4 }}>
                {app.contactName} · {plural(docs.length + queries.length, 'item')} to clear
              </p>
            </div>
            <div className="row-tight">
              {soonestHours !== undefined && (
                <Clock tone={soonestHours < 24 ? 'urgent' : 'soon'}>{countdown(soonestHours)}</Clock>
              )}
              <Link to={`/cases/${app.id}`} className="text-sm semibold row-tight" style={{ gap: 6 }}>
                Open case <ArrowRight size={ICON_PILL} weight="bold" aria-hidden />
              </Link>
            </div>
          </div>

          {queries.length > 0 && (
            <div className="region">
              <h3>Queries</h3>
              <p className="secondary text-sm" style={{ marginTop: 3 }}>
                Answer these first — an open query holds the case.
              </p>
              <div className="list" style={{ marginTop: 'var(--sp-4)' }}>
                {queries.map((q) => (
                  <div className="doc-row" key={q.id}>
                    <span className="doc-row__icon" aria-hidden>
                      <ChatCircleDots size={ICON_INLINE} weight={ICON_WEIGHT} color="var(--danger-text)" />
                    </span>
                    <div className="grow">
                      <h4>{q.subject}</h4>
                      <p className="secondary text-sm">{q.messages[0]?.body}</p>
                    </div>
                    <Link to={`/cases/${app.id}`} className="btn btn--primary btn--sm nowrap">Reply</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {docs.length > 0 && (
            <div className="region">
              <div className="between wrap" style={{ alignItems: 'flex-start', gap: 'var(--sp-4)' }}>
                <div>
                  <h3>Documents</h3>
                  <p className="secondary text-sm" style={{ marginTop: 3 }}>
                    One good version is enough. We&apos;ll tell you what&apos;s missing.
                  </p>
                </div>
                <div className="row-tight wrap">
                  {/* The action that was missing entirely: brokers were retyping
                      our document list into WhatsApp by hand. */}
                  <Button size="sm" variant="secondary" icon={<WhatsappLogo size={ICON_PILL} weight={ICON_WEIGHT} aria-hidden />}>
                    Send list to client
                  </Button>
                  <Button size="sm" icon={<UploadSimple size={ICON_PILL} weight="bold" aria-hidden />}>
                    Upload document
                  </Button>
                </div>
              </div>

              <div className="list" style={{ marginTop: 'var(--sp-4)' }}>
                {docs.map((d) => {
                  const done = received[`${app.id}-${d.id}`]
                  return (
                    <div className="doc-row" key={d.id}>
                      <span className="doc-row__icon" aria-hidden>
                        <FileText size={ICON_INLINE} weight={ICON_WEIGHT} />
                      </span>
                      <div className="grow">
                        <h4>{d.name}</h4>
                        <p className="secondary text-sm">
                          {d.rejection ? d.rejection.reason : 'Required to submit the case'}
                        </p>
                        {d.rejection && (
                          <p className="text-sm" style={{ marginTop: 4 }}>
                            <strong>Send instead:</strong>{' '}
                            <span className="secondary">{d.rejection.example}</span>
                          </p>
                        )}
                      </div>
                      <div className="row-tight">
                        {done ? (
                          <Pill tone="pill--done"><Check size={ICON_PILL} weight="bold" aria-hidden /> Received</Pill>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setReceived((r) => ({ ...r, [`${app.id}-${d.id}`]: true }))}
                            >
                              Mark received
                            </Button>
                            <Pill tone={docStatusPill[d.status]} noDot>{statusWord[d.status]}</Pill>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      ))}

      {expiring.length > 0 && (
        <section className="card" aria-labelledby="expiring">
          <h2 id="expiring">Expiring soon</h2>
          <p className="secondary text-sm" style={{ marginTop: 4 }}>
            A document that expires mid-assessment restarts the clock.
          </p>
          <div className="list" style={{ marginTop: 'var(--sp-4)' }}>
            {expiring.map(({ app, doc }) => (
              <Link key={`${app.id}-${doc.id}`} to={`/cases/${app.id}`} className="doc-row doc-row--link">
                <span className="doc-row__icon" aria-hidden>
                  <CalendarX size={ICON_INLINE} weight={ICON_WEIGHT} color="var(--warning)" />
                </span>
                <div className="grow">
                  <h4>{app.company}</h4>
                  <p className="secondary text-sm">{doc.name}</p>
                </div>
                <Clock tone="soon">{plural(doc.expiresInDays!, 'day')}</Clock>
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
