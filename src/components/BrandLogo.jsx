import { LogoMark } from "./brand/LogoMark"
import { useTranslation } from "../i18n/LanguageContext"

function Wordmark({ showSubtitle = true, showTagline = false, compact = false, subtitleText }) {
  const { t } = useTranslation()
  const subtitle = subtitleText ?? t("appEyebrow")

  return (
    <div className={`brand-logo__text${compact ? " brand-logo__text--compact" : ""}`}>
      <p className="brand-logo__title" aria-hidden="true">
        <span className="brand-logo__zona">ZONA </span>
        <span className="brand-logo__accent">MENTAL+</span>
      </p>
      {showSubtitle && (
        <div className="brand-logo__subtitle-row">
          <span className="brand-logo__rule brand-logo__rule--blue" aria-hidden="true" />
          <span className="brand-logo__subtitle">{subtitle}</span>
          <span className="brand-logo__rule brand-logo__rule--green" aria-hidden="true" />
        </div>
      )}
      {showTagline && (
        <p className="brand-logo__tagline">Mide · Entiende · Potencia</p>
      )}
    </div>
  )
}

export function BrandLogo({ variant = "bar", className = "", tone = "default" }) {
  const rootClass = `brand-logo brand-logo--${variant}${tone === "light" ? " brand-logo--light" : ""}${variant === "hero-dark" ? " brand-logo--hero-dark" : ""} ${className}`.trim()
  const { t } = useTranslation()

  if (variant === "hero-dark") {
    return (
      <div className={rootClass} role="img" aria-label="Zona Mental+ — Psicología deportiva">
        <LogoMark size={56} palette="hero" className="brand-logo__mark" title="" />
        <Wordmark showSubtitle subtitleText={t("authLanding.logoSubtitle")} compact />
      </div>
    )
  }

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
