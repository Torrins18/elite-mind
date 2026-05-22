import { createContext, useContext, useEffect, useState } from "react"
import { translations, interpolate } from "./translations"

const STORAGE_KEY = "elite-mind-lang"
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === "ca" ? "ca" : "es"
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const t = (key, vars) => {
    const keys = key.split(".")
    let value = translations[lang]
    for (const k of keys) {
      value = value?.[k]
    }
    if (typeof value !== "string") return key
    return vars ? interpolate(value, vars) : value
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider")
  return ctx
}
