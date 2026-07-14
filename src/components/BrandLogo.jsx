import { LogoMark } from "./brand/LogoMark"
import { useTranslation } from "../i18n/LanguageContext"

function Wordmark({ showSubtitle = true, compact = false, subtitleText }) {
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
          <span className="brand-logo__rule brand-logo__rule--left" aria-hidden="true" />
          <span className="brand-logo__subtitle">{subtitle}</span>
          <span className="brand-logo__rule brand-logo__rule--right" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

const VARIANTS = {
  bar: { mark: 40, showSubtitle: false, compact: true, markPalette: "brand" },
  compact: { mark: 44, showSubtitle: true, compact: false, markPalette: "brand" },
  hero: { mark: 72, showSubtitle: true, compact: false, markPalette: "light" },
  icon: null,
}

export function BrandLogo({ variant = "bar", className = "", tone = "default" }) {
  const config = VARIANTS[variant] ?? VARIANTS.bar
  const isLight = tone === "light" || variant === "hero"
  const markPalette = isLight ? "light" : config?.markPalette ?? "brand"

  const rootClass = [
    "brand-logo",
    `brand-logo--${variant}`,
    "brand-logo--horizontal",
    isLight ? "brand-logo--light" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  if (variant === "icon") {
    return <LogoMark size={48} className={rootClass} palette={markPalette} title="" />
  }

  return (
    <div className={rootClass} role="img" aria-label="Zona Mental+ — Psicología deportiva">
      <LogoMark size={config.mark} className="brand-logo__mark" palette={markPalette} title="" />
      <Wordmark showSubtitle={config.showSubtitle} compact={config.compact} />
    </div>
  )
}
