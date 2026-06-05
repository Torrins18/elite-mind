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

export const CHECK_IN_WINDOW_DAYS = 7

export function weekStartISO(days = CHECK_IN_WINDOW_DAYS) {
  return lastNDays(days)[0]
}

export function isDateWithinLastDays(dateStr, days = CHECK_IN_WINDOW_DAYS) {
  if (!dateStr) return false
  return dateStr >= weekStartISO(days)
}

export function countAthletesActiveThisWeek(checkIns, athleteIds, days = CHECK_IN_WINDOW_DAYS) {
  const since = weekStartISO(days)
  const active = new Set()
  for (const row of checkIns) {
    if (row.check_in_date >= since && athleteIds.includes(row.athlete_id)) {
      active.add(row.athlete_id)
    }
  }
  return active.size
}
