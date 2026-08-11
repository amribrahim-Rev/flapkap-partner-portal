import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ShieldCheck, Paperclip } from '@phosphor-icons/react'
import {
  Button, Field, ICON_INLINE, ICON_PILL, ICON_WEIGHT, PageHead, SelectField,
} from '../components/ui'

const INDUSTRIES = [
  'Wholesale trading', 'Food & beverage', 'Retail', 'Logistics', 'IT services',
  'Contracting', 'Healthcare', 'Manufacturing', 'Automotive parts', 'Printing', 'Other',
]

type Model = 'b2b' | 'b2c'

/** The four. Nothing else is asked for up front. */
const REQUIRED_DOCS = [
  { id: 'trade_licence', name: 'Trade licence' },
  { id: 'bank_6m', name: 'Bank statements — 6 months' },
  { id: 'vat', name: 'VAT returns — 12 months' },
  { id: 'aecb', name: 'AECB consent' },
] as const

export function NewCase() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const [company, setCompany] = useState('')
  const [sales, setSales] = useState('')
  const [years, setYears] = useState('')
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [model, setModel] = useState<Model | null>(null)
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const salesNum = Number(sales.replace(/[^\d]/g, '')) || 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (company.trim().length < 2) next.company = 'Enter the registered company name.'
    if (salesNum < 1000) next.sales = 'Enter average monthly sales in AED.'
    if (!years.trim() || Number(years) <= 0) next.years = 'How many years has it traded?'
    if (!model) next.model = 'Pick B2B or B2C.'
    if (!uploaded.trade_licence) next.trade_licence = 'The trade licence is needed to register the case.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setBusy(true)
    window.setTimeout(() => navigate('/pipeline?new=1'), 700)
  }

  return (
    <div className="page page--narrow">
      <PageHead title="New case" meta="Five details and four documents. That is the whole submission." />

      <form className="card" style={{ display: 'grid', gap: 'var(--sp-5)' }} onSubmit={submit} noValidate>
        <Field
          label="Company name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          error={errors.company}
          placeholder="Al Noor Trading LLC"
          autoComplete="off"
        />

        <div className="grid-2">
          <Field
            label="Average sales per month (AED)"
            value={sales}
            onChange={(e) => setSales(e.target.value)}
            error={errors.sales}
            placeholder="390,000"
            inputMode="numeric"
          />
          <Field
            label="Years of operation"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            error={errors.years}
            placeholder="4"
            inputMode="numeric"
          />
        </div>

        <SelectField
          label="Industry"
          value={industry}
          onChange={setIndustry}
          options={INDUSTRIES.map((v) => ({ value: v, label: v }))}
        />

        <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--sp-2)' }}>
          <legend className="field__label" style={{ padding: 0, marginBottom: 'var(--sp-2)' }}>Sells to</legend>
          <div className="segmented">
            <button type="button" aria-pressed={model === 'b2b'} onClick={() => setModel('b2b')}>B2B</button>
            <button type="button" aria-pressed={model === 'b2c'} onClick={() => setModel('b2c')}>B2C</button>
          </div>
          {errors.model && <p className="field__error">{errors.model}</p>}
        </fieldset>

        {/* The four documents, in the same box. No separate upload step. */}
        <div className="region">
          <div className="between wrap" style={{ alignItems: 'baseline' }}>
            <h2 style={{ fontSize: 'var(--text-h3)' }}>Documents</h2>
            <span className="secondary text-sm">
              {Object.values(uploaded).filter(Boolean).length} of {REQUIRED_DOCS.length}
            </span>
          </div>

          <div className="list" style={{ marginTop: 'var(--sp-4)' }}>
            {REQUIRED_DOCS.map((d) => {
              const done = !!uploaded[d.id]
              return (
                <div key={d.id} className="item item--inset">
                  <div className="grow">
                    <h3 style={{ fontSize: 'var(--text-h4)' }}>{d.name}</h3>
                    {errors[d.id] && <p className="field__error" style={{ marginTop: 4 }}>{errors[d.id]}</p>}
                  </div>
                  {done ? (
                    <span className="pill pill--done"><Check size={ICON_PILL} weight="bold" aria-hidden /> Attached</span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={<Paperclip size={ICON_PILL} weight={ICON_WEIGHT} aria-hidden />}
                      onClick={() => setUploaded((u) => ({ ...u, [d.id]: true }))}
                    >
                      Upload
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          <p className="field__hint" style={{ marginTop: 'var(--sp-3)' }}>
            The trade licence is required now. The other three can follow, but the case only reaches credit once
            all four are in.
          </p>
        </div>

        <Button type="submit" block loading={busy} icon={<ShieldCheck size={ICON_INLINE} weight="bold" aria-hidden />}>
          Register case
        </Button>

        <p className="field__hint">
          We check the company against our book before anything reaches credit. Clear the check and it is locked to
          you for 30 days.
        </p>
      </form>
    </div>
  )
}

