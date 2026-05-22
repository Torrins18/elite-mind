const LOCALES = { es: "es-ES", ca: "ca-ES" }

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(dateStr, lang = "es") {
  const locale = LOCALES[lang] || LOCALES.es
  return new Date(dateStr + "T12:00:00").toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function lastNDays(n) {
  const days = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const copy = new Date(d)
    copy.setDate(d.getDate() - i)
    days.push(copy.toISOString().slice(0, 10))
  }
  return days
}
