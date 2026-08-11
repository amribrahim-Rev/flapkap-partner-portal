import { useMemo, useState } from 'react'
import { DownloadSimple, ChartBar } from '@phosphor-icons/react'
import {
  applyFilters, byIndustry, byMonth, declineReasons, dropOff, industries,
  periods, resolveRange, stageDurations, summary, toCsv,
  type Filters, type PeriodKey,
} from '../lib/reports'
import { productLabel } from '../lib/domain'
import { aed, longDate, num, pct, plural } from '../lib/format'
import {
  Button, Callout, EmptyState, ICON_EMPTY, ICON_INLINE, ICON_WEIGHT, PageHead, SectionHead, StatStrip,
} from '../components/ui'

export function Reports() {
  const [filters, setFilters] = useState<Filters>({
    period: 'last12',
    from: '2026-01-01',
    to: '2026-08-10',
    industry: 'all',
    product: 'all',
  })

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }))

  const rows = useMemo(() => applyFilters(filters), [filters])
  const range = resolveRange(filters)
  const s = useMemo(() => summary(rows), [rows])
  const months = useMemo(() => byMonth(rows), [rows])
  const funnel = useMemo(() => dropOff(rows), [rows])
  const industryRows = useMemo(() => byIndustry(rows), [rows])
  const reasons = useMemo(() => declineReasons(rows), [rows])
  const timings = useMemo(() => stageDurations(rows), [rows])

  const peakMonth = Math.max(...months.map((m) => m.commission), 1)
  const filtered = filters.industry !== 'all' || filters.product !== 'all'

  function download() {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flapkap-cases-${range.from}-to-${range.to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <PageHead
        title="Reports"
        meta={`${longDate(range.from)} – ${longDate(range.to)} · ${plural(rows.length, 'case')}`}
        actions={
          <Button
            variant="secondary"
            onClick={download}
            disabled={rows.length === 0}
            icon={<DownloadSimple size={ICON_INLINE} weight={ICON_WEIGHT} aria-hidden />}
          >
            Export CSV
          </Button>
        }
      />

      {/* One filter bar, driving every block below. */}
      <div className="filterbar">
        <div className="filterbar__group">
          <span className="filterbar__label" id="period-label">Period</span>
          <div className="filters" role="group" aria-labelledby="period-label">
            {periods.map((p) => (
              <button
                key={p.key}
                className="filter"
                aria-pressed={filters.period === p.key}
                onClick={() => set('period', p.key as PeriodKey)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {filters.period === 'custom' && (
          <>
            <label className="filterbar__group">
              <span className="filterbar__label">From</span>
              <input className="input" type="date" value={filters.from} max={filters.to} onChange={(e) => set('from', e.target.value)} />
            </label>
            <label className="filterbar__group">
              <span className="filterbar__label">To</span>
              <input className="input" type="date" value={filters.to} min={filters.from} onChange={(e) => set('to', e.target.value)} />
            </label>
          </>
        )}

        <label className="filterbar__group">
          <span className="filterbar__label">Industry</span>
          <select className="select" value={filters.industry} onChange={(e) => set('industry', e.target.value)}>
            <option value="all">All industries</option>
            {industries.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>

        <label className="filterbar__group">
          <span className="filterbar__label">Product</span>
          <select className="select" value={filters.product} onChange={(e) => set('product', e.target.value)}>
            <option value="all">All products</option>
            <option value="short_term_loan">{productLabel.short_term_loan}</option>
            <option value="invoice_discounting">{productLabel.invoice_discounting}</option>
          </select>
        </label>

        {filtered && (
          <Button variant="quiet" size="sm" onClick={() => setFilters((f) => ({ ...f, industry: 'all', product: 'all' }))}>
            Clear filters
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ChartBar size={ICON_EMPTY} weight={ICON_WEIGHT} />}
            title="No cases in this period"
            body="Widen the dates or clear the filters. Reports count cases by the date you submitted them."
            action={<Button variant="secondary" onClick={() => setFilters((f) => ({ ...f, period: 'last12', industry: 'all', product: 'all' }))}>Reset</Button>}
          />
        </div>
      ) : (
        <>
          {/* 1. The five numbers that answer "how did this period go". */}
          <section className="card" aria-label="Summary">
            <StatStrip
              stats={[
                { label: 'Submitted', value: String(s.submitted), note: `${s.live} still live` },
                { label: 'Funded', value: String(s.funded), tone: 'success' },
                { label: 'Conversion', value: pct(s.conversion, 0), note: 'of cases that got a decision' },
                { label: 'Disbursed', value: aed(s.disbursed, { compact: true }), note: `avg ${aed(s.avgDeal, { compact: true })}` },
                { label: 'Commission earned', value: aed(s.commission), tone: 'primary', note: 'Includes deals not yet paid out' },
              ]}
            />
          </section>

          {/* 2. Earnings over time — the question a broker opens this page for. */}
          {months.length > 0 && (
            <section className="card" aria-labelledby="earnings">
              <SectionHead
                id="earnings"
                title="Commission by month"
                action={<span className="secondary text-sm">By month of disbursal</span>}
              />
              <div className="chart">
                {months.map((m) => (
                  <div className="chart__col" key={m.key} title={`${m.label}: ${aed(m.commission)} from ${plural(m.deals, 'deal')}`}>
                    <span className="chart__val">{Math.round(m.commission / 1000)}k</span>
                    <span
                      className="chart__bar"
                      style={{ height: `${Math.max(3, (m.commission / peakMonth) * 100)}%` }}
                    />
                    <span className="chart__x">{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="region">
                <p className="secondary text-sm">
                  {plural(months.length, 'month')} with a disbursal · best month{' '}
                  <strong style={{ color: 'var(--text)' }}>
                    {months.reduce((a, b) => (b.commission > a.commission ? b : a)).label} at{' '}
                    {aed(Math.max(...months.map((m) => m.commission)))}
                  </strong>
                </p>
              </div>
            </section>
          )}

          {/* 3. Where cases stop. This is the actionable one — it tells a broker
                 what to pre-screen rather than just that they lost. */}
          <section className="card" aria-labelledby="dropoff">
            <SectionHead id="dropoff" title="Where cases stop" action={<span className="secondary text-sm">Share reaching each stage</span>} />
            <div className="meter">
              {funnel.map((g) => (
                <div className="meter__row" key={g.key}>
                  <span className="text-sm">{g.label}</span>
                  <span className="meter__track">
                    <span className="meter__fill" style={{ width: `${g.share * 100}%`, background: 'var(--primary-text)' }} />
                  </span>
                  <span className="meter__num">
                    {g.reached}
                    {g.lost > 0 && <span style={{ color: 'var(--danger-text)', fontWeight: 500 }}> −{g.lost}</span>}
                  </span>
                </div>
              ))}
            </div>
            {reasons.length > 0 && (
              <div className="region">
                <h3 style={{ fontSize: 'var(--text-h4)' }}>Why they stopped</h3>
                <ul style={{ display: 'grid', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
                  {reasons.map((r) => (
                    <li key={r.reason} className="between text-sm">
                      <span className="secondary">{r.reason}</span>
                      <span className="meter__num">{plural(r.count, 'case')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 4. Which industries actually pay. Lets a broker aim rather than guess. */}
          <section aria-labelledby="industry">
            <SectionHead id="industry" title="What works for you" action={<span className="secondary text-sm">Sorted by commission</span>} />
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">Performance by industry in the selected period.</caption>
                <thead>
                  <tr>
                    <th scope="col">Industry</th>
                    <th scope="col" className="right">Submitted</th>
                    <th scope="col" className="right">Funded</th>
                    <th scope="col" className="right">Conversion</th>
                    <th scope="col" className="right">Avg deal</th>
                    <th scope="col" className="right">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {industryRows.map((r) => (
                    <tr key={r.industry}>
                      <td data-primary="true" data-label="">
                        <h3 style={{ fontSize: 'var(--text-h4)' }}>{r.industry}</h3>
                      </td>
                      <td data-label="Submitted" className="num">{r.submitted}</td>
                      <td data-label="Funded" className="num">{r.funded}</td>
                      <td data-label="Conversion" className="num">
                        <span style={{ color: r.conversion >= 0.5 ? 'var(--success-ink)' : r.conversion === 0 ? 'var(--text-muted)' : undefined }}>
                          {pct(r.conversion, 0)}
                        </span>
                      </td>
                      <td data-label="Avg deal" className="num">{r.avgDeal ? num(r.avgDeal) : <span className="muted">—</span>}</td>
                      <td data-label="Commission" className="num">{r.commission ? num(r.commission) : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. How long we take. Holds FlapKap accountable and lets the broker
                 set their client's expectations with a real number. */}
          <section className="card" aria-labelledby="timing">
            <SectionHead
              id="timing"
              title="How long each stage takes"
              action={<span className="secondary text-sm">Average {Math.round(s.avgDaysToFund)} days to funding</span>}
            />
            <div className="meter">
              {timings.map((t) => {
                const over = t.days > t.target
                return (
                  <div className="meter__row" key={t.stage}>
                    <span className="text-sm">{t.label}</span>
                    <span className="meter__track">
                      <span
                        className="meter__fill"
                        style={{
                          width: `${Math.min(100, (t.days / Math.max(...timings.map((x) => x.days), 1)) * 100)}%`,
                          background: over ? 'var(--warning)' : 'var(--success)',
                        }}
                      />
                    </span>
                    <span className="meter__num">
                      {t.days.toFixed(1)}d
                      <span className="muted" style={{ fontWeight: 400 }}> / {t.target}d</span>
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="region">
              <Callout tone={timings.some((t) => t.days > t.target) ? 'warning' : 'neutral'}>
                Measured across {plural(s.funded, 'funded case')} in this period. Amber means the stage is running
                over its usual time — worth raising with your partner manager.
              </Callout>
            </div>
          </section>

          <p className="text-xs muted">
            Cases are counted by the date you submitted them, so a period reflects your work in it rather than when
            we happened to decide. Conversion excludes cases still live. Figures are illustrative sample data.
          </p>
        </>
      )}
    </div>
  )
}
