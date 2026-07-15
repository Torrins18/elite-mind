import { todayISO, weekStartISO } from "./dates"
import { calculateRiskLevel } from "./risk"
import { hasWeeklyReflection } from "./weeklyEor"
import {
  aggregateWeeklyEorTrend,
  getLatestWeeklyTeamSnapshot,
  getPreviousWeeklyTeamSnapshot,
} from "./coachTeamAnalytics"
import { summarizeTeam } from "./insights/metrics"

function average(values) {
  const nums = values.filter((value) => value != null && !Number.isNaN(value))
  if (!nums.length) return null
  return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 10) / 10
}

function delta(current, previous) {
  if (current == null || previous == null) return 0
  return Math.round((current - previous) * 10) / 10
}

function daysSinceDate(dateStr, today = todayISO()) {
  if (!dateStr) return null
  const start = new Date(`${dateStr}T12:00:00`)
  const end = new Date(`${today}T12:00:00`)
  return Math.floor((end - start) / 86_400_000)
}

function getTeamAvgEnergy(teamCheckIns, latestWeekDate, previousWeekDate) {
  const energyFromWeek = (weekDate) => {
    if (!weekDate) return null
    const weekRows = teamCheckIns.filter(
      (row) => row.check_in_date === weekDate && hasWeeklyReflection(row)
    )
    const weeklyEnergy = average(weekRows.map((row) => row.weekly_energy))
    if (weeklyEnergy != null) return weeklyEnergy
    return average(weekRows.map((row) => row.energy))
  }

  const latest = energyFromWeek(latestWeekDate)
  if (latest != null) return { current: latest, previous: energyFromWeek(previousWeekDate) }

  const recent = teamCheckIns.filter((row) => row.check_in_date >= weekStartISO())
  return { current: average(recent.map((row) => row.energy)), previous: null }
}

function getLastReviewDays(teamCheckIns, today = todayISO()) {
  const weeklyRows = teamCheckIns.filter(hasWeeklyReflection)
  if (!weeklyRows.length) return null

  const latestDate = weeklyRows
    .map((row) => row.check_in_date)
    .sort((a, b) => b.localeCompare(a))[0]

  return daysSinceDate(latestDate, today)
}

export function scoreLevel(value) {
  if (value == null) return "neutral"
  if (value >= 7) return "good"
  if (value >= 5) return "watch"
  return "risk"
}

export function getTrendDirection(value) {
  if (value == null || Math.abs(value) < 0.2) return "stable"
  return value > 0 ? "up" : "down"
}

export const TEAM_STATUS_PRIORITY = {
  critical: 0,
  observation: 1,
  watch: 2,
  stable: 3,
  unknown: 4,
}

export function calculateTeamClinicalStatus({
  alertCount,
  highRiskCount,
  mediumRiskCount,
  complianceRate,
  pending,
  athleteCount,
  mental,
  wellbeing,
  social,
  mentalDelta,
  wellbeingDelta,
  socialDelta,
  hasEorData,
}) {
  if (!athleteCount) return "unknown"

  const declining =
    mentalDelta <= -0.5 || wellbeingDelta <= -0.5 || socialDelta <= -0.5
  const softDecline =
    mentalDelta <= -0.3 || wellbeingDelta <= -0.3 || socialDelta <= -0.3
  const lowScores = [mental, wellbeing, social].some((value) => value != null && value < 4.5)
  const weakScores = [mental, wellbeing, social].some((value) => value != null && value < 6)

  if (
    alertCount >= 2 ||
    highRiskCount >= 2 ||
    (alertCount >= 1 && complianceRate < 0.6) ||
    lowScores
  ) {
    return "critical"
  }

  if (
    alertCount >= 1 ||
    highRiskCount >= 1 ||
    complianceRate < 0.5 ||
    (pending > 0 && pending >= Math.ceil(athleteCount * 0.4)) ||
    declining
  ) {
    return "observation"
  }

  if (
    pending > 0 ||
    complianceRate < 0.75 ||
    mediumRiskCount >= 2 ||
    weakScores ||
    softDecline ||
    !hasEorData
  ) {
    return "watch"
  }

  return "stable"
}

