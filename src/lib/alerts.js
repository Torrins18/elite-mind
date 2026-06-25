import { daysSinceLastCheckIn, sortByDateDesc } from "./insights/metrics"
import { getLatestWeeklyReflection, hasWeeklyReflection } from "./weeklyEor"
import { isWeeklyReflectionDue } from "./checkInSchedule"

export function detectAthleteAlerts(athlete, checkIns, today) {
  const rows = sortByDateDesc((checkIns || []).filter((row) => row.athlete_id === athlete.id))
  const alerts = []

  if (!rows.length) {
    alerts.push({
      id: "no_data",
      severity: "medium",
      athleteId: athlete.id,
      athleteName: athlete.name,
    })
    return alerts
  }

  const recentDaily = rows.filter((row) => row.mood != null).slice(0, 3)
  if (recentDaily.length >= 3 && recentDaily.every((row) => row.stress >= 8)) {
    alerts.push({
      id: "stress_high_3d",
      severity: "high",
      athleteId: athlete.id,
      athleteName: athlete.name,
      value: recentDaily[0].stress,
    })
  }

  const daysSince = daysSinceLastCheckIn(rows, today)
  if (daysSince != null && daysSince >= 4) {
    alerts.push({
      id: "inactive",
      severity: daysSince >= 7 ? "high" : "medium",
      athleteId: athlete.id,
      athleteName: athlete.name,
      days: daysSince,
    })
  }

  const latestWeekly = getLatestWeeklyReflection(rows)

  if (latestWeekly?.confidence_rating != null && latestWeekly.confidence_rating < 4) {
    alerts.push({
      id: "confidence_low",
      severity: "high",
      athleteId: athlete.id,
      athleteName: athlete.name,
      value: latestWeekly.confidence_rating,
    })
  }

  if (latestWeekly?.physical_fatigue != null && latestWeekly.physical_fatigue >= 8) {
    alerts.push({
      id: "fatigue_high",
      severity: "high",
      athleteId: athlete.id,
      athleteName: athlete.name,
      value: latestWeekly.physical_fatigue,
    })
  }

  const motivationRows = rows.filter(hasWeeklyReflection).slice(0, 3)
  if (motivationRows.length >= 3) {
    const scores = motivationRows.map((row) => row.motivation_rating).filter((v) => v != null)
    if (scores.length >= 3 && scores[0] < scores[1] && scores[1] < scores[2]) {
      alerts.push({
        id: "motivation_declining",
        severity: "medium",
        athleteId: athlete.id,
        athleteName: athlete.name,
      })
    }
  }

  if (latestWeekly?.coach_communication != null && latestWeekly.coach_communication < 3) {
    alerts.push({
      id: "coach_communication_low",
      severity: "high",
      athleteId: athlete.id,
      athleteName: athlete.name,
      value: latestWeekly.coach_communication,
    })
  }

  if (latestWeekly?.group_integration != null && latestWeekly.group_integration < 3) {
    alerts.push({
      id: "team_integration_low",
      severity: "high",
      athleteId: athlete.id,
      athleteName: athlete.name,
      value: latestWeekly.group_integration,
    })
  }

  if (isWeeklyReflectionDue(rows, today) && daysSince != null && daysSince >= 7) {
    alerts.push({
      id: "weekly_overdue",
      severity: "medium",
      athleteId: athlete.id,
      athleteName: athlete.name,
    })
  }

  return alerts
}

export function buildOrgAlerts(athletes, checkIns, today) {
  return athletes.flatMap((athlete) => detectAthleteAlerts(athlete, checkIns, today))
}

export function groupAlertsBySeverity(alerts) {
  return alerts.reduce(
    (acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    },
    { high: 0, medium: 0, low: 0 }
  )
}
