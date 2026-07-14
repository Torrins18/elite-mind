import { LogoMark } from "./brand/LogoMark"

function Wordmark({ showSubtitle = true, showTagline = false, compact = false }) {
  return (
    <div className={`brand-logo__text${compact ? " brand-logo__text--compact" : ""}`}>
      <p className="brand-logo__title" aria-hidden="true">
        <span className="brand-logo__zona">ZONA </span>
        <span className="brand-logo__accent">MENTAL+</span>
      </p>
      {showSubtitle && (
        <div className="brand-logo__subtitle-row">
          <span className="brand-logo__rule brand-logo__rule--blue" aria-hidden="true" />
          <span className="brand-logo__subtitle">Psicología deportiva</span>
          <span className="brand-logo__rule brand-logo__rule--green" aria-hidden="true" />
        </div>
      )}
      {showTagline && (
        <p className="brand-logo__tagline">Mide · Entiende · Potencia</p>
      )}
    </div>
  )
}

export function BrandLogo({ variant = "bar", className = "" }) {
  const rootClass = `brand-logo brand-logo--${variant} ${className}`.trim()

  if (variant === "bar") {
    return (
      <div className={rootClass} role="img" aria-label="Zona Mental+ — Psicología deportiva">
        <LogoMark size={40} className="brand-logo__mark" title="" />
        <Wordmark showSubtitle={false} compact />
      </div>
    )
  }

  if (variant === "icon") {
    return <LogoMark size={48} className={rootClass} />
  }

  const markSize = variant === "hero" ? 88 : 72
  const showTagline = variant === "hero"

  return (
    <div className={rootClass} role="img" aria-label="Zona Mental+ — Psicología deportiva">
      <LogoMark size={markSize} className="brand-logo__mark" title="" />
      <Wordmark showSubtitle showTagline={showTagline} />
    </div>
  )
}
