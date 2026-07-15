import { Skeleton, SkeletonText } from "./Skeleton"

export function PageSkeleton({ variant = "dashboard" }) {
  if (variant === "athlete") {
    return (
      <div className="page-skeleton page-skeleton--athlete" aria-busy="true" aria-live="polite">
        <Skeleton variant="title" width="70%" />
        <SkeletonText lines={2} />
        <Skeleton variant="button" width="100%" style={{ maxWidth: 320, height: 52 }} />
        <Skeleton variant="text" width="40%" />
      </div>
    )
  }

  if (variant === "minimal") {
    return (
      <div className="page-skeleton" aria-busy="true" aria-live="polite">
        <Skeleton variant="title" width="220px" />
        <Skeleton variant="card" />
      </div>
    )
  }

  return (
    <div className="page-skeleton" aria-busy="true" aria-live="polite">
      <div className="page-skeleton__row">
        <Skeleton variant="title" width="240px" />
      </div>
      <div className="page-skeleton__grid page-skeleton__grid--cards">
        <Skeleton variant="card" style={{ minHeight: 96 }} />
        <Skeleton variant="card" style={{ minHeight: 96 }} />
        <Skeleton variant="card" style={{ minHeight: 96 }} />
      </div>
      <Skeleton variant="card" style={{ minHeight: 220 }} />
      <Skeleton variant="card" style={{ minHeight: 180 }} />
    </div>
  )
}

/** @deprecated Use PageSkeleton — kept for import compatibility */
export function LoadingSpinner({ variant = "dashboard" }) {
  return <PageSkeleton variant={variant} />
}
