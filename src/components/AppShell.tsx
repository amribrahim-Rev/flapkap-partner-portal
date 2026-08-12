import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  SquaresFour, Plus, Briefcase, FileText, PencilSimpleLine, CreditCard, UsersThree,
  ChartPieSlice, Bell, Gear, List, X, SignOut,
} from '@phosphor-icons/react'
import { broker, liveApplications, clients, notifications } from '../lib/data'
import { tiers } from '../lib/domain'
import { Button, IconButton, ICON_INLINE, ICON_ROW, ICON_WEIGHT } from './ui'
import { ThemeToggle } from './ThemeToggle'

const openQueries = liveApplications.flatMap((a) => a.queries).filter((q) => !q.resolved).length
const docsNeedingAction = liveApplications.flatMap((a) => a.documents)
  .filter((d) => d.status === 'rejected' || d.status === 'replacement_required').length
const unread = notifications.filter((n) => !n.read).length

/**
 * Nav grouped into three sections, matching the build the client preferred.
 *
 * Grouping earns its place at ten items: an ungrouped list of ten reads as one
 * undifferentiated column, and the three groups answer genuinely different
 * questions — what am I working on, how am I doing, and my account.
 */
interface NavItem {
  to: string
  label: string
  icon: typeof SquaresFour
  count?: number
  end?: boolean
  urgent?: boolean
  dot?: boolean
}

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Overview', icon: SquaresFour, end: true },
      { to: '/new-case', label: 'New case', icon: Plus },
      { to: '/cases', label: 'Cases', icon: Briefcase, count: liveApplications.length },
      { to: '/documents', label: 'Documents', icon: FileText, count: openQueries + docsNeedingAction, urgent: true },
      { to: '/offers', label: 'Offers', icon: PencilSimpleLine, count: liveApplications.filter((a) => a.offer && !a.offer.signedAt).length },
    ],
  },
  {
    label: 'Performance',
    items: [
      { to: '/commissions', label: 'Commissions', icon: CreditCard },
      { to: '/clients', label: 'Clients', icon: UsersThree, count: clients.length },
      { to: '/reports', label: 'Reports', icon: ChartPieSlice },
    ],
  },
  {
    label: 'Partner desk',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell, dot: unread > 0 },
      { to: '/settings', label: 'Settings', icon: Gear },
    ],
  },
]

/** Breadcrumb label per route, so the topbar always says where you are. */
const crumbs: Record<string, string> = {
  '/': 'Partner desk',
  '/new-case': 'New case',
  '/cases': 'Cases',
  '/documents': 'Documents',
  '/offers': 'Offers',
  '/commissions': 'Commissions',
  '/clients': 'Clients',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
}

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const tier = tiers[broker.tier]
  const crumb = crumbs[pathname] ?? (pathname.startsWith('/cases/') ? 'Case' : 'Partner desk')

  return (
    <div className="shell">
      <div className="scrim" data-open={open} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className="sidebar" data-open={open}>
        <div className="sidebar__brand between">
          <a href="#/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="brand__badge" aria-hidden>F</span>
            <span className="brand__word">flapkap</span>
          </a>
          <IconButton label="Close menu" plain onClick={() => setOpen(false)} className="sidebar-toggle">
            <X size={ICON_ROW} weight={ICON_WEIGHT} />
          </IconButton>
        </div>

        <div className="sidebar__scroll">
          {groups.map((g) => (
            <nav className="nav" aria-label={g.label} key={g.label}>
              <p className="nav__group">{g.label}</p>
              {g.items.map(({ to, label, icon: Icon, count, end, urgent, dot }) => (
                <NavLink key={to} to={to} end={end} className="nav__item">
                  {({ isActive }) => (
                    <>
                      <Icon size={ICON_INLINE} weight={isActive ? 'fill' : ICON_WEIGHT} aria-hidden />
                      <span>{label}</span>
                      {count ? (
                        <span className="nav__count" data-urgent={urgent && count > 0 ? 'true' : undefined}>{count}</span>
                      ) : null}
                      {dot && <span className="nav__dot" aria-label="unread" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          ))}
        </div>

        {/* Identity pinned to the foot, as in the preferred build. */}
        <div className="sidebar__user">
          <span className="avatar" aria-hidden>{broker.initials}</span>
          <span className="grow">
            <span className="sidebar__user-name">{broker.name}</span>
            <span className="sidebar__user-tier">{tier.label} partner</span>
          </span>
          <IconButton label="Log out" plain onClick={() => navigate('/login')}>
            <SignOut size={ICON_INLINE} weight={ICON_WEIGHT} />
          </IconButton>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <IconButton label="Open menu" plain onClick={() => setOpen(true)} className="sidebar-toggle">
            <List size={ICON_ROW} weight={ICON_WEIGHT} />
          </IconButton>

          <nav aria-label="Breadcrumb" className="crumbs">
            <span className="crumbs__org">{broker.company}</span>
            <span aria-hidden className="crumbs__sep">/</span>
            <span className="crumbs__here">{crumb}</span>
          </nav>

          <div className="push row-tight">
            <ThemeToggle />
            <IconButton label={`Notifications, ${unread} unread`} plain onClick={() => navigate('/notifications')}>
              <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                <Bell size={ICON_ROW} weight={ICON_WEIGHT} />
                {unread > 0 && <span className="bell-dot" aria-hidden />}
              </span>
            </IconButton>
            {/* On a phone the label is the first thing to go: the icon and the
                accessible name carry it, and the width goes to the breadcrumb
                instead of colliding with it. */}
            <Button
              size="sm"
              aria-label="New case"
              icon={<Plus size={ICON_INLINE} weight="bold" aria-hidden />}
              onClick={() => navigate('/new-case')}
            >
              <span className="hide-phone">New case</span>
            </Button>
          </div>
        </div>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
