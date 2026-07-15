const LOGO_LIGHT = "/images/zona-mental-logo-v3-transparent.png"
const LOGO_DARK = "/images/zona-mental-logo-v3-on-dark.png"
const LABEL = "Zona Mental+ — Psicología deportiva"

/** Official brand logo — transparent PNG (green triangle mark). */
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
      src={onDark ? LOGO_DARK : LOGO_LIGHT}
      alt={LABEL}
      decoding="async"
      fetchPriority={variant === "hero-dark" ? "high" : undefined}
    />
  )
}
