import { useTranslation } from "../i18n/LanguageContext"

export function EntrenamentMentalCard({ content }) {
  const { t } = useTranslation()

  if (!content) return null

  return (
    <aside className="entrenament-mental" aria-label={t("entrenamentMental.title")}>
      <p className="entrenament-mental__heading">
        <span aria-hidden="true">🧠</span> {t("entrenamentMental.title")}
      </p>
      <div className="entrenament-mental__card">
        <p className="entrenament-mental__topic">{content.topic.toUpperCase()}</p>
        <p className="entrenament-mental__concept">{content.concept}</p>
        {content.action ? <p className="entrenament-mental__action">{content.action}</p> : null}
        <p className="entrenament-mental__try">{content.tryThisWeek}</p>
      </div>
    </aside>
  )
}

export function TeamEntrenamentMentalPanel({ status }) {
  const { t } = useTranslation()

  if (!status) return null

  return (
    <div className="team-entrenament-mental">
      <p className="team-entrenament-mental__eyebrow">{t("entrenamentMental.psychologistTitle")}</p>
      <div className="team-entrenament-mental__body">
        <div>
          <span className="team-entrenament-mental__label">{t("entrenamentMental.currentWeek")}</span>
          <strong>{status.seasonWeek}</strong>
        </div>
        <div>
          <span className="team-entrenament-mental__label">{t("entrenamentMental.currentPhase")}</span>
          <strong>{status.phaseLabel}</strong>
        </div>
        <div>
          <span className="team-entrenament-mental__label">{t("entrenamentMental.currentTopic")}</span>
          <strong>{status.topic}</strong>
        </div>
      </div>
      <p className="team-entrenament-mental__hint">{t("entrenamentMental.psychologistHint")}</p>
    </div>
  )
}
