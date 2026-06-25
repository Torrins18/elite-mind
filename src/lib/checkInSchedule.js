import { hasWeeklyReflection } from "./weeklyEor"

export { hasWeeklyReflection }

export function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  return Math.floor((end - start) / 86_400_000)
}

export function isSunday(today) {
  return new Date(`${today}T12:00:00`).getDay() === 0
}

export function weekStartSundayISO(today) {
  const date = new Date(`${today}T12:00:00`)
  date.setDate(date.getDate() - date.getDay())
  return date.toISOString().slice(0, 10)
}

export function hasWeeklyReflectionThisWeek(checkIns, today) {
  const weekStart = weekStartSundayISO(today)
  return (checkIns || []).some(
    (row) => row.check_in_date >= weekStart && hasWeeklyReflection(row)
  )
}

export function getWeeklyCheckInForEdit(checkIns, today) {
  const weekStart = weekStartSundayISO(today)
  const thisWeek = (checkIns || []).find(
    (row) => row.check_in_date >= weekStart && hasWeeklyReflection(row)
  )
  if (thisWeek) return thisWeek
  return (checkIns || []).find((row) => row.check_in_date === today) || null
}

export function daysSinceLastWeeklyReflection(checkIns, today) {
  const withWeekly = (checkIns || []).filter(hasWeeklyReflection)
  if (!withWeekly.length) return null

  const latestDate = withWeekly.reduce((latest, row) => {
    if (!latest || row.check_in_date > latest) return row.check_in_date
    return latest
  }, null)

  return daysBetween(latestDate, today)
}

/** Weekly EOR is due on Sunday (if not done this week) or if 7+ days since last review. */
export function isWeeklyReflectionDue(checkIns, today) {
  const withWeekly = (checkIns || []).filter(hasWeeklyReflection)

  if (!withWeekly.length) {
    return true
  }

  const latestDate = withWeekly.reduce((latest, row) => {
    if (!latest || row.check_in_date > latest) return row.check_in_date
    return latest
  }, null)

  if (daysBetween(latestDate, today) >= 7) return true
  if (isSunday(today) && !hasWeeklyReflectionThisWeek(checkIns, today)) return true

  return false
}

/** True when the athlete completed the weekly review for the current period. */
export function isWeeklyCheckInComplete(checkIns, today) {
  return hasWeeklyReflectionThisWeek(checkIns, today)
}

/** @deprecated Use isWeeklyCheckInComplete */
export function isTodayCheckInComplete(checkIn, checkIns, today) {
  return isWeeklyCheckInComplete(checkIns, today)
}
