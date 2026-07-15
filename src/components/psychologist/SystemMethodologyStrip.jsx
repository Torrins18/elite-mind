import { useTranslation } from "../../i18n/LanguageContext"

const PILLAR_KEYS = [
  "assessment",
  "monitoring",
  "interpretation",
  "actionPlan",
  "improvement",
]

export function SystemMethodologyStrip({ compact = false }) {
  const { t } = useTranslation()

  return (
    <section className="methodology-strip" aria-label={t("brand.pillars.title")}>
      <header className="methodology-strip__header">
        <p className="methodology-strip__system">{t("brand.systemName")}</p>
        <p className="methodology-strip__support">{t("brand.decisionSupport")}</p>
        {!compact && <p className="methodology-strip__ux">{t("brand.uxMessage")}</p>}
      </header>

      <ol className={`methodology-strip__pillars${compact ? " methodology-strip__pillars--compact" : ""}`}>
        {PILLAR_KEYS.map((key, index) => (
          <li key={key} className="methodology-strip__pillar">
            <span className="methodology-strip__num" aria-hidden="true">
              {index + 1}
            </span>
            <div className="methodology-strip__pillar-body">
              <strong>{t(`brand.pillar.${key}.title`)}</strong>
              {!compact && <p>{t(`brand.pillar.${key}.desc`)}</p>}
            </div>
          </li>
        ))}
      </ol>

      {!compact && (
        <footer className="methodology-strip__philosophy">
          <div>
            <span className="methodology-strip__philosophy-label">{t("brand.philosophy.technologyTitle")}</span>
            <span>{t("brand.philosophy.technology")}</span>
          </div>
          <div>
            <span className="methodology-strip__philosophy-label">{t("brand.philosophy.psychologistTitle")}</span>
            <span>{t("brand.philosophy.psychologist")}</span>
          </div>
        </footer>
      )}
    </section>
  )
}
