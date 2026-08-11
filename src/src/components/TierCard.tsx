import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Fire, Medal, Sparkle, ArrowRight } from '@phosphor-icons/react'
import { broker, clients } from '../lib/data'
import { partB, tierNickname, tierOrder, tiers } from '../lib/domain'
import { aed, plural } from '../lib/format'
import { ICON_PILL, ICON_ROW } from './ui'

const tier = tiers[broker.tier]
const nextKey = tierOrder[tierOrder.indexOf(broker.tier) + 1]
const next = nextKey ? tiers[nextKey] : null

const disbursed = broker.quarter.disbursed

/* Clients who could take a top-up now, and the disbursal that represents. */
const topUpReady = clients.filter((c) => c.topUpEligibleInDays === 0)
const topUpPotential = topUpReady.reduce((s, c) => s + c.totalDisbursed, 0)
const daysLeft = Math.round(
  (new Date(broker.quarter.endsOn).getTime() - new Date('2026-08-11').getTime()) / 86_400_000,
)

/**
 * Tier card.
 *
 * The persuasive fact, and it is genuinely true of FlapKap's schedule: Part B
 * pays a percentage of the WHOLE quarter's disbursal, not just of what comes
 * after you cross a threshold. So reaching the next tier re-rates money the
 * broker has already earned. That is a far stronger motivator than "you'll earn
 * more on future deals", and it needs no exaggeration to state.
 *
 * The what-if is deliberately about VOLUME, not price. An earlier version of
 * this idea nudged brokers to raise the client's arrangement fee, which is a
 * conduct problem — this rewards bringing more deals instead, which costs the
 * client nothing.
 */
