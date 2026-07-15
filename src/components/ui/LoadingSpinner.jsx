import { PageSkeleton } from "./PageSkeleton"

/** @deprecated Import PageSkeleton directly */
export function LoadingSpinner({ label, variant = "dashboard" }) {
  void label
  return <PageSkeleton variant={variant} />
}

export { PageSkeleton } from "./PageSkeleton"
