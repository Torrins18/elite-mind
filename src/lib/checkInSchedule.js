export function hasWeeklyReflection(checkIn) {
  if (!checkIn) return false
  return (
    checkIn.performance_rating != null ||
    checkIn.involvement_rating != null ||
    Boolean(checkIn.general_mood_words?.trim()) ||
    Boolean(checkIn.mood_change_event?.trim()) ||
    Boolean(checkIn.next_goal?.trim())
  )
}

export function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  return Math.floor((end - start) / 86_400_000)
}

/** Weekly reflection is due on first check-in of the week or if last one was 7+ days ago. */
export function isWeeklyReflectionDue(checkIns, today) {
  const withWeekly = (checkIns || []).filter(hasWeeklyReflection)
  if (withWeekly.length === 0) return true

  const latestDate = withWeekly.reduce((latest, row) => {
    if (!latest || row.check_in_date > latest) return row.check_in_date
    return latest
  }, null)

  return daysBetween(latestDate, today) >= 7
}
