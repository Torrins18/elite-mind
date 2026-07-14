import { LogoMark } from "./brand/LogoMark"
import { useTranslation } from "../i18n/LanguageContext"

function Wordmark({ showSubtitle = true, surface = "light" }) {
  const { t } = useTranslation()
  const subtitle = t("appEyebrow")

  return (
    <div className={`brand-logo__text brand-logo__text--${surface}`}>
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

const VARIANTS = {
  bar: { mark: 42, showSubtitle: false },
  compact: { mark: 48, showSubtitle: true },
  hero: { mark: 68, showSubtitle: true },
  icon: { mark: 48, showSubtitle: false },
}

export function BrandLogo({ variant = "bar", className = "", surface }) {
  const config = VARIANTS[variant] ?? VARIANTS.bar
  const resolvedSurface = surface ?? (variant === "hero" ? "dark" : "light")

  const rootClass = ["brand-logo", `brand-logo--${variant}`, className].filter(Boolean).join(" ")

  if (variant === "icon") {
    return <LogoMark size={config.mark} className={rootClass} surface={resolvedSurface} title="" />
  }

  return (
    <div className={rootClass} role="img" aria-label="Zona Mental+ — Psicología deportiva">
      <LogoMark size={config.mark} className="brand-logo__mark" surface={resolvedSurface} title="" />
      <Wordmark showSubtitle={config.showSubtitle} surface={resolvedSurface} />
    </div>
  )
}
