import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Check, Copy, WhatsappLogo, Warning, ChatCircleDots, Paperclip,
  ArrowUpRight, ShieldCheck, Phone, XCircle, ArrowClockwise, Sparkle, CalendarX,
} from '@phosphor-icons/react'
import { broker, byId } from '../lib/data'
import {
  docStatusLabel, docStatusPill, ownerLabel, ownerPill, partA, productLabel, stageLabel,
} from '../lib/domain'
import { aed, countdown, longDate, pct, plural } from '../lib/format'
import {
  Button, Callout, Chip, Clock, EmptyState, ICON_EMPTY, ICON_INLINE, ICON_PILL, ICON_ROW, ICON_WEIGHT, Pill,
} from '../components/ui'
import type { Application, Stage } from '../lib/types'

type Tab = 'overview' | 'documents' | 'queries' | 'offer'

/** The journey every case walks, and where the given stage sits on it. */
const JOURNEY: { key: string; label: string; note: (a: Application) => string; stages: Stage[] }[] = [
  { key: 'submitted', label: 'Case submitted', stages: ['lead'], note: (a) => `${longDate(a.submittedOn)} · by you` },
  { key: 'aip', label: 'Reviewed by our credit team', stages: ['aip_review'], note: () => 'Typically 3 working days' },
  { key: 'aip_ok', label: 'Approved in principle', stages: ['aip_approved'], note: (a) => (a.requestedAmount ? `Indicative ${aed(a.requestedAmount)}` : 'Indicative amount issued') },
  { key: 'docs', label: 'Full application and documents', stages: ['full_app', 'docs_pending'], note: (a) => `${a.documents.filter((d) => d.status === 'verified').length} of ${a.documents.length} verified` },
  { key: 'credit', label: 'Credit assessment', stages: ['credit_review'], note: () => 'Typically 3–5 working days' },
  { key: 'offer', label: 'Offer issued and signed', stages: ['offer_issued', 'offer_accepted'], note: (a) => (a.offer ? `${aed(a.offer.amount)} · expires ${longDate(a.offer.expiresOn)}` : 'Awaiting credit') },
  { key: 'disbursed', label: 'Funds disbursed', stages: ['disbursing', 'disbursed'], note: (a) => (a.disbursedOn ? longDate(a.disbursedOn) : 'Usually 2 working days after signing') },
  { key: 'commission', label: 'Your commission paid', stages: ['commission_payable', 'commission_paid'], note: (a) => (a.commissionStatus === 'paid' ? `Paid ${longDate(a.commissionDueOn!)}` : a.commissionDueOn ? `Expected ${longDate(a.commissionDueOn)}` : "After the client's first repayment") },
]

const STAGE_ORDER: Stage[] = [
  'lead', 'aip_review', 'aip_approved', 'full_app', 'docs_pending', 'credit_review',
  'offer_issued', 'offer_accepted', 'disbursing', 'disbursed', 'commission_payable', 'commission_paid',
]

function stepState(a: Application, stages: Stage[]): 'done' | 'current' | 'todo' | 'blocked' {
  if (a.stage === 'declined' || a.stage === 'aip_declined') {
    const declineAt = a.stage === 'aip_declined' ? 'aip_review' : 'credit_review'
    const idx = STAGE_ORDER.indexOf(declineAt)
    const maxHere = Math.max(...stages.map((s) => STAGE_ORDER.indexOf(s)))
    if (maxHere < idx) return 'done'
    if (maxHere === idx) return 'blocked'
    return 'todo'
  }
  const currentIdx = STAGE_ORDER.indexOf(a.stage)
  const maxHere = Math.max(...stages.map((s) => STAGE_ORDER.indexOf(s)))
  const minHere = Math.min(...stages.map((s) => STAGE_ORDER.indexOf(s)))
  if (currentIdx > maxHere) return 'done'
  if (currentIdx >= minHere) return 'current'
  return 'todo'
}

