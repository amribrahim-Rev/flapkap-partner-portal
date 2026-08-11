import { Link } from 'react-router-dom'
import { BellSlash, EnvelopeSimple, WhatsappLogo, Bell, CaretRight } from '@phosphor-icons/react'
import { notifications } from '../lib/data'
import { longDate } from '../lib/format'
import {
  Callout, Chip, EmptyState, ICON_EMPTY, ICON_INLINE, ICON_PILL, ICON_WEIGHT, PageHead, Pill,
} from '../components/ui'

const channelIcon = { in_app: Bell, email: EnvelopeSimple, whatsapp: WhatsappLogo } as const
const channelName = { in_app: 'In-app', email: 'Email', whatsapp: 'WhatsApp' } as const

export function Notifications() {
  const unread = notifications.filter((n) => !n.read)

  return (
    <div className="page">
      <PageHead
        title="Notifications"
        meta={unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
      />

      {notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BellSlash size={ICON_EMPTY} weight={ICON_WEIGHT} />}
            title="Nothing to report"
            body="Stage changes, decisions, document rejections and commission payments all land here."
          />
        </div>
      ) : (
        <ul className="list">
          {notifications.map((n) => {
            const tone = n.tone === 'danger' ? 'danger' : n.tone === 'warning' ? 'warning' : n.tone === 'success' ? 'success' : 'primary'
            const Body = (
              <>
                <Chip tone={tone}><Bell size={ICON_INLINE} weight={ICON_WEIGHT} /></Chip>
                <div className="grow">
                  <div className="row-tight wrap" style={{ gap: 'var(--sp-2)' }}>
                    <h3 style={{ fontSize: 'var(--text-h4)' }}>{n.title}</h3>
                    {!n.read && <Pill tone="pill--client">New</Pill>}
                  </div>
                  <p className="secondary text-sm" style={{ marginTop: 3 }}>{n.body}</p>
                  <div className="row-tight wrap" style={{ gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
                    <span className="muted text-xs">{longDate(n.at)}</span>
                    {n.channels.map((c) => {
                      const Icon = channelIcon[c]
                      return (
                        <span key={c} className="muted text-xs row-tight" style={{ gap: 4 }} title={`Sent by ${channelName[c]}`}>
                          <Icon size={ICON_PILL} weight={ICON_WEIGHT} aria-hidden />
                          {channelName[c]}
                        </span>
                      )
                    })}
                  </div>
                </div>
                {n.href && <span className="btn-icon" aria-hidden><CaretRight size={ICON_INLINE} weight="bold" /></span>}
              </>
            )
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link to={n.href} className="item item--link" style={{ textDecoration: 'none', color: 'inherit', alignItems: 'flex-start' }}>
                    {Body}
                  </Link>
                ) : (
                  <div className="item" style={{ alignItems: 'flex-start' }}>{Body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Callout tone="info">
        <span>
          <strong>How we use each channel.</strong> Everything appears in-app. Email is for money and decisions.
          WhatsApp is reserved for things you lose inside 48 hours — so when it buzzes, it matters.
        </span>
      </Callout>
    </div>
  )
}
