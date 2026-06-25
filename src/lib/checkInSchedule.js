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

export function isDailyCheckInDone(checkIn) {
  if (!checkIn) return false
  return checkIn.mood != null && checkIn.stress != null && checkIn.energy != null
}

export function hasWeeklyReflectionThisWeek(checkIns, today) {
  const weekStart = weekStartSundayISO(today)
  return (checkIns || []).some(
    (row) => row.check_in_date >= weekStart && hasWeeklyReflection(row)
  )
}

/** Weekly EOR is due on Sunday (if not done this week) or if 7+ days since last review. */
export function isWeeklyReflectionDue(checkIns, today) {
  const withWeekly = (checkIns || []).filter(hasWeeklyReflection)

  if (!withWeekly.length) {
    return isSunday(today)
  }

  const latestDate = withWeekly.reduce((latest, row) => {
    if (!latest || row.check_in_date > latest) return row.check_in_date
    return latest
  }, null)

  if (daysBetween(latestDate, today) >= 7) return true
  if (isSunday(today) && !hasWeeklyReflectionThisWeek(checkIns, today)) return true

  return false
}

/** @deprecated Use isDailyCheckInDone + weekly helpers separately for athlete UX. */
export function isTodayCheckInComplete(checkIn, checkIns, today) {
  if (!checkIn || checkIn.check_in_date !== today) return false
  if (!isDailyCheckInDone(checkIn)) return false
  if (isWeeklyReflectionDue(checkIns, today) && !hasWeeklyReflection(checkIn)) return false
  return true
}
