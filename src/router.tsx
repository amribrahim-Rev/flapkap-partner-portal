import { createHashRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Login } from './screens/Login'
import { Dashboard } from './screens/Dashboard'
import { NewCase } from './screens/NewCase'
import { Applications } from './screens/Applications'
import { ApplicationDetail } from './screens/ApplicationDetail'
import { Documents } from './screens/Documents'
import { Offers } from './screens/Offers'
import { Commissions } from './screens/Commissions'
import { Clients } from './screens/Clients'
import { Notifications } from './screens/Notifications'
import { Settings } from './screens/Settings'
import { Reports } from './screens/Reports'
import { NotFound } from './screens/NotFound'

/* Hash routing so the build drops onto any static host — an Artifact, GitHub
   Pages, an S3 bucket — with no SPA rewrite rule to configure. */
export const router = createHashRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'new-case', element: <NewCase /> },
      { path: 'cases', element: <Applications /> },
      { path: 'cases/:id', element: <ApplicationDetail /> },
      { path: 'documents', element: <Documents /> },
      { path: 'offers', element: <Offers /> },
      { path: 'commissions', element: <Commissions /> },
      { path: 'clients', element: <Clients /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'settings', element: <Settings /> },
      { path: 'reports', element: <Reports /> },
      /* Old paths kept alive so a bookmarked link never dead-ends. */
      { path: 'applications', element: <Navigate to="/cases" replace /> },
      { path: 'new-lead', element: <Navigate to="/new-case" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
