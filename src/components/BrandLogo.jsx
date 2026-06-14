const LOGO_SRC = "/zona-mental-logo.png"

export function BrandLogo({ variant = "bar", className = "" }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Zona Mental+"
      className={`brand-logo brand-logo--${variant} ${className}`.trim()}
    />
  )
}
