const LOGO_SRC = "/images/zona-mental-logo-transparent.png"
const LABEL = "Zona Mental+ — Psicología deportiva"

/** Official brand logo — single transparent PNG, works on light and dark backgrounds. */
export function BrandLogo({ variant = "bar", className = "" }) {
  const rootClass = ["brand-logo", `brand-logo--${variant}`, className].filter(Boolean).join(" ")

  return (
    <img
      className={rootClass}
      src={LOGO_SRC}
      alt={LABEL}
      decoding="async"
      fetchPriority={variant === "hero" ? "high" : undefined}
    />
  )
}
