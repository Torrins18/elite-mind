import { useTranslation } from "../i18n/LanguageContext"

const ICON_SRC = "/images/zona-mental-logo-v3-transparent.png"
const LABEL = "Zona Mental+ — Psicología deportiva"

function BrandIcon() {
  return (
    <div className="brand-logo__icon" aria-hidden="true">
      <img src={ICON_SRC} alt="" decoding="async" fetchPriority="high" />
    </div>
  )
}

function Wordmark({ showSubtitle = true }) {
  const { t } = useTranslation()
  const subtitle = t("authLanding.logoSubtitle")

  return (
    <div className="brand-logo__text">
      <p className="brand-logo__title">
        <span className="brand-logo__zona">ZONA </span>
        <span className="brand-logo__accent">MENTAL+</span>
      </p>
      {showSubtitle && (
        <div className="brand-logo__subtitle-row">
          <span className="brand-logo__rule brand-logo__rule--left" aria-hidden="true" />
          <span className="brand-logo__subtitle">{subtitle}</span>
          <span className="brand-logo__rule brand-logo__rule--right" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

/** Crisp vector wordmark + raster icon (avoids blurry upscaled PNG text). */
export function BrandLogo({ variant = "bar", className = "", tone = "default" }) {
  const onDark = tone === "light" || variant === "hero-dark"
  const surface = onDark ? "dark" : "light"
  const showSubtitle = variant !== "bar" && variant !== "icon"

  const rootClass = [
    "brand-logo",
    "brand-logo--split",
    `brand-logo--${variant}`,
    `brand-logo--${surface}`,
    className,
  ]
    .filter(Boolean)
    .join(" ")

  if (variant === "icon") {
    return (
      <div className={`brand-logo brand-logo--icon ${className}`.trim()} role="img" aria-label={LABEL}>
        <BrandIcon />
      </div>
    )
  }

  return (
    <div className={rootClass} role="img" aria-label={LABEL}>
      <BrandIcon />
      <Wordmark showSubtitle={showSubtitle} />
    </div>
  )
}
