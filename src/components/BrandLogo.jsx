import { LogoMark } from "./brand/LogoMark"
import { useTranslation } from "../i18n/LanguageContext"

function Wordmark({ showSubtitle = true, showTagline = false, compact = false, subtitleText, taglineText, hero = false }) {
  const { t } = useTranslation()
  const subtitle = subtitleText ?? t("appEyebrow")
  const tagline = taglineText ?? t("login.tagline")

  return (
    <div className={`brand-logo__text${compact ? " brand-logo__text--compact" : ""}${hero ? " brand-logo__text--hero" : ""}`}>
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
      {showTagline && <p className="brand-logo__tagline">{tagline}</p>}
    </div>
  )
}

export function BrandLogo({ variant = "bar", className = "", tone = "default" }) {
  const rootClass = `brand-logo brand-logo--${variant}${tone === "light" ? " brand-logo--light" : ""}${variant === "hero-dark" ? " brand-logo--hero-dark" : ""} ${className}`.trim()

  if (variant === "hero-dark") {
    return (
      <div className={rootClass} role="img" aria-label="Zona Mental+ — Psicología deportiva">
        <img
          className="brand-logo__hero-image"
          src="/images/zona-mental-logo-hero.png"
          alt=""
          width={220}
          height={118}
          decoding="async"
          fetchPriority="high"
        />
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