/** A line the broker can read straight to their client. */
function clientLine(a: Application): string | null {
  if (a.stage === 'offer_issued' && a.offer) {
    return `Your ${aed(a.offer.amount)} facility from FlapKap is approved and the agreement is ready to sign. It expires on ${longDate(a.offer.expiresOn)} — I can walk you through it today.`
  }
  if (a.stage === 'aip_approved') {
    return `Good news — FlapKap has approved you in principle for up to ${aed(a.requestedAmount ?? 0)}. Next step is the full document set, and I'll send you the list now.`
  }
  if (a.stage === 'credit_review' || a.stage === 'aip_review') {
    return `Your application is with FlapKap's credit team now. They usually come back within three working days and I'll call you the moment I hear.`
  }
  if (a.stage === 'docs_pending') {
    const missing = a.documents.filter((d) => d.required && d.status !== 'verified').map((d) => d.name)
    return `We're nearly there on your FlapKap application — still need ${missing.slice(0, 2).join(' and ')}. Send those over and I'll push it straight through.`
  }
  if (a.stage === 'disbursed' || a.stage === 'commission_payable' || a.stage === 'commission_paid') {
    return `Your ${aed(a.disbursedAmount ?? 0)} from FlapKap was disbursed on ${longDate(a.disbursedOn!)}. Let me know when you want to talk about a top-up.`
  }
  return null
}