export function TierCard() {
  const [projecting, setProjecting] = useState(false)

  /* Earned so far this quarter from the volume bonus, at each rate. */
  const atCurrent = partB(disbursed, broker.tier)
  const atNext = next ? partB(disbursed, next.key) : atCurrent
  /* The re-rate: extra paid on money ALREADY disbursed, purely from the rate. */
  const reRate = atNext - atCurrent
  /* What the bonus becomes if they actually reach the next threshold. */
  const atNextFull = next ? partB(next.quarterlyTarget, next.key) : atCurrent

  const toGo = next ? Math.max(0, next.quarterlyTarget - disbursed) : 0
  const ceiling = next ? next.quarterlyTarget : tier.quarterlyTarget
  const position = Math.min(100, (disbursed / ceiling) * 100)

  const shown = projecting ? atNextFull : atCurrent

  return (
    <section className="tier card card--xl" aria-labelledby="tier-h">
      <div className="tier__head">
        <div>
          {/* The gold pill stays — it is the quick, repeatable label. The medal
              badge below is the earned object. Same colour, different jobs. */}
          <div className="row-tight wrap" style={{ marginBottom: 'var(--sp-3)' }}>
            <span className="pill pill--gold" data-tier={broker.tier}>
              <Sparkle size={ICON_PILL} weight="fill" aria-hidden /> {tier.label} tier
            </span>
            <span className="secondary text-sm">{broker.quarter.label}</span>
          </div>
          <h2 id="tier-h">{next ? `Unlock ${next.label}` : `${tier.label} secured`}</h2>
          <p className="secondary text-sm" style={{ marginTop: 6, maxWidth: '56ch' }}>
            {next ? (
              <>
                {next.label} re-rates your whole quarter, not just what comes next. The{' '}
                <strong style={{ color: 'var(--text)' }}>{aed(disbursed, { compact: true })}</strong> you have already
                disbursed gets paid again at the higher rate.
              </>
            ) : (
              <>You are at the top tier. Every dirham disbursed this quarter earns {(tier.bonusRate * 100).toFixed(2)}%.</>
            )}
          </p>
        </div>

        <div className="tier__earned">
          <p className="micro">Bonus this quarter</p>
          <p className="tier__figure" data-projecting={projecting || undefined}>
            <span className="tier__cur">AED</span>{Math.round(shown).toLocaleString('en-AE')}
          </p>
          {projecting && next && (
            <p className="text-xs" style={{ color: 'var(--success-ink)', fontWeight: 600 }}>
              +{aed(atNextFull - atCurrent)} vs today
            </p>
          )}
        </div>
      </div>

      {/* Identity, carried by the tier's own colour and an inline medal. The
          58px badge tile that used to sit here was a third gold object on one
          card — the pill above already labels the tier. */}
      <div className="tier__id">
        <div>
          <p className="micro">Your tier</p>
          <p className="tier__name row-tight" style={{ gap: 8 }}>
            <Medal size={ICON_ROW} weight="fill" color="var(--gold)" aria-hidden />
            <span style={{ color: 'var(--gold-ink)' }}>{tier.label}</span>
            <span className="secondary">· {tierNickname[broker.tier]}</span>
          </p>
          {broker.quarter.streakMonths > 1 && (
            <p className="text-sm secondary row-tight" style={{ gap: 5, marginTop: 2 }}>
              <Fire size={ICON_PILL} weight="fill" color="var(--warning)" aria-hidden />
              <strong style={{ color: 'var(--text)' }}>{plural(broker.quarter.streakMonths, 'month')}</strong>
              in a row above target
            </p>
          )}
        </div>
      </div>

      {/* The ladder. Three thresholds and where you actually are — this
          replaces both a bar and a ring, because it carries more: not just how
          far along, but what the stops are worth. */}
      <div className="ladder2" role="img"
           aria-label={`${aed(disbursed)} disbursed. ${tier.label} at ${aed(tier.quarterlyTarget)}${next ? `, ${next.label} at ${aed(next.quarterlyTarget)}` : ''}.`}>
        <div className="ladder2__stops">
          {tierOrder.map((k) => {
            const t = tiers[k]
            const left = Math.min(100, (t.quarterlyTarget / ceiling) * 100)
            const isYou = k === broker.tier
            return (
              <span
                key={k}
                className="ladder2__stop"
                data-you={isYou || undefined}
                style={{ left: `${left}%` }}
              >
                <span className="ladder2__stop-label">{t.label}{isYou ? ' — you' : ''}</span>
                <span className="ladder2__stop-value">{aed(t.quarterlyTarget, { compact: true })}</span>
              </span>
            )
          })}
        </div>
        <div className="ladder2__track">
          <span className="ladder2__fill" style={{ width: `${position}%` }} />
          <span className="ladder2__marker" style={{ left: `${position}%` }} />
        </div>
      </div>

      <div className="tier__foot">
        <p className="text-sm">
          <strong>{aed(disbursed, { compact: true })}</strong> <span className="secondary">disbursed</span>
          {next && (
            <>
              {' · '}
              <strong style={{ color: 'var(--primary-text)' }}>{aed(toGo, { compact: true })} to go</strong>
            </>
          )}
          {' · '}
          <strong>{plural(daysLeft, 'day')}</strong> <span className="secondary">left this quarter</span>
        </p>

        {next && (
          <button
            className="switch"
            role="switch"
            aria-checked={projecting}
            onClick={() => setProjecting((p) => !p)}
          >
            <span>Show me at {next.label}</span>
            <span className="switch__track" aria-hidden><span className="switch__knob" /></span>
          </button>
        )}
      </div>

      {projecting && next && (
        <div className="region tabpanel">
          <p className="text-sm secondary">
            At {next.label} the {aed(disbursed, { compact: true })} already disbursed earns{' '}
            <strong style={{ color: 'var(--success-ink)' }}>{aed(reRate)}</strong> more on its own — before any new
            deal. Reach {aed(next.quarterlyTarget, { compact: true })} and the quarter pays{' '}
            <strong style={{ color: 'var(--text)' }}>{aed(atNextFull)}</strong> instead of {aed(atCurrent)}.
          </p>
        </div>
      )}

      {/* The shortest route to the gap. A target that only states a number is a
          scoreboard; naming the cheapest available deals turns it into a plan —
          and a top-up is the cheapest disbursal a broker can write. */}
      {next && toGo > 0 && topUpReady.length > 0 && (
        <Link to="/clients" className="tier__path">
          <span className="grow">
            <span className="tier__path-lead">
              You have <strong>{plural(topUpReady.length, 'client')}</strong> ready for a top-up
            </span>
            <span className="tier__path-meta">
              About {aed(topUpPotential, { compact: true })} of disbursal — that closes{' '}
              <strong style={{ color: 'var(--success-ink) ' }}>{Math.round((topUpPotential / toGo) * 100)}%</strong>{' '}
              of the {aed(toGo, { compact: true })} you need, from clients who already know FlapKap.
            </span>
          </span>
          <ArrowRight size={ICON_PILL} weight="bold" aria-hidden />
        </Link>
      )}
    </section>
  )
}
