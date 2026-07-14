import { todayISO } from "./dates"
import { weekStartSundayISO } from "./checkInSchedule"
import { hasWeeklyReflection } from "./weeklyEor"

function weekStartWeeksAgo(today, weeksAgo) {
  const date = new Date(`${today}T12:00:00`)
  date.setDate(date.getDate() - date.getDay() - weeksAgo * 7)
  return date.toISOString().slice(0, 10)
}

function addDaysISO(dateStr, days) {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Weekly compliance % for the last N weeks (Sunday–Saturday). */
export function buildWeeklyComplianceTrend(checkIns, athleteIds, weekCount = 8, today = todayISO()) {
  if (!athleteIds.length) return []

  const rows = []
  for (let weeksAgo = weekCount - 1; weeksAgo >= 0; weeksAgo -= 1) {
    const weekStart = weekStartWeeksAgo(today, weeksAgo)
    const weekEnd = addDaysISO(weekStart, 6)
    const active = new Set()

    for (const row of checkIns || []) {
      if (
        athleteIds.includes(row.athlete_id) &&
        hasWeeklyReflection(row) &&
        row.check_in_date >= weekStart &&
        row.check_in_date <= weekEnd
      ) {
        active.add(row.athlete_id)
      }
    }

    const done = active.size
    const total = athleteIds.length
    rows.push({
      weekDate: weekStart,
      compliance: total ? Math.round((done / total) * 100) : 0,
      done,
      total,
    })
  }

  return rows
}

/** Current week compliance snapshot. */
export function currentWeekCompliance(checkIns, athleteIds, today = todayISO()) {
  const weekStart = weekStartSundayISO(today)
  const weekEnd = addDaysISO(weekStart, 6)
  const active = new Set()

  for (const row of checkIns || []) {
    if (
      athleteIds.includes(row.athlete_id) &&
      hasWeeklyReflection(row) &&
      row.check_in_date >= weekStart &&
      row.check_in_date <= weekEnd
    ) {
      active.add(row.athlete_id)
    }
  }

  const done = active.size
  const total = athleteIds.length
  return {
    done,
    total,
    pct: total ? Math.round((done / total) * 100) : 0,
  }
}
