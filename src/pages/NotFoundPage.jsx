import { Link } from 'react-router-dom'
import { EmptyState } from '../components/States'

export default function NotFoundPage() {
  return (
    <div className="page">
      <EmptyState icon="🧭" title="Page not found" action={<Link to="/" className="btn-primary">Back to rooms</Link>}>
        This page doesn't exist, or it moved. Happens to the best of us.
      </EmptyState>
    </div>
  )
}
