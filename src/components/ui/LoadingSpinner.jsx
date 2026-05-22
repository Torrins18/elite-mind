export function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading" role="status">
      <div className="loading__ring" />
      <span>{label}</span>
    </div>
  )
}
