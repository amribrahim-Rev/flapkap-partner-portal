import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from '@phosphor-icons/react'
import { Button, Callout, Field, ICON_WEIGHT } from '../components/ui'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('omar@gulfadvisory.ae')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('That password is too short. Check it and try again.')
      return
    }
    setBusy(true)
    window.setTimeout(() => navigate('/'), 700)
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={submit} noValidate>
        <div className="brand" style={{ justifyContent: 'center', marginBottom: 'var(--sp-2)' }}>
          <span className="brand__word">FlapKap</span>
          <span className="brand__mark" aria-hidden="true" />
        </div>

        <div className="card" style={{ display: 'grid', gap: 'var(--sp-5)' }}>
          <div>
            <h1>Partner sign in</h1>
            <p className="secondary text-sm" style={{ marginTop: 6 }}>
              Access is by invitation from your FlapKap partner manager.
            </p>
          </div>

          <Field
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
            required
          />

          <div className="between">
            <label className="check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Remember me</span>
            </label>
            <a href="#forgot" className="text-sm">Forgot password?</a>
          </div>

          <Button type="submit" block loading={busy} icon={<ArrowRight size={18} weight="bold" aria-hidden />}>
            Sign in
          </Button>

          <Callout>
            <span className="row-tight" style={{ gap: 6 }}>
              <ShieldCheck size={15} weight={ICON_WEIGHT} aria-hidden />
              Every document view and download is logged against your account.
            </span>
          </Callout>
        </div>

        <p className="text-xs muted" style={{ textAlign: 'center' }}>
          Not a partner yet? Talk to the channel partnerships team.
        </p>
      </form>
    </div>
  )
}
