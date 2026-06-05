import { useTranslation } from "../i18n/LanguageContext"

const TONE_CLASS = {
  positive: "insight-card--positive",
  neutral: "insight-card--neutral",
  warning: "insight-card--warning",
  danger: "insight-card--danger",
}

export function InsightCard({ title, insight, footer }) {
  const { t } = useTranslation()

  if (!insight?.text) return null

  return (
    <section className={`insight-card ${TONE_CLASS[insight.tone] || TONE_CLASS.neutral}`}>
      <header className="insight-card__header">
        <span className="insight-card__badge">{t("insights.badge")}</span>
        <h3>{title}</h3>
      </header>
      <p className="insight-card__text">{insight.text}</p>
      {footer && <p className="insight-card__footer">{footer}</p>}
    </section>
  )
}
