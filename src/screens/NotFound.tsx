import { Link } from 'react-router-dom'
import { Compass } from '@phosphor-icons/react'
import { EmptyState, ICON_WEIGHT } from '../components/ui'

export function NotFound() {
  return (
    <div className="page">
      <div className="card">
        <EmptyState
          level={1}
          icon={<Compass size={28} weight={ICON_WEIGHT} />}
          title="That page isn’t here"
          body="The link may be out of date. Your dashboard has everything waiting on you."
          action={<Link to="/" className="btn btn--primary">Back to dashboard</Link>}
        />
      </div>
    </div>
  )
}
