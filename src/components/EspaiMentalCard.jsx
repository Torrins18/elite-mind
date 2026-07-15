import { useTranslation } from "../i18n/LanguageContext"

export function EspaiMentalCard({ content }) {
  const { t } = useTranslation()

  if (!content) return null

  return (
    <aside className="espai-mental" aria-label={t("espaiMental.title")}>
      <p className="espai-mental__heading">
        <span aria-hidden="true">🧠</span> {t("espaiMental.title")}
      </p>
      <div className="espai-mental__card">
        <p className="espai-mental__type">
          <span aria-hidden="true">{content.emoji}</span> {content.label}
        </p>
        <p className="espai-mental__body">{content.body}</p>
      </div>
    </aside>
  )
}
