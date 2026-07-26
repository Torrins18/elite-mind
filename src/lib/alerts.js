import { sortByDateDesc } from "./insights/metrics"
import { getLatestWeeklyReflection, hasWeeklyReflection } from "./weeklyEor"
import { daysSinceLastWeeklyReflection, isWeeklyReflectionDue } from "./checkInSchedule"
import { detectBaselineAlerts } from "./baseline"

/** Classify a detected signal as reminder (light) or notice (actionable). */
export function classifyAlertKind(alert) {
  if (!alert?.id) return "notice"
  if (alert.kind === "reminder" || alert.kind === "notice") return alert.kind

  if (alert.id === "no_data" || alert.id === "weekly_overdue") return "reminder"

  if (alert.id === "inactive") {
    const days = alert.days ?? 0
    if (alert.severity === "high" || days >= 14) return "notice"
    return "reminder"
  }

  return "notice"
}

function withKind(alert) {
  return { ...alert, kind: classifyAlertKind(alert) }
}

export function detectAthleteAlerts(athlete, checkIns, today, assessment = null) {
  const rows = sortByDateDesc((checkIns || []).filter((row) => row.athlete_id === athlete.id))
  const alerts = []

  if (!rows.filter(hasWeeklyReflection).length) {
    alerts.push(
      withKind({
        id: "no_data",
        severity: "medium",
        athleteId: athlete.id,
        athleteName: athlete.name,
      })
    )
    return alerts
  }

  const daysSince = daysSinceLastWeeklyReflection(rows, today)
  if (daysSince != null && daysSince >= 4) {
    alerts.push(
      withKind({
        id: "inactive",
        severity: daysSince >= 7 ? "high" : "medium",
        athleteId: athlete.id,
        athleteName: athlete.name,
        days: daysSince,
      })
    )
  }

  const latestWeekly = getLatestWeeklyReflection(rows)
  const hasBaseline = Boolean(assessment)

  if (hasBaseline && latestWeekly) {
    alerts.push(...detectBaselineAlerts(athlete, assessment, latestWeekly).map(withKind))
  } else if (latestWeekly) {
    if (latestWeekly.confidence_rating != null && latestWeekly.confidence_rating < 4) {
      alerts.push(
        withKind({
          id: "confidence_low",
          severity: "high",
          athleteId: athlete.id,
          athleteName: athlete.name,
          value: latestWeekly.confidence_rating,
        })
      )
    }

    if (latestWeekly.physical_fatigue != null && latestWeekly.physical_fatigue >= 8) {
      alerts.push(
        withKind({
          id: "fatigue_high",
          severity: "high",
          athleteId: athlete.id,
          athleteName: athlete.name,
          value: latestWeekly.physical_fatigue,
        })
      )
    }

    if (latestWeekly.coach_communication != null && latestWeekly.coach_communication < 3) {
      alerts.push(
        withKind({
          id: "coach_communication_low",
          severity: "high",
          athleteId: athlete.id,
          athleteName: athlete.name,
          value: latestWeekly.coach_communication,
        })
      )
    }
  }

  const motivationRows = rows.filter(hasWeeklyReflection).slice(0, 3)
  if (motivationRows.length >= 3) {
    const scores = motivationRows.map((row) => row.motivation_rating).filter((v) => v != null)
    if (scores.length >= 3 && scores[0] < scores[1] && scores[1] < scores[2]) {
      alerts.push(
        withKind({
          id: "motivation_declining",
          severity: "medium",
          athleteId: athlete.id,
          athleteName: athlete.name,
        })
      )
    }
  }

  if (latestWeekly?.pressure_management != null && latestWeekly.pressure_management >= 8) {
    alerts.push(
      withKind({
        id: "pressure_high",
        severity: "high",
        athleteId: athlete.id,
        athleteName: athlete.name,
        value: latestWeekly.pressure_management,
      })
    )
  }

  if (latestWeekly?.group_integration != null && latestWeekly.group_integration < 3) {
    alerts.push(
      withKind({
        id: "team_integration_low",
        severity: "high",
        athleteId: athlete.id,
        athleteName: athlete.name,
        value: latestWeekly.group_integration,
      })
    )
  }

  if (
    (latestWeekly?.psychologist_contact === "yes" ||
      latestWeekly?.psychologist_contact === "maybe") &&
    latestWeekly
  ) {
    alerts.push(
      withKind({
        id: "wants_psychologist_talk",
        severity: "high",
        athleteId: athlete.id,
        athleteName: athlete.name,
      })
    )
  }

  if (isWeeklyReflectionDue(rows, today) && daysSince != null && daysSince >= 7) {
    alerts.push(
      withKind({
        id: "weekly_overdue",
        severity: "medium",
        athleteId: athlete.id,
        athleteName: athlete.name,
      })
    )
  }

  return alerts
}

export function buildOrgAlerts(athletes, checkIns, today, assessmentByAthlete = {}) {
  return athletes.flatMap((athlete) =>
    detectAthleteAlerts(athlete, checkIns, today, assessmentByAthlete[athlete.id] || null)
  )
}

/** Live reminders only (not persisted). */
export function buildReminders(athletes, checkIns, today, assessmentByAthlete = {}) {
  return buildOrgAlerts(athletes, checkIns, today, assessmentByAthlete).filter(
    (alert) => alert.kind === "reminder"
  )
}

/** Actionable notices for persistence / dashboard. */
export function buildNotices(athletes, checkIns, today, assessmentByAthlete = {}) {
  return buildOrgAlerts(athletes, checkIns, today, assessmentByAthlete).filter(
    (alert) => alert.kind === "notice"
  )
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
