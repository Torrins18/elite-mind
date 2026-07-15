const LOGO_SRC = "/images/zona-mental-logo-v2-transparent.png"
const LABEL = "Zona Mental+ — Psicología deportiva"

/** Official brand logo — transparent PNG v2 (red/grey/white). */
export function BrandLogo({ variant = "bar", className = "", tone = "default" }) {
  const onDark = tone === "light" || variant === "hero-dark"
  const rootClass = [
    "brand-logo",
    `brand-logo--${variant}`,
    onDark ? "brand-logo--on-dark" : "brand-logo--on-light",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <img
      className={rootClass}
      src={LOGO_SRC}
      alt={LABEL}
      decoding="async"
      fetchPriority={variant === "hero-dark" ? "high" : undefined}
    />
  )
}
