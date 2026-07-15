import { daysBetween, weekStartSundayISO } from "../checkInSchedule"

/** First day of the default sports season (Aug 1). */
export function defaultSeasonStartDate(today) {
  const date = new Date(`${today}T12:00:00`)
  const year = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1
  return `${year}-08-01`
}

/**
 * @param {string} today ISO date
 * @param {{ season_start_date?: string } | null} [team]
 */
export function resolveSeasonStart(today, team) {
  if (team?.season_start_date) return team.season_start_date
  return defaultSeasonStartDate(today)
}

/**
 * Season week index (1-based, aligned to Sunday week boundaries).
 * @param {string} today
 * @param {string} seasonStart
 */
export function getSeasonWeekNumber(today, seasonStart) {
  const weekStart = weekStartSundayISO(today)
  const days = daysBetween(seasonStart, weekStart)
  if (days < 0) return 1
  return Math.floor(days / 7) + 1
}
