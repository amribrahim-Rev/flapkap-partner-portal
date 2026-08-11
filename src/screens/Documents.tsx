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
 * Structure is deliberately shallow and repetitive — client, then a titled
 * block per kind of thing, then plain rows. Two actions per block at most, and
 * every clock sits on the row it belongs to rather than in the client header,
 * which is what made an earlier version feel busy.
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
        actions={
          <span className="secondary text-sm">
            {plural(totalItems, 'item')} across {plural(groups.length, 'client')}
          </span>
        }
      />

      {groups.map(({ app, docs, queries, soonestHours }) => (
        <section className="card" key={app.id} aria-labelledby={`c-${app.id}`}>
          {/* Client header: who it is, how much is outstanding, and the way
              through to the case. No buttons here — actions belong to the block
              they act on, one row further down. */}
          <div className="doc-client">
            <div>
              <h2 id={`c-${app.id}`}>{app.company}</h2>
              <p className="secondary text-sm" style={{ marginTop: 3 }}>
                {app.contactName} · {plural(docs.length + queries.length, 'item')} to clear
              </p>
            </div>
            <Link to={`/cases/${app.id}`} className="text-sm semibold row-tight nowrap" style={{ gap: 6 }}>
              Open case <ArrowRight size={ICON_PILL} weight="bold" aria-hidden />
            </Link>
          </div>

          {queries.length > 0 && (
            <div className="doc-block">
              <div className="doc-block__head">
                <div>
                  <h3>Queries</h3>
                  <p className="secondary text-sm">An open query holds the case. Answer it first.</p>
                </div>
                {soonestHours !== undefined && (
                  <Clock tone={soonestHours < 24 ? 'urgent' : 'soon'}>{countdown(soonestHours)}</Clock>
                )}
              </div>

              <div className="list">
                {queries.map((q) => (
                  <div className="doc-row" key={q.id}>
                    <span className="doc-row__icon doc-row__icon--query" aria-hidden>
                      <ChatCircleDots size={ICON_INLINE} weight={ICON_WEIGHT} />
                    </span>
                    <div className="grow">
                      <h4>{q.subject}</h4>
                      <p className="secondary text-sm">{q.messages[0]?.body}</p>
                    </div>
                    <div className="row-tight">
                      <Link to={`/cases/${app.id}`} className="btn btn--secondary btn--sm nowrap">Reply</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {docs.length > 0 && (
            <div className="doc-block">
              <div className="doc-block__head">
                <div>
                  <h3>Documents</h3>
                  <p className="secondary text-sm">One good version is enough. We'll tell you what's missing.</p>
                </div>
                <div className="row-tight wrap">
                  {/* The action that was missing entirely: brokers were retyping
                      our document list into WhatsApp by hand. */}
                  <Button variant="quiet" icon={<WhatsappLogo size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                    Send list
                  </Button>
                  <Button variant="secondary" icon={<UploadSimple size={ICON_INLINE} weight="bold" aria-hidden />}>
                    Upload document
                  </Button>
                </div>
              </div>

              <div className="list">
                {docs.map((d) => {
                  const done = received[`${app.id}-${d.id}`]
                  return (
                    <div className="doc-row" key={d.id}>
                      <span className="doc-row__icon doc-row__icon--doc" aria-hidden>
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
          <div className="doc-client">
            <div>
              <h2 id="expiring">Expiring soon</h2>
              <p className="secondary text-sm" style={{ marginTop: 3 }}>
                A document that expires mid-assessment restarts the clock.
              </p>
            </div>
          </div>
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
