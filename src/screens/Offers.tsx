import { Link } from 'react-router-dom'
import {
  Receipt, Eye, Check, WhatsappLogo, CaretRight, FileText, ArrowRight,
} from '@phosphor-icons/react'
import { applications } from '../lib/data'
import { partA, productLabel } from '../lib/domain'
import { aed, longDate, pct, plural } from '../lib/format'
import {
  Button, Callout, Chip, Clock, EmptyState, ICON_EMPTY, ICON_INLINE, ICON_PILL, ICON_ROW, ICON_WEIGHT,
  PageHead, Pill, SectionHead,
} from '../components/ui'

/**
 * Three states, in the order a deal walks them.
 *
 * "Conditional" is an approval in principle: an indicative amount with the full
 * document set still outstanding. It is not yet an offer anyone can sign, so it
 * had no home on this page before and brokers went looking for it here anyway.
 */
const conditional = applications.filter((a) => a.stage === 'aip_approved')
const finalOffers = applications.filter((a) => a.offer && !a.offer.signedAt)
const signed = applications.filter((a) => a.offer?.signedAt)

const TODAY = new Date('2026-08-10').getTime()
const daysTo = (iso: string) => Math.round((new Date(iso).getTime() - TODAY) / 86_400_000)

export function Offers() {
  const atRisk = finalOffers.reduce((s, a) => s + partA(a.offer!.amount, a.offer!.feeRate), 0)

  return (
    <div className="page">
      <PageHead
        title="Offers"
        meta={
          finalOffers.length > 0
            ? <>{plural(finalOffers.length, 'offer')} awaiting signature · {aed(atRisk)} of commission riding on them</>
            : 'Nothing awaiting signature.'
        }
      />

      {/* ---------------- Conditional offers ---------------- */}
      {conditional.length > 0 && (
        <section>
          <SectionHead title={`Conditional offers · ${conditional.length}`} />
          <ul className="list">
            {conditional.map((a) => {
              const missing = a.documents.filter((d) => d.required && d.status !== 'verified')
              return (
                <li key={a.id}>
                  <div className="item item--offer" style={{ alignItems: 'flex-start' }}>
                    <Chip tone="primary"><FileText size={ICON_ROW} weight={ICON_WEIGHT} /></Chip>

                    <div className="grow">
                      <div className="row-tight wrap" style={{ gap: 'var(--sp-3)' }}>
                        <Link to={`/cases/${a.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          <h3 style={{ fontSize: 'var(--text-h4)' }}>{a.company}</h3>
                        </Link>
                        <Pill tone="pill--client">Conditional offer</Pill>
                      </div>
                      <p className="secondary text-sm" style={{ marginTop: 3 }}>
                        Indicative {aed(a.requestedAmount ?? 0)} · {a.industry} · {a.ref}
                      </p>

                      <p className="text-sm" style={{ marginTop: 'var(--sp-3)' }}>
                        {missing.length > 0
                          ? <>Becomes a signable offer once {plural(missing.length, 'document')} clears credit: {missing.map((d) => d.name).join(', ')}.</>
                          : <>All four documents are in. Credit is preparing the final offer.</>}
                      </p>
                    </div>

                    <div className="item__actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--sp-2)' }}>
                      {a.protectedUntil && (
                        <Clock tone={daysTo(a.protectedUntil) <= 14 ? 'urgent' : daysTo(a.protectedUntil) <= 30 ? 'soon' : 'calm'}>
                          {plural(Math.max(daysTo(a.protectedUntil), 0), 'day')} protected
                        </Clock>
                      )}
                      <Link to={`/cases/${a.id}`} className="btn btn--secondary btn--sm">
                        Open case <ArrowRight size={ICON_PILL} weight="bold" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ---------------- Final offers ---------------- */}
      <section>
        <SectionHead title={finalOffers.length > 0 ? `Final offers · ${finalOffers.length}` : 'Final offers'} />
        {finalOffers.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Receipt size={ICON_EMPTY} weight={ICON_WEIGHT} />}
              title="No offers out"
              body="When credit issues a final offer it lands here with a signing link you can send straight to your client, and you will see the moment they open it."
            />
          </div>
        ) : (
          <ul className="list">
            {finalOffers.map((a) => {
              const o = a.offer!
              const left = daysTo(o.expiresOn)
              return (
                <li key={a.id}>
                  {/* No danger fill. An offer three days from expiry is normal
                      business, not an error — the countdown carries the urgency
                      and a red card just makes the page look broken. */}
                  <div className="item item--offer" style={{ alignItems: 'flex-start' }}>
                    <Chip tone="primary"><Receipt size={ICON_ROW} weight={ICON_WEIGHT} /></Chip>

                    <div className="grow">
                      <div className="row-tight wrap" style={{ gap: 'var(--sp-3)' }}>
                        <Link to={`/cases/${a.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          <h3 style={{ fontSize: 'var(--text-h4)' }}>{a.company}</h3>
                        </Link>
                        <Pill tone="pill--you">Final offer</Pill>
                      </div>
                      <p className="secondary text-sm" style={{ marginTop: 3 }}>
                        {aed(o.amount)} · {productLabel[o.product]} · {plural(o.tenureMonths, 'month')} · fee {pct(o.feeRate)}
                      </p>

                      {/* Signing telemetry. The thing a broker cannot get on WhatsApp. */}
                      <div className="row-tight wrap text-sm" style={{ gap: 'var(--sp-4)', marginTop: 'var(--sp-3)' }}>
                        <span className="row-tight" style={{ gap: 5, color: 'var(--success)' }}>
                          <Check size={ICON_PILL} weight="bold" aria-hidden /> Link sent
                        </span>
                        <span className="row-tight" style={{ gap: 5, color: o.clientViewedAt ? 'var(--primary-text)' : 'var(--text-muted)' }}>
                          <Eye size={ICON_PILL} weight={ICON_WEIGHT} aria-hidden />
                          {o.clientViewedAt ? `Opened ${longDate(o.clientViewedAt)}` : 'Not opened yet'}
                        </span>
                        <span className="muted row-tight" style={{ gap: 5 }}>
                          <Check size={ICON_PILL} weight={ICON_WEIGHT} aria-hidden /> Not signed
                        </span>
                      </div>

                      <p className="text-sm" style={{ marginTop: 'var(--sp-3)' }}>
                        Your commission: <strong className="tnum">{aed(partA(o.amount, o.feeRate))}</strong>
                      </p>
                    </div>

                    <div className="item__actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--sp-2)' }}>
                      <Clock tone={left <= 3 ? 'urgent' : left <= 7 ? 'soon' : 'calm'}>
                        {left <= 0 ? 'Expired' : `${plural(left, 'day')} left`}
                      </Clock>
                      <Button size="sm" icon={<WhatsappLogo size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}>
                        Resend link
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ---------------- Signed ---------------- */}
      {signed.length > 0 && (
        <section>
          <SectionHead title={`Signed · ${signed.length}`} />
          <ul className="list">
            {signed.map((a) => (
              <li key={a.id}>
                <Link to={`/cases/${a.id}`} className="item item--link item--inset" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Chip tone="success"><Check size={ICON_ROW} weight="bold" /></Chip>
                  <div className="grow">
                    <h3 style={{ fontSize: 'var(--text-h4)' }}>{a.company}</h3>
                    <p className="secondary text-sm">
                      {aed(a.offer!.amount)} · signed {longDate(a.offer!.signedAt!)}
                    </p>
                  </div>
                  <Pill tone="pill--done">Signed</Pill>
                  <span className="btn-icon" aria-hidden><CaretRight size={ICON_INLINE} weight="bold" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Callout>
        Clients sign the offer, the AECB consent and the data consent in one pass on their phone. If nothing happens
        in 24 hours we remind them, so chasing is not your job unless the deadline is close.
      </Callout>
    </div>
  )
}
