import { averageMetrics, calculateRiskLevel } from "../risk"
import { CHECK_IN_WINDOW_DAYS, todayISO, weekStartISO } from "../dates"
import { hasWeeklyReflectionThisWeek } from "../checkInSchedule"

export function groupCheckInsByAthlete(checkIns) {
  return checkIns.reduce((acc, row) => {
    if (!acc[row.athlete_id]) acc[row.athlete_id] = []
    acc[row.athlete_id].push(row)
    return acc
  }, {})
}

export function sortByDateDesc(rows) {
  return [...rows].sort((a, b) => b.check_in_date.localeCompare(a.check_in_date))
}

export function trendDelta(rows, key, recentDays = 3, previousDays = 4) {
  const sorted = sortByDateDesc(rows)
  if (sorted.length < recentDays + 1) return 0

  const recent = sorted.slice(0, recentDays)
  const previous = sorted.slice(recentDays, recentDays + previousDays)
  if (!previous.length) return 0

  const avg = (list) => list.reduce((sum, row) => sum + row[key], 0) / list.length
  return Math.round((avg(recent) - avg(previous)) * 10) / 10
}

export function daysSinceLastCheckIn(rows, today = todayISO()) {
  if (!rows?.length) return null
  const latest = sortByDateDesc(rows)[0].check_in_date
  const start = new Date(`${latest}T12:00:00`)
  const end = new Date(`${today}T12:00:00`)
  return Math.floor((end - start) / 86_400_000)
}

export function summarizeTeam({ athletes, checkIns, latestByAthlete }) {
  const totalAthletes = athletes.length
  const today = todayISO()
  const checkedInThisWeek = athletes.filter((athlete) => {
    const athleteRows = checkIns.filter((row) => row.athlete_id === athlete.id)
    return hasWeeklyReflectionThisWeek(athleteRows, today)
  }).length

  const latestRows = latestByAthlete.map((row) => row.latest).filter(Boolean)
  const riskBreakdown = latestByAthlete.reduce(
    (acc, row) => {
      const level = row.latest ? row.risk : "none"
      acc[level] = (acc[level] || 0) + 1
      return acc
    },
    { low: 0, medium: 0, high: 0, none: 0 }
  )

  const teamAvg = averageMetrics(checkIns)
  const moodTrend = trendDelta(checkIns, "mood")
  const stressTrend = trendDelta(checkIns, "stress")
  const energyTrend = trendDelta(checkIns, "energy")

  const highRiskAthletes = latestByAthlete
    .filter((row) => row.risk === "high")
    .map((row) => row.athlete.name)

  const withoutRecent = latestByAthlete.filter((row) => {
    const days = daysSinceLastCheckIn(
      checkIns.filter((c) => c.athlete_id === row.athlete.id)
    )
    return days === null || days >= CHECK_IN_WINDOW_DAYS
  })

  return {
    totalAthletes,
    checkedInThisWeek,
    weekStart: weekStartISO(),
    complianceRate: totalAthletes ? checkedInThisWeek / totalAthletes : 0,
    teamAvg,
    moodTrend,
    stressTrend,
    energyTrend,
    riskBreakdown,
    highRiskAthletes,
    withoutRecentCount: withoutRecent.length,
    withoutRecentNames: withoutRecent.slice(0, 3).map((row) => row.athlete.name),
    hasData: checkIns.length > 0 && latestRows.length > 0,
  }
}

export function summarizeAthlete({ athlete, checkIns }) {
  const rows = sortByDateDesc(checkIns.filter((c) => c.athlete_id === athlete.id))
  const latest = rows[0] || null
  const risk = calculateRiskLevel(latest)
  const avg7 = averageMetrics(rows.slice(0, 7))
  const daysSince = daysSinceLastCheckIn(rows)

  const weakAreas = []
  if (latest) {
    if (latest.mood <= 4) weakAreas.push("mood")
    if (latest.stress >= 7) weakAreas.push("stress")
    if (latest.sleep_quality <= 4) weakAreas.push("sleep")
    if (latest.energy <= 4) weakAreas.push("energy")
    if (latest.focus <= 4) weakAreas.push("focus")
  }

  return {
    athleteName: athlete.name,
    latest,
    risk,
    avg7,
    daysSince,
    moodTrend: trendDelta(rows, "mood"),
    stressTrend: trendDelta(rows, "stress"),
    energyTrend: trendDelta(rows, "energy"),
    sleepTrend: trendDelta(rows, "sleep_quality"),
    focusTrend: trendDelta(rows, "focus"),
    weakAreas,
    hasRecentNotes: Boolean(latest?.personal_notes?.trim()),
    hasData: Boolean(latest),
    totalEntries: rows.length,
  }
}
