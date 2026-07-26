import { calculateAge, isAdultInSpain } from "./age"
import { hasWeeklyReflection } from "./weeklyEor"

function parseDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysBetween(from, to = new Date()) {
  const a = startOfDay(from)
  const b = startOfDay(to)
  return Math.max(0, Math.round((b - a) / 86400000))
}

function weekStartsBetween(from, to = new Date()) {
  const start = startOfDay(from)
  const end = startOfDay(to)
  if (end < start) return 0
  // Count Sunday-aligned weeks covered (at least 1 if same week)
  const startSunday = new Date(start)
  startSunday.setDate(start.getDate() - start.getDay())
  const endSunday = new Date(end)
  endSunday.setDate(end.getDate() - end.getDay())
  return Math.floor((endSunday - startSunday) / (7 * 86400000)) + 1
}

/**
 * Build follow-up summary metrics for the athlete Resum tab.
 * @param {{
 *   athlete: object,
 *   checkIns?: object[],
 *   sessions?: object[],
 *   goals?: object[],
 *   alerts?: object[],
 *   today?: Date,
 * }} input
 */
export function buildAthleteFollowUpSummary({
  athlete,
  checkIns = [],
  sessions = [],
  goals = [],
  alerts = [],
  today = new Date(),
}) {
  const weeklyReviews = (checkIns || []).filter(hasWeeklyReflection)
  const sortedReviews = [...weeklyReviews].sort((a, b) =>
    String(a.check_in_date).localeCompare(String(b.check_in_date))
  )
  const firstReview = sortedReviews[0] || null
  const lastReview = sortedReviews[sortedReviews.length - 1] || null

  const assessmentAt = parseDate(athlete?.initial_assessment_completed_at)
  const firstReviewAt = firstReview ? parseDate(firstReview.check_in_date) : null
  const followUpStart = assessmentAt || firstReviewAt

  const expectedWeeks = followUpStart ? weekStartsBetween(followUpStart, today) : 0
  const completedReviews = weeklyReviews.length
  const adherencePct =
    expectedWeeks > 0
      ? Math.min(100, Math.round((completedReviews / expectedWeeks) * 100))
      : null

  const activePlans = (goals || []).filter((goal) => goal.status === "active").length
  const pendingAlerts = (alerts || []).filter((alert) =>
    (alert.kind || "notice") === "notice" &&
    (alert.status === "active" || alert.status === "monitoring")
  ).length

  const age = athlete?.date_of_birth ? calculateAge(athlete.date_of_birth, today) : null
  const isMinor =
    athlete?.date_of_birth && !isAdultInSpain(athlete.date_of_birth, today)

  return {
    followUpStart,
    lastReviewAt: lastReview ? parseDate(lastReview.check_in_date) : null,
    lastReviewDaysAgo: lastReview
      ? daysBetween(parseDate(lastReview.check_in_date), today)
      : null,
    completedReviews,
    adherencePct,
    sessionCount: (sessions || []).length,
    activePlans,
    pendingAlerts,
    age,
    isMinor,
    hasReviews: completedReviews > 0,
    hasSessions: (sessions || []).length > 0,
    hasActivePlans: activePlans > 0,
  }
}

export function formatRelativeDaysAgo(days, t) {
  if (days == null) return null
  if (days === 0) return t("athleteFile.summary.today")
  if (days === 1) return t("athleteFile.summary.yesterday")
  return t("athleteFile.summary.daysAgo", { count: days })
}

export function formatMonthYear(date, lang = "ca") {
  if (!date) return null
  return date.toLocaleDateString(lang === "ca" ? "ca-ES" : "es-ES", {
    month: "long",
    year: "numeric",
  })
}

export function formatAlertCriterion(alert, t) {
  if (!alert) return null
  const ctx = alert.context || {}
  const value = alert.value ?? ctx.value
  const days = alert.days ?? ctx.days
  const baseline = alert.baseline ?? ctx.baseline
  const delta = alert.delta ?? ctx.delta

  if (days != null && value != null) {
    return t("athleteFile.alertCriterion.daysValue", { days, value })
  }
  if (delta != null && baseline != null) {
    return t("athleteFile.alertCriterion.deltaBaseline", { delta, baseline })
  }
  if (value != null) {
    return t("athleteFile.alertCriterion.value", { value })
  }
  if (days != null) {
    return t("athleteFile.alertCriterion.days", { days })
  }
  return t("athleteFile.alertCriterion.generic")
}
