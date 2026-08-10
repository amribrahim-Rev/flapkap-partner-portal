import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  House, FilePlus, Rows, UsersThree, Files, Receipt, CurrencyDollar,
  ChartLine, Gear, SignOut, List, X, Bell, MagnifyingGlass, Medal,
} from '@phosphor-icons/react'
import { broker, actionRequired, liveApplications, clients, notifications } from '../lib/data'
import { tiers } from '../lib/domain'
import { IconButton, ICON_WEIGHT } from './ui'

const openQueries = liveApplications.flatMap((a) => a.queries).filter((q) => !q.resolved).length
const docsNeedingAction = liveApplications.flatMap((a) => a.documents)
  .filter((d) => d.status === 'rejected' || d.status === 'replacement_required').length
const unread = notifications.filter((n) => !n.read).length

const nav = [
  { to: '/', label: 'Dashboard', icon: House, end: true },
  { to: '/new-case', label: 'New case', icon: FilePlus },
  { to: '/cases', label: 'My cases', icon: Rows, count: liveApplications.length },
  { to: '/clients', label: 'My clients', icon: UsersThree, count: clients.length },
  { to: '/documents', label: 'Documents & queries', icon: Files, count: openQueries + docsNeedingAction, urgent: true },
  { to: '/offers', label: 'Offers', icon: Receipt, count: liveApplications.filter((a) => a.offer && !a.offer.signedAt).length },
  { to: '/commissions', label: 'Commissions', icon: CurrencyDollar },
  { to: '/reports', label: 'Reports', icon: ChartLine },
]

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  /* Close the drawer on navigation, and on Escape. */
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const tier = tiers[broker.tier]

  return (
    <div className="shell">
      <div className="scrim" data-open={open} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className="sidebar" data-open={open}>
        <div className="sidebar__brand between">
          <a href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span>
              <span className="brand__word">FlapKap</span>
              <span className="brand__sub">Partner portal</span>
            </span>
            <span className="brand__mark" aria-hidden="true" />
          </a>
          <IconButton label="Close menu" plain onClick={() => setOpen(false)} className="sidebar-toggle">
            <X size={20} weight={ICON_WEIGHT} />
          </IconButton>
        </div>

        <div className="sidebar__scroll">
          <div className="sidebar__cta">
            <button className="btn btn--primary btn--block" onClick={() => navigate('/new-case')}>
              <FilePlus size={18} weight="bold" aria-hidden /> New case
            </button>
          </div>

          <nav className="nav" aria-label="Main">
            {nav.map(({ to, label, icon: Icon, count, end, urgent }) => (
              <NavLink key={to} to={to} end={end} className="nav__item">
                {({ isActive }) => (
                  <>
                    <Icon size={20} weight={isActive ? 'fill' : ICON_WEIGHT} aria-hidden />
                    <span>{label}</span>
                    {count ? (
                      <span className="nav__count" data-urgent={urgent && count > 0 ? 'true' : undefined}>
                        {count}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <nav className="nav sidebar__foot" aria-label="Account">
            <NavLink to="/settings" className="nav__item">
              {({ isActive }) => (
                <><Gear size={20} weight={isActive ? 'fill' : ICON_WEIGHT} aria-hidden /><span>Profile &amp; settings</span></>
              )}
            </NavLink>
            <NavLink to="/login" className="nav__item">
              <SignOut size={20} weight={ICON_WEIGHT} aria-hidden /><span>Log out</span>
            </NavLink>
          </nav>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <IconButton label="Open menu" plain onClick={() => setOpen(true)} className="sidebar-toggle">
            <List size={22} weight={ICON_WEIGHT} />
          </IconButton>

          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/cases')}>
            <MagnifyingGlass size={16} weight={ICON_WEIGHT} aria-hidden /> Search clients
          </button>

          <div className="push row-tight">
            <span className="pill pill--gold" title={`${tier.label} partner`}>
              <Medal size={13} weight="fill" aria-hidden /> {tier.label}
            </span>
            <IconButton label={`Notifications, ${unread} unread`} plain onClick={() => navigate('/notifications')}>
              <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                <Bell size={20} weight={ICON_WEIGHT} />
                {unread > 0 && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute', top: -1, right: -1, width: 8, height: 8,
                      borderRadius: 999, background: 'var(--danger)',
                      boxShadow: '0 0 0 2px var(--surface-1)',
                    }}
                  />
                )}
              </span>
            </IconButton>
            <span className="avatar" aria-hidden title={broker.name}>
              {broker.initials}
            </span>
          </div>
        </div>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { actionRequired }