export function calculateTeamHealthScore({
  metrics,
  complianceRate,
  alertCount,
  highRiskCount,
  trend,
}) {
  const metricValues = [
    metrics.mental?.value,
    metrics.wellbeing?.value,
    metrics.energy?.value,
    metrics.coachCommunication?.value,
  ].filter((value) => value != null)

  const metricScore = metricValues.length
    ? (metricValues.reduce((sum, value) => sum + value, 0) / metricValues.length) * 10
    : 50

  const complianceScore = complianceRate * 100
  const deltas = [
    trend.mentalDelta,
    trend.wellbeingDelta,
    trend.energyDelta,
    trend.coachDelta,
    trend.socialDelta,
  ].filter((value) => value != null)

  const avgDelta = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0
  let trendAdj = 0
  if (avgDelta > 0.25) trendAdj = 6
  else if (avgDelta < -0.25) trendAdj = -10

  const penalty = alertCount * 9 + highRiskCount * 7
  const raw = metricScore * 0.52 + complianceScore * 0.38 + trendAdj - penalty
  const score = Math.max(0, Math.min(100, Math.round(raw)))

  let label = "healthy"
  if (score < 55) label = "priority"
  else if (score < 75) label = "monitoring"

  return { score, label }
}

export function buildTeamAlertFactors(overview) {
  const factors = []
  const { metrics, complianceRate, alertCount, pending, trend, athleteCount } = overview

  if (metrics.mental.value != null && metrics.mental.value < 5) {
    factors.push({ key: "mentalLow" })
  }
  if (metrics.wellbeing.value != null && metrics.wellbeing.value < 5) {
    factors.push({ key: "wellbeingLow" })
  }
  if (metrics.energy.value != null && metrics.energy.value < 5) {
    factors.push({ key: "energyLow" })
  }
  if (athleteCount > 0 && complianceRate < 0.6) {
    factors.push({ key: "lowParticipation", pct: Math.round(complianceRate * 100) })
  }
  if (alertCount > 0) {
    factors.push({ key: "unresolvedAlerts", count: alertCount })
  }
  if (trend.mentalDelta <= -0.5) {
    factors.push({ key: "mentalDeclining", delta: Math.abs(trend.mentalDelta) })
  }
  if (pending >= 2) {
    factors.push({ key: "pendingReviews", count: pending })
  }

  return factors.slice(0, 4)
}

function buildMetric(value, metricDelta) {
  const direction = getTrendDirection(metricDelta)
  return {
    value,
    level: scoreLevel(value),
    delta: metricDelta,
    direction,
  }
}