export function ApplicationDetail() {
  const { id } = useParams()
  const a = id ? byId(id) : undefined
  const [tab, setTab] = useState<Tab>('overview')
  const [copied, setCopied] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  if (!a) {
    return (
      <div className="page">
        <div className="card">
          <EmptyState
            icon={<XCircle size={ICON_EMPTY} weight={ICON_WEIGHT} />}
            title="That case is not on your book"
            body="It may have been reassigned, or the link may be out of date. Your live cases are all on your cases list."
            action={<Link to="/cases" className="btn btn--primary">Back to cases</Link>}
          />
        </div>
      </div>
    )
  }

  const line = clientLine(a)
  const openQueries = a.queries.filter((q) => !q.resolved)
  const docsDone = a.documents.filter((d) => d.status === 'verified').length
  const docsBad = a.documents.filter((d) => d.status === 'rejected' || d.status === 'replacement_required')

  function copyLine() {
    if (!line) return
    navigator.clipboard?.writeText(line).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'documents', label: 'Documents', badge: docsBad.length || undefined },
    { key: 'queries', label: 'Queries', badge: openQueries.length || undefined },
    { key: 'offer', label: 'Offer' },
  ]

  return (
    <div className="page">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Link to="/cases" className="btn-icon" aria-label="Back to cases">
          <ArrowLeft size={ICON_INLINE} weight="bold" aria-hidden />
        </Link>
        <div className="grow">
          <h1>{a.company}</h1>
          <p className="secondary text-sm" style={{ marginTop: 6 }}>
            {a.industry} · {a.ref} · submitted {longDate(a.submittedOn)}
          </p>
        </div>
        <Pill tone={ownerPill[a.owner]}>{ownerLabel[a.owner]}</Pill>
      </div>

      <div role="tablist" aria-label="Case sections" className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            className="tab"
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.badge ? (
              <span className="nav__count" data-urgent="true" style={{ marginLeft: 8 }}>{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ---------------- Overview ---------------- */}
      {tab === 'overview' && (
        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="tabpanel split">
          <div style={{ display: 'grid', gap: 'var(--sp-6)' }}>
            {a.decline && (
              <section className="card" style={{ borderColor: 'var(--danger-line)', background: 'var(--danger-soft)' }}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <Chip tone="danger"><XCircle size={ICON_ROW} weight={ICON_WEIGHT} /></Chip>
                  <div className="grow">
                    <h2>Not approved</h2>
                    <p className="secondary text-sm" style={{ marginTop: 4 }}>{a.decline.category}</p>
                  </div>
                </div>
                <div className="region">
                  <h3>Why</h3>
                  <p className="secondary text-sm" style={{ marginTop: 4 }}>{a.decline.reason}</p>
                </div>
                <div className="region">
                  <h3>What to tell your client</h3>
                  <div className="inset" style={{ marginTop: 'var(--sp-3)' }}>
                    <p className="text-sm">“{a.decline.tellClient}”</p>
                    <div className="row-tight" style={{ marginTop: 'var(--sp-3)' }}>
                      <Button size="sm" icon={<Copy size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}
                              onClick={() => navigator.clipboard?.writeText(a.decline!.tellClient).catch(() => {})}>
                        Copy
                      </Button>
                      <Button size="sm" variant="secondary" icon={<WhatsappLogo size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                        Share on WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="region">
                  <h3>How to make it fundable</h3>
                  <ul style={{ display: 'grid', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
                    {a.decline.improve.map((s) => (
                      <li key={s} className="row-tight text-sm secondary" style={{ gap: 'var(--sp-2)' }}>
                        <Check size={ICON_INLINE} weight="bold" color="var(--success)" aria-hidden /> {s}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm" style={{ marginTop: 'var(--sp-4)' }}>
                    Reapply from <strong>{longDate(a.decline.reapplyAfter)}</strong>. Case protection is preserved
                    for you until then.
                  </p>
                </div>
              </section>
            )}

            <section className="card">
              <h2>Where this case stands</h2>
              <div className="track" style={{ marginTop: 'var(--sp-6)' }}>
                {JOURNEY.map((step, i) => {
                  const state = stepState(a, step.stages)
                  return (
                    <div className="track__step" key={step.key} data-state={state}>
                      <span className="track__node" aria-hidden>
                        {state === 'done' ? <Check size={ICON_PILL} weight="bold" />
                          : state === 'blocked' ? <XCircle size={ICON_INLINE} weight="bold" />
                          : i + 1}
                      </span>
                      <div>
                        <h3 className={state === 'todo' ? 'muted' : undefined} style={{ fontSize: 'var(--text-h4)' }}>
                          {step.label}
                        </h3>
                        <p className="secondary text-sm" style={{ marginTop: 2 }}>{step.note(a)}</p>

                        {/* The ammunition. Only on the current step. */}
                        {state === 'current' && line && (
                          <div className="inset" style={{ marginTop: 'var(--sp-3)' }}>
                            <p className="micro" style={{ color: 'var(--text)' }}>Send this to your client</p>
                            <p className="text-sm" style={{ marginTop: 6 }}>“{line}”</p>
                            <div className="row-tight wrap" style={{ marginTop: 'var(--sp-3)' }}>
                              <Button size="sm" onClick={copyLine}
                                      icon={copied ? <Check size={ICON_INLINE} weight="bold" aria-hidden /> : <Copy size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                                {copied ? 'Copied' : 'Copy'}
                              </Button>
                              <Button size="sm" variant="secondary"
                                      icon={<WhatsappLogo size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                                Share on WhatsApp
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <aside style={{ display: 'grid', gap: 'var(--sp-4)', alignContent: 'start' }}>
            {a.offer && (
              <section className="card">
                <h3>Your commission on this deal</h3>
                <p className="tnum" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: 'var(--tracking-tight)', margin: '8px 0 2px' }}>
                  {aed(a.commission ?? 0)}
                </p>
                <p className="secondary text-sm">
                  {a.offer.feeRate <= 0.015
                    ? <>1.00% of {aed(a.offer.amount)} — the 1.5% fee floor rate</>
                    : <>75% of the {pct(a.offer.feeRate)} arrangement fee on {aed(a.offer.amount)}</>}
                </p>
                <div className="region">
                  <p className="secondary text-sm">
                    {a.commissionStatus === 'paid' ? <>Paid {longDate(a.commissionDueOn!)}.</>
                      : a.commissionStatus === 'awaiting_first_repayment'
                        ? <>Held until the client’s first repayment. Expected <strong style={{ color: 'var(--text)' }}>{longDate(a.commissionDueOn!)}</strong>.</>
                        : <>Payable once the facility is disbursed and the client makes their first repayment.</>}
                  </p>
                </div>
              </section>
            )}

            <section className="card">
              <h3>Client contact</h3>
              <div className="row" style={{ marginTop: 'var(--sp-4)' }}>
                <Chip tone="primary"><Phone size={ICON_INLINE} weight={ICON_WEIGHT} /></Chip>
                <div className="grow">
                  <h4>{a.contactName}</h4>
                  <p className="secondary text-sm">{a.contactPhone}</p>
                </div>
              </div>
              <div style={{ marginTop: 'var(--sp-4)' }}>
                <Button variant="secondary" size="sm" block onClick={() => setTab('documents')}>
                  View documents ({docsDone}/{a.documents.length})
                </Button>
              </div>
            </section>

            {a.protectedUntil && (
              <section className="card">
                <div className="row">
                  <Chip tone="primary"><ShieldCheck size={ICON_INLINE} weight={ICON_WEIGHT} /></Chip>
                  <div className="grow">
                    <h4>Case protected</h4>
                    <p className="secondary text-sm">Until {longDate(a.protectedUntil)}</p>
                  </div>
                </div>
                {a.waitlistedPartners ? (
                  <div style={{ marginTop: 'var(--sp-4)' }}>
                    <Callout tone="warning">
                      {plural(a.waitlistedPartners, 'partner')} waitlisted on this licence. Move the case forward to
                      extend your hold.
                    </Callout>
                  </div>
                ) : null}
              </section>
            )}

            <section className="card">
              <h3>Need help?</h3>
              <div className="row" style={{ marginTop: 'var(--sp-4)' }}>
                <span className="avatar avatar--lg" aria-hidden>
                  {broker.partnerManager.initials}
                </span>
                <div className="grow">
                  <h4>{broker.partnerManager.name}</h4>
                  <p className="secondary text-sm">Your partner manager</p>
                </div>
              </div>
              <div className="row-tight" style={{ marginTop: 'var(--sp-4)' }}>
                <Button size="sm" variant="secondary" block icon={<WhatsappLogo size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                  WhatsApp Sara
                </Button>
              </div>
            </section>
          </aside>
        </div>
      )}

      {/* ---------------- Documents ---------------- */}
      {tab === 'documents' && (
        <div id="panel-documents" role="tabpanel" aria-labelledby="tab-documents" className="tabpanel" style={{ display: 'grid', gap: 'var(--sp-5)' }}>
          <div className="card">
            <div className="between wrap">
              <div>
                <h2>Document checklist</h2>
                <p className="secondary text-sm" style={{ marginTop: 4 }}>
                  {docsDone} of {a.documents.length} verified
                  {docsBad.length > 0 && <> · <strong style={{ color: 'var(--danger-text)' }}>{plural(docsBad.length, 'item')} needs replacing</strong></>}
                </p>
              </div>
              <Button size="sm" variant="secondary" icon={<Paperclip size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                Upload files
              </Button>
            </div>
            <div style={{ marginTop: 'var(--sp-4)' }}>
              <div className="progress">
                <span className="progress__fill progress__fill--success" style={{ width: `${(docsDone / Math.max(1, a.documents.length)) * 100}%` }} />
              </div>
            </div>
          </div>

          {a.documents.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<Paperclip size={ICON_EMPTY} weight={ICON_WEIGHT} />}
                title="No documents on this case yet"
                body="Once the client uploads, each file appears here with its verification status and anything we extracted from it."
              />
            </div>
          ) : (
            (() => {
              const docs = a.documents
              return (
                <section>
                  <h2 style={{ marginBottom: 'var(--sp-3)' }}>The four we need</h2>
                  <ul className="list">
                    {docs.map((d) => (
                      <li key={d.id} className={`item ${d.status === 'rejected' ? 'item--danger' : d.status === 'replacement_required' ? 'item--warning' : ''}`} style={{ alignItems: 'flex-start' }}>
                        <div className="grow">
                          <div className="row-tight wrap" style={{ gap: 'var(--sp-2)' }}>
                            <h3 style={{ fontSize: 'var(--text-h4)' }}>{d.name}</h3>
                            {!d.required && <Pill tone="pill--closed" noDot>Optional</Pill>}
                          </div>
                          <p className="secondary text-sm" style={{ marginTop: 3 }}>{d.description}</p>

                          {d.insight && (
                            <p className="row-tight text-sm" style={{ gap: 6, marginTop: 'var(--sp-2)', color: 'var(--primary-text)' }}>
                              <Sparkle size={ICON_PILL} weight="fill" aria-hidden /> {d.insight}
                            </p>
                          )}

                          {d.expiresInDays !== undefined && d.expiresInDays < 60 && (
                            <p className="row-tight text-sm" style={{ gap: 6, marginTop: 'var(--sp-2)', color: 'var(--warning)' }}>
                              <CalendarX size={ICON_PILL} weight={ICON_WEIGHT} aria-hidden /> Expires in {plural(d.expiresInDays, 'day')}
                            </p>
                          )}

                          {d.rejection && (
                            <div className="inset" style={{ marginTop: 'var(--sp-3)' }}>
                              <p className="text-sm"><strong>Why it was rejected.</strong> {d.rejection.reason}</p>
                              <p className="text-sm secondary" style={{ marginTop: 6 }}>
                                <strong style={{ color: 'var(--text)' }}>What we need instead.</strong> {d.rejection.example}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="item__actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--sp-2)' }}>
                          <Pill tone={docStatusPill[d.status]}>{docStatusLabel[d.status]}</Pill>
                          {(d.status === 'pending' || d.status === 'rejected' || d.status === 'replacement_required') && (
                            <Button size="sm" variant={d.status === 'pending' ? 'primary' : 'secondary'}
                                    icon={d.status === 'pending' ? undefined : <ArrowClockwise size={ICON_PILL} weight="bold" aria-hidden />}>
                              {d.status === 'pending' ? 'Upload' : 'Replace'}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })()
          )}

          <Callout tone="info">
            These four are the whole list. If credit needs anything else on this case it comes to you as a query,
            never as another wall of uploads. Every file is logged — who uploaded it, who viewed it, and when.
          </Callout>
        </div>
      )}

      {/* ---------------- Queries ---------------- */}
      {tab === 'queries' && (
        <div id="panel-queries" role="tabpanel" aria-labelledby="tab-queries" className="tabpanel" style={{ display: 'grid', gap: 'var(--sp-5)' }}>
          {a.queries.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<ChatCircleDots size={ICON_EMPTY} weight={ICON_WEIGHT} />}
                title="No open queries"
                body="If credit needs something specific, it appears here with a deadline and everything they already told us. You will get an email the moment one is raised."
              />
            </div>
          ) : (
            a.queries.map((q) => (
              <section key={q.id} className={`card${q.resolved ? '' : ' '}`} style={!q.resolved ? { borderColor: 'var(--danger-line)' } : undefined}>
                <div className="between wrap" style={{ alignItems: 'flex-start' }}>
                  <div className="row" style={{ alignItems: 'flex-start' }}>
                    <Chip tone={q.resolved ? 'success' : 'danger'}>
                      {q.resolved ? <Check size={ICON_ROW} weight="bold" /> : <Warning size={ICON_ROW} weight={ICON_WEIGHT} />}
                    </Chip>
                    <div>
                      <h2>{q.subject}</h2>
                      <p className="secondary text-sm" style={{ marginTop: 3 }}>
                        Raised {longDate(q.raisedAt)} by the credit team
                      </p>
                    </div>
                  </div>
                  {!q.resolved && <Clock tone={q.dueInHours < 24 ? 'urgent' : 'soon'}>{countdown(q.dueInHours)}</Clock>}
                </div>

                {!q.resolved && q.escalation >= 24 && (
                  <div style={{ marginTop: 'var(--sp-4)' }}>
                    <Callout tone="danger">
                      This query is past its first reminder. If it stays unanswered the case goes{' '}
                      <strong>on hold</strong> and your partner manager is asked to call you — it is never
                      auto-declined without a person looking at it first.
                    </Callout>
                  </div>
                )}

                <div className="thread region">
                  {q.messages.map((m, i) => (
                    <div key={i} className={`msg${m.from === 'broker' ? ' msg--mine' : ''}`}>
                      <p className="msg__meta">
                        {m.from === 'credit' ? 'FlapKap credit' : 'You'} · {longDate(m.at)}
                      </p>
                      <p className="text-sm">{m.body}</p>
                    </div>
                  ))}
                </div>

                {!q.resolved && (
                  <div className="region">
                    <label className="field__label" htmlFor={`reply-${q.id}`}>Your reply</label>
                    <textarea
                      id={`reply-${q.id}`}
                      className="textarea"
                      style={{ marginTop: 'var(--sp-2)' }}
                      placeholder="Answer the question, and attach the file if you have it."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <div className="row-tight wrap" style={{ marginTop: 'var(--sp-3)' }}>
                      <Button
                        size="sm"
                        disabled={reply.trim().length === 0}
                        loading={sending}
                        onClick={() => { setSending(true); window.setTimeout(() => setSending(false), 800) }}
                      >
                        Send reply
                      </Button>
                      <Button size="sm" variant="secondary" icon={<Paperclip size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                        Attach a document
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      )}

      {/* ---------------- Offer ---------------- */}
      {tab === 'offer' && (
        <div id="panel-offer" role="tabpanel" aria-labelledby="tab-offer" className="tabpanel">
          {!a.offer ? (
            <div className="card">
              <EmptyState
                icon={<ArrowUpRight size={ICON_EMPTY} weight={ICON_WEIGHT} />}
                title="No offer yet"
                body={`This case is at “${stageLabel[a.stage]}”. Once credit issues an offer you will see the amount, the fee, your commission and a signing link to send your client.`}
              />
            </div>
          ) : (
            <div className="split">
              <section className="card">
                <div className="between wrap" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h2>{aed(a.offer.amount)}</h2>
                    <p className="secondary text-sm" style={{ marginTop: 4 }}>
                      {productLabel[a.offer.product]} · {plural(a.offer.tenureMonths, 'month')}
                    </p>
                  </div>
                  <Pill tone={a.offer.signedAt ? 'pill--done' : 'pill--you'}>
                    {a.offer.signedAt ? 'Signed' : 'Awaiting signature'}
                  </Pill>
                </div>

                <dl className="region" style={{ display: 'grid', gap: 'var(--sp-3)' }}>
                  <div className="between"><dt className="secondary text-sm">Arrangement fee</dt><dd className="semibold tnum" style={{ margin: 0 }}>{pct(a.offer.feeRate)} · {aed(a.offer.amount * a.offer.feeRate)}</dd></div>
                  <div className="between"><dt className="secondary text-sm">Interest to the client</dt><dd className="semibold tnum" style={{ margin: 0 }}>{pct(a.offer.interestRateMonthly)} monthly flat</dd></div>
                  <div className="between"><dt className="secondary text-sm">Your commission (Part A)</dt><dd className="semibold tnum" style={{ margin: 0, color: 'var(--success)' }}>{aed(partA(a.offer.amount, a.offer.feeRate))}</dd></div>
                  <div className="between"><dt className="secondary text-sm">Offer expires</dt><dd className="semibold" style={{ margin: 0 }}>{longDate(a.offer.expiresOn)}</dd></div>
                </dl>

                {a.offer.conditions.length > 0 && (
                  <div className="region">
                    <h3>Conditions</h3>
                    <ul style={{ display: 'grid', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
                      {a.offer.conditions.map((c) => (
                        <li key={c} className="row-tight text-sm secondary" style={{ gap: 'var(--sp-2)' }}>
                          <Check size={ICON_INLINE} weight="bold" color="var(--text-muted)" aria-hidden /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="region">
                  <Callout>
                    The interest the client pays goes entirely to FlapKap and has no effect on your commission.
                    Your side of this deal is the arrangement fee only.
                  </Callout>
                </div>
              </section>

              <aside style={{ display: 'grid', gap: 'var(--sp-4)', alignContent: 'start' }}>
                <section className="card">
                  <h3>Signing</h3>
                  {a.offer.signedAt ? (
                    <p className="secondary text-sm" style={{ marginTop: 'var(--sp-3)' }}>
                      Signed by the client on <strong style={{ color: 'var(--text)' }}>{longDate(a.offer.signedAt)}</strong>.
                    </p>
                  ) : (
                    <>
                      <ol style={{ display: 'grid', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
                        <li className="row-tight text-sm" style={{ gap: 'var(--sp-2)' }}>
                          <Check size={ICON_INLINE} weight="bold" color="var(--success)" aria-hidden /> Link sent
                        </li>
                        <li className="row-tight text-sm" style={{ gap: 'var(--sp-2)' }}>
                          {a.offer.clientViewedAt
                            ? <><Check size={ICON_INLINE} weight="bold" color="var(--success)" aria-hidden /> Client opened it {longDate(a.offer.clientViewedAt)}</>
                            : <><span aria-hidden style={{ width: 15 }} /> <span className="muted">Not opened yet</span></>}
                        </li>
                        <li className="row-tight text-sm" style={{ gap: 'var(--sp-2)' }}>
                          <span aria-hidden style={{ width: 15 }} /> <span className="muted">Not signed</span>
                        </li>
                      </ol>
                      <div style={{ marginTop: 'var(--sp-5)', display: 'grid', gap: 'var(--sp-2)' }}>
                        <Button size="sm" block icon={<WhatsappLogo size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                          Send link on WhatsApp
                        </Button>
                        <Button size="sm" variant="secondary" block
                                icon={<Copy size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}
                                onClick={() => navigator.clipboard?.writeText(a.offer!.shareLink ?? '').catch(() => {})}>
                          Copy signing link
                        </Button>
                      </div>
                      <p className="text-xs muted" style={{ marginTop: 'var(--sp-3)' }}>
                        The client signs the offer, the AECB consent and the data consent together, on their phone.
                        We remind them automatically if nothing happens in 24 hours.
                      </p>
                    </>
                  )}
                </section>
              </aside>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
