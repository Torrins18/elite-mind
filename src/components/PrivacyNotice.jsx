import { useTranslation } from "../i18n/LanguageContext"

export function PrivacyNotice() {
  const { t } = useTranslation()

  return (
    <aside className="privacy-notice" aria-label={t("privacy.title")}>
      <p className="privacy-notice__title">{t("privacy.title")}</p>
      <ul>
        <li>{t("privacy.athleteData")}</li>
        <li>{t("privacy.coachView")}</li>
        <li>{t("privacy.psychologistView")}</li>
        <li>{t("privacy.minors")}</li>
        <li>{t("privacy.cadence")}</li>
      </ul>
    </aside>
  )
}