export function buildTeamClinicalOverview(teams, athletes, checkIns, alerts) {
  const alertCounts = {}
  for (const alert of alerts || []) {
    if (alert.status !== "active") continue
    const athlete = athletes.find((row) => row.id === alert.athleteId)
    if (athlete?.team_id) {
      alertCounts[athlete.team_id] = (alertCounts[athlete.team_id] || 0) + 1
    }
  }

  return teams.map((team) => {
    const teamAthletes = athletes.filter((row) => row.team_id === team.id)
    const ids = new Set(teamAthletes.map((row) => row.id))
    const teamCheckIns = checkIns.filter((row) => ids.has(row.athlete_id))
    const latestByAthlete = teamAthletes.map((athlete) => {
      const rows = teamCheckIns.filter((row) => row.athlete_id === athlete.id)
      const latest = rows.sort((a, b) => b.check_in_date.localeCompare(a.check_in_date))[0]
      return { athlete, latest, risk: calculateRiskLevel(latest) }
    })

    const summary = summarizeTeam({ athletes: teamAthletes, checkIns: teamCheckIns, latestByAthlete })
    const weeklyTrend = aggregateWeeklyEorTrend(teamCheckIns)
    const eorLatest = getLatestWeeklyTeamSnapshot(weeklyTrend)
    const eorPrevious = getPreviousWeeklyTeamSnapshot(weeklyTrend)

    const mental = eorLatest?.mental ?? null
    const wellbeing = eorLatest?.wellbeing ?? null
    const social = eorLatest?.social ?? null
    const coachCommunication = eorLatest?.coachCommunication ?? null
    const energyData = getTeamAvgEnergy(teamCheckIns, eorLatest?.weekDate, eorPrevious?.weekDate)
    const energy = energyData.current

    const mentalDelta = delta(mental, eorPrevious?.mental)
    const wellbeingDelta = delta(wellbeing, eorPrevious?.wellbeing)
    const socialDelta = delta(social, eorPrevious?.social)
    const coachDelta = delta(coachCommunication, eorPrevious?.coachCommunication)
    const energyDelta = delta(energy, energyData.previous)

    const trend = { mentalDelta, wellbeingDelta, socialDelta, coachDelta, energyDelta }

    const highRiskCount = latestByAthlete.filter((row) => row.risk === "high").length
    const mediumRiskCount = latestByAthlete.filter((row) => row.risk === "medium").length
    const alertCount = alertCounts[team.id] || 0
    const pending = Math.max(0, teamAthletes.length - summary.checkedInThisWeek)

    const metrics = {
      mental: buildMetric(mental, mentalDelta),
      wellbeing: buildMetric(wellbeing, wellbeingDelta),
      social: buildMetric(social, socialDelta),
      coachCommunication: buildMetric(coachCommunication, coachDelta),
      energy: buildMetric(energy, energyDelta),
    }

    const status = calculateTeamClinicalStatus({
      alertCount,
      highRiskCount,
      mediumRiskCount,
      complianceRate: summary.complianceRate,
      pending,
      athleteCount: teamAthletes.length,
      mental,
      wellbeing,
      social,
      mentalDelta,
      wellbeingDelta,
      socialDelta,
      hasEorData: Boolean(eorLatest?.responses),
    })

    const healthScore = calculateTeamHealthScore({
      metrics,
      complianceRate: summary.complianceRate,
      alertCount,
      highRiskCount,
      trend,
    })

    const overview = {
      team,
      athleteCount: teamAthletes.length,
      reviewsDone: summary.checkedInThisWeek,
      pending,
      alertCount,
      highRiskCount,
      status,
      statusPriority: TEAM_STATUS_PRIORITY[status] ?? TEAM_STATUS_PRIORITY.unknown,
      metrics,
      lastReviewDays: getLastReviewDays(teamCheckIns),
      complianceRate: summary.complianceRate,
      trend,
      healthScore,
      changeMagnitude:
        Math.abs(mentalDelta) +
        Math.abs(wellbeingDelta) +
        Math.abs(socialDelta) +
        Math.abs(coachDelta) +
        Math.abs(energyDelta),
    }

    overview.alertFactors = buildTeamAlertFactors(overview)
    return overview
  })
}

export function sortTeamsByClinicalPriority(overviews) {
  return [...overviews].sort((a, b) => {
    if (a.statusPriority !== b.statusPriority) {
      return a.statusPriority - b.statusPriority
    }
    if (a.healthScore.score !== b.healthScore.score) {
      return a.healthScore.score - b.healthScore.score
    }
    if (b.alertCount !== a.alertCount) return b.alertCount - a.alertCount
    if (b.pending !== a.pending) return b.pending - a.pending
    return a.complianceRate - b.complianceRate
  })
}

export function getMostChangedTeam(overviews) {
  if (!overviews.length) return null
  return [...overviews].sort((a, b) => b.changeMagnitude - a.changeMagnitude)[0]
}
