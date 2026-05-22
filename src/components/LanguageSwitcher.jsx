import { useTranslation } from "../i18n/LanguageContext"

export function LanguageSwitcher() {
  const { lang, setLang, t } = useTranslation()

  return (
    <div className="lang-switcher" role="group" aria-label="Idioma">
      <button
        type="button"
        className={lang === "es" ? "lang-switcher__btn active" : "lang-switcher__btn"}
        onClick={() => setLang("es")}
      >
        {t("lang.es")}
      </button>
      <button
        type="button"
        className={lang === "ca" ? "lang-switcher__btn active" : "lang-switcher__btn"}
        onClick={() => setLang("ca")}
      >
        {t("lang.ca")}
      </button>
    </div>
  )
}
