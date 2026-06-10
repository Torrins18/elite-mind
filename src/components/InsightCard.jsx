import { useTranslation } from "../i18n/LanguageContext"

const TONE_CLASS = {
  positive: "insight-card--positive",
  neutral: "insight-card--neutral",
  warning: "insight-card--warning",
  danger: "insight-card--danger",
}

export function InsightCard({ title, insight, footer, loading = false, source }) {
  const { t } = useTranslation()

  const badge =
    source === "ai"
      ? `${t("insights.badge")} · ${t("insights.aiLabel")}`
      : t("insights.badge")

  const resolvedFooter =
    source === "ai" || source === "synthesis" ? t("insights.footerEnhanced") : footer

  if (loading) {
    return (
      <section className="insight-card insight-card--loading">
        <header className="insight-card__header">
          <span className="insight-card__badge">{badge}</span>
          <h3>{title}</h3>
        </header>
        <p className="insight-card__text insight-card__text--muted">{t("insights.loading")}</p>
      </section>
    )
  }

  if (!insight?.text) return null

  return (
    <section className={`insight-card ${TONE_CLASS[insight.tone] || TONE_CLASS.neutral}`}>
      <header className="insight-card__header">
        <span className="insight-card__badge">{badge}</span>
        <h3>{title}</h3>
      </header>
      <p className="insight-card__text">{insight.text}</p>
      {resolvedFooter && <p className="insight-card__footer">{resolvedFooter}</p>}
    </section>
  )
}
