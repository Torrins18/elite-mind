import { Component } from "react"
import { translations, interpolate } from "../i18n/translations"

const STORAGE_KEY = "elite-mind-lang"

function t(key, vars) {
  const lang = localStorage.getItem(STORAGE_KEY) === "ca" ? "ca" : "es"
  const keys = key.split(".")
  let value = translations[lang]
  for (const k of keys) {
    value = value?.[k]
  }
  if (typeof value !== "string") return key
  return vars ? interpolate(value, vars) : value
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="auth-page">
          <div className="card setup-hint" style={{ maxWidth: 520 }}>
            <h2>{t("brand.microcopy.appError")}</h2>
            <p className="type-body">{t("brand.microcopy.appErrorHint")}</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => window.location.reload()}
            >
              {t("brand.microcopy.reload")}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
