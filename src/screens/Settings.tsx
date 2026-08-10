import { useState } from 'react'
import { Bell, EnvelopeSimple, WhatsappLogo, ShieldCheck, Medal } from '@phosphor-icons/react'
import { broker } from '../lib/data'
import { tiers } from '../lib/domain'
import { aed, longDate } from '../lib/format'
import { Button, Callout, Chip, Field, ICON_WEIGHT, PageHead, Pill, SectionHead } from '../components/ui'

const tier = tiers[broker.tier]

/** Channel preferences a broker can actually control, per the discipline
    described on the notifications screen. WhatsApp urgency cannot be turned
    off — it is the only channel that reaches them in time. */
const prefs = [
  { id: 'stage', label: 'Stage changes', body: 'Every time a case moves.', inApp: true, email: false, whatsapp: false, locked: false },
  { id: 'decisions', label: 'Decisions', body: 'AIP outcome, final approval, declines.', inApp: true, email: true, whatsapp: false, locked: false },
  { id: 'money', label: 'Commission', body: 'Payable, paid, and bonus milestones.', inApp: true, email: true, whatsapp: false, locked: false },
  { id: 'urgent', label: 'Deadlines inside 48 hours', body: 'Offers expiring, queries about to hold a case, protection lapsing.', inApp: true, email: true, whatsapp: true, locked: true },
]

export function Settings() {
  const [state, setState] = useState(prefs)

  function toggle(id: string, key: 'inApp' | 'email' | 'whatsapp') {
    setState((prev) => prev.map((p) => (p.id === id && !p.locked ? { ...p, [key]: !p[key] } : p)))
  }

  return (
    <div className="page">
      <PageHead title="Profile & settings" meta={`${broker.company} · partner since ${longDate(broker.memberSince)}`} />

      <section className="card">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Chip tone="gold"><Medal size={20} weight="fill" /></Chip>
          <div className="grow">
            <h2>{tier.label} partner</h2>
            <p className="secondary text-sm" style={{ marginTop: 4 }}>
              {aed(tier.monthlyTarget, { compact: true })} a month, {aed(tier.quarterlyTarget, { compact: true })} a
              quarter, {(tier.bonusRate * 100).toFixed(2)}% quarterly bonus.
            </p>
          </div>
          <Pill tone="pill--gold">{tier.label}</Pill>
        </div>
        <div className="region">
          <p className="secondary text-sm">
            Tier is reviewed quarterly on volume and on the quality score — currently{' '}
            <strong style={{ color: 'var(--text)' }}>{broker.qualityScore}/100</strong>, against a floor of{' '}
            {broker.qualityFloor}. Quality counts declines, withdrawn cases and documents rejected on first upload,
            so volume alone will not move you up.
          </p>
        </div>
      </section>

      <section className="card">
        <SectionHead title="Your details" />
        <div className="grid-2">
          <Field label="Full name" defaultValue={broker.name} />
          <Field label="Company" defaultValue={broker.company} />
          <Field label="Email" type="email" defaultValue="omar@gulfadvisory.ae" />
          <Field label="Mobile" defaultValue="+971 50 442 1180" inputMode="tel" />
        </div>
        <div className="row-tight" style={{ marginTop: 'var(--sp-5)' }}>
          <Button size="sm">Save changes</Button>
          <Button size="sm" variant="quiet">Discard</Button>
        </div>
      </section>

      <section className="card">
        <SectionHead title="Notifications" action={<span className="text-sm secondary">In-app cannot be turned off</span>} />
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Notification channel preferences by event type.</caption>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">In-app</th>
                <th scope="col">Email</th>
                <th scope="col">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {state.map((p) => (
                <tr key={p.id}>
                  <td data-primary="true" data-label="">
                    <h3 style={{ fontSize: 'var(--text-h4)' }}>{p.label}</h3>
                    <p className="secondary text-sm">{p.body}</p>
                    {p.locked && (
                      <p className="text-xs muted row-tight" style={{ gap: 5, marginTop: 4 }}>
                        <ShieldCheck size={13} weight={ICON_WEIGHT} aria-hidden /> Always on — this is the only channel
                        that reaches you in time
                      </p>
                    )}
                  </td>
                  {(['inApp', 'email', 'whatsapp'] as const).map((k) => {
                    const Icon = k === 'inApp' ? Bell : k === 'email' ? EnvelopeSimple : WhatsappLogo
                    const label = k === 'inApp' ? 'In-app' : k === 'email' ? 'Email' : 'WhatsApp'
                    return (
                      <td key={k} data-label={label}>
                        <label className="check" style={{ alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={p[k]}
                            disabled={p.locked || k === 'inApp'}
                            onChange={() => toggle(p.id, k)}
                          />
                          <Icon size={16} weight={ICON_WEIGHT} aria-hidden />
                          <span className="sr-only">{label} for {p.label}</span>
                        </label>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <SectionHead title="Security" />
        <div className="list">
          <div className="item item--inset">
            <div className="grow">
              <h3 style={{ fontSize: 'var(--text-h4)' }}>Password</h3>
              <p className="secondary text-sm">Last changed 4 months ago.</p>
            </div>
            <Button size="sm" variant="secondary">Change password</Button>
          </div>
          <div className="item item--inset">
            <div className="grow">
              <h3 style={{ fontSize: 'var(--text-h4)' }}>Two-factor authentication</h3>
              <p className="secondary text-sm">An SMS code in addition to your password.</p>
            </div>
            <Button size="sm" variant="secondary">Turn on</Button>
          </div>
          <div className="item item--inset">
            <div className="grow">
              <h3 style={{ fontSize: 'var(--text-h4)' }}>Activity log</h3>
              <p className="secondary text-sm">Every document you viewed, uploaded or downloaded.</p>
            </div>
            <Button size="sm" variant="secondary">View log</Button>
          </div>
        </div>
      </section>

      <Callout>
        Team accounts are coming. Today one login covers {broker.company}; when you need separate access for your
        agents, your partner manager can set it up.
      </Callout>
    </div>
  )
}
