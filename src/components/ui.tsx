import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { WarningCircle, CaretDown, Info, Warning, CheckCircle } from '@phosphor-icons/react'

/* One icon family, one weight, everywhere. Never a unicode glyph. */
export const ICON_WEIGHT = 'regular' as const

/* ---------------- Button ---------------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'sm'
  block?: boolean
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary', size = 'md', block, loading, icon, children, className, ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'btn', `btn--${variant}`,
        size === 'sm' ? 'btn--sm' : '',
        block ? 'btn--block' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  plain?: boolean
}

/** Icon-only control. The accessible name is required, not optional. */
export function IconButton({ label, plain, children, className, ...rest }: IconButtonProps) {
  return (
    <button
      className={['btn-icon', plain ? 'btn-icon--plain' : '', className ?? ''].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------------- Status ---------------- */

export function Pill({ tone, children, noDot }: { tone: string; children: ReactNode; noDot?: boolean }) {
  return <span className={`pill ${tone}${noDot ? ' pill--no-dot' : ''}`}>{children}</span>
}

/**
 * Countdown. Deliberately not animated — the broker sees these on every
 * visit, and per the animation frequency table anything seen constantly
 * gets no motion at all.
 */
export function Clock({ tone, children }: { tone: 'urgent' | 'soon' | 'calm'; children: ReactNode }) {
  return (
    <span className={`clock clock--${tone}`} aria-live="polite">
      {children}
    </span>
  )
}

export function Chip({
  tone = 'neutral', size = 'md', children,
}: { tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'gold'; size?: 'md' | 'lg'; children: ReactNode }) {
  return (
    <span className={`chip${tone !== 'neutral' ? ` chip--${tone}` : ''}${size === 'lg' ? ' chip--lg' : ''}`} aria-hidden="true">
      {children}
    </span>
  )
}

/* ---------------- Progress ---------------- */

export function Progress({
  value, max = 100, tone = 'primary', large, label,
}: { value: number; max?: number; tone?: 'primary' | 'gold' | 'success'; large?: boolean; label: string }) {
  const pctValue = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className={`progress${large ? ' progress--lg' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pctValue)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        className={`progress__fill${tone !== 'primary' ? ` progress__fill--${tone}` : ''}`}
        style={{ width: `${pctValue}%` }}
      />
    </div>
  )
}

/**
 * Donut — proportion as a ring.
 *
 * Paired with a bar rather than replacing one: the bar carries the absolute
 * figures, the ring carries the share. Sweeps in once on mount, which is the
 * dashboard's one authored moment.
 */
export function Donut({
  value, max, caption, label,
}: { value: number; max: number; caption: string; label: string }) {
  const R = 74
  const STROKE = 13
  const C = 2 * Math.PI * R
  const pctValue = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const offset = C * (1 - pctValue / 100)
  return (
    <div className="donut" role="img" aria-label={`${label}: ${pctValue.toFixed(1)}%`}>
      <svg viewBox="0 0 172 172" aria-hidden="true">
        <circle className="donut__track" cx="86" cy="86" r={R} strokeWidth={STROKE} />
        <circle
          className="donut__fill"
          cx="86" cy="86" r={R} strokeWidth={STROKE}
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ ['--circumference' as string]: `${C}` }}
        />
      </svg>
      <div className="donut__center">
        <span className="donut__pct">{pctValue.toFixed(1)}%</span>
        <span className="donut__caption">{caption}</span>
      </div>
    </div>
  )
}

/**
 * Gauge — a progress bar that says where you are, not just how full it is.
 * The fill ends in a marker with the achieved figure above it, so the number
 * and its position are the same piece of information.
 */
export function Gauge({
  value, max, valueLabel, caption, startLabel, endLabel, label,
}: {
  value: number
  max: number
  valueLabel: string
  caption?: string
  startLabel: string
  endLabel: string
  label: string
}) {
  const raw = max > 0 ? (value / max) * 100 : 0
  const pctValue = Math.max(0, Math.min(100, raw))
  /* Keep the floating label inside the card at both extremes. */
  const anchor = Math.max(9, Math.min(91, pctValue))
  return (
    <div>
      <div className="gauge">
        <div
          className="gauge__track"
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.round(pctValue)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="gauge__fill" style={{ width: `${pctValue}%` }} />
          <span className="gauge__here" style={{ left: `${anchor}%` }}>
            <span className="gauge__label">
              <b>{valueLabel}</b>
              {caption && <span>{caption}</span>}
            </span>
            <span className="gauge__dot" />
          </span>
        </div>
      </div>
      <div className="gauge__ends">
        <span className="muted">{startLabel}</span>
        <span className="secondary">{endLabel}</span>
      </div>
    </div>
  )
}

/* ---------------- Stat strip ----------------
   Deliberately not four identical cards. One surface, figures divided by
   rules — a table of numbers rather than the hero-metric template. */

export interface Stat {
  label: string
  value: string
  note?: string
  tone?: 'default' | 'muted' | 'success' | 'primary'
}

export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="stats">
      {stats.map((s) => (
        <div className="stats__cell" key={s.label}>
          <dt className="stats__label">{s.label}</dt>
          <dd
            className="stats__value"
            style={{
              margin: 0,
              color:
                s.tone === 'muted' ? 'var(--text-muted)'
                : s.tone === 'success' ? 'var(--success)'
                : s.tone === 'primary' ? 'var(--primary-text)'
                : undefined,
            }}
          >
            {s.value}
          </dd>
          {s.note && <p className="stats__note">{s.note}</p>}
        </div>
      ))}
    </dl>
  )
}

/* ---------------- Callout ---------------- */

export function Callout({
  tone = 'neutral', children,
}: { tone?: 'neutral' | 'info' | 'warning' | 'danger'; children: ReactNode }) {
  const Glyph = tone === 'danger' ? WarningCircle : tone === 'warning' ? Warning : tone === 'info' ? Info : CheckCircle
  const color =
    tone === 'danger' ? 'var(--danger)' : tone === 'warning' ? 'var(--warning)'
    : tone === 'info' ? 'var(--primary-text)' : 'var(--text-muted)'
  return (
    <div className={`callout${tone !== 'neutral' ? ` callout--${tone}` : ''}`}>
      <Glyph size={18} color={color} weight={ICON_WEIGHT} aria-hidden />
      <div>{children}</div>
    </div>
  )
}

/* ---------------- Fields ---------------- */

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  suffix?: string
}

/** Every input gets a real bound label. No placeholder-as-label. */
export function Field({ label, hint, error, id, suffix, ...rest }: FieldProps) {
  const auto = useId()
  const fieldId = id ?? auto
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errId = error ? `${fieldId}-err` : undefined
  return (
    <div className="field">
      <label className="field__label" htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
        {...rest}
      />
      {suffix && <p className="field__hint">{suffix}</p>}
      {hint && !error && <p className="field__hint" id={hintId}>{hint}</p>}
      {error && (
        <p className="field__error" id={errId}>
          <WarningCircle size={14} weight={ICON_WEIGHT} aria-hidden /> {error}
        </p>
      )}
    </div>
  )
}

export function SelectField({
  label, options, id, value, onChange, hint,
}: {
  label: string
  options: { value: string; label: string }[]
  id?: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <div className="field">
      <label className="field__label" htmlFor={fieldId}>{label}</label>
      <div className="select-wrap">
        <select id={fieldId} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <CaretDown size={16} weight={ICON_WEIGHT} aria-hidden />
      </div>
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  )
}

/* ---------------- Empty and loading ---------------- */

export function EmptyState({
  icon, title, body, action, level = 3,
}: { icon: ReactNode; title: string; body: string; action?: ReactNode; level?: 1 | 2 | 3 }) {
  /* When an empty state IS the page, its title must be the page's h1 —
     otherwise the document has no outline at all. */
  const Heading = (`h${level}` as 'h1' | 'h2' | 'h3')
  return (
    <div className="empty">
      <Chip tone="primary" size="lg">{icon}</Chip>
      <Heading style={{ fontSize: 'var(--text-h3)' }}>{title}</Heading>
      <p>{body}</p>
      {action && <div style={{ marginTop: 'var(--sp-2)' }}>{action}</div>}
    </div>
  )
}

/** Skeletons match the shape of what is loading. Never a centred spinner. */
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="list" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div className="item" key={i} style={{ gap: 'var(--sp-4)' }}>
          <span className="skeleton" style={{ width: 40, height: 40, borderRadius: 999, flex: '0 0 40px' }} />
          <span className="grow" style={{ display: 'grid', gap: 8 }}>
            <span className="skeleton" style={{ width: '38%', height: 14 }} />
            <span className="skeleton" style={{ width: '62%', height: 12 }} />
          </span>
          <span className="skeleton" style={{ width: 84, height: 24, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  )
}

/* ---------------- Page furniture ---------------- */

export function PageHead({
  title, meta, actions,
}: { title: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page__head">
      <div>
        <h1>{title}</h1>
        {meta && <p className="secondary text-sm" style={{ marginTop: 6 }}>{meta}</p>}
      </div>
      {actions && <div className="row-tight wrap">{actions}</div>}
    </header>
  )
}

export function SectionHead({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="between" style={{ alignItems: 'baseline', marginBottom: 'var(--sp-4)' }}>
      <h2 id={id}>{title}</h2>
      {action}
    </div>
  )
}
