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

function getTeamAvgEnergy(teamCheckIns, latestWeekDate) {
  if (latestWeekDate) {
    const weekRows = teamCheckIns.filter(
      (row) => row.check_in_date === latestWeekDate && hasWeeklyReflection(row)
    )
    const weeklyEnergy = average(weekRows.map((row) => row.weekly_energy))
    if (weeklyEnergy != null) return weeklyEnergy
  }

  const recent = teamCheckIns.filter((row) => row.check_in_date >= weekStartISO())
  return average(recent.map((row) => row.energy))
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
    const energy = getTeamAvgEnergy(teamCheckIns, eorLatest?.weekDate)

    const mentalDelta = delta(mental, eorPrevious?.mental)
    const wellbeingDelta = delta(wellbeing, eorPrevious?.wellbeing)
    const socialDelta = delta(social, eorPrevious?.social)

    const highRiskCount = latestByAthlete.filter((row) => row.risk === "high").length
    const mediumRiskCount = latestByAthlete.filter((row) => row.risk === "medium").length
    const alertCount = alertCounts[team.id] || 0
    const pending = Math.max(0, teamAthletes.length - summary.checkedInThisWeek)

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

    return {
      team,
      athleteCount: teamAthletes.length,
      reviewsDone: summary.checkedInThisWeek,
      pending,
      alertCount,
      highRiskCount,
      status,
      statusPriority: TEAM_STATUS_PRIORITY[status] ?? TEAM_STATUS_PRIORITY.unknown,
      metrics: {
        mental: { value: mental, level: scoreLevel(mental) },
        wellbeing: { value: wellbeing, level: scoreLevel(wellbeing) },
        social: { value: social, level: scoreLevel(social) },
        coachCommunication: { value: coachCommunication, level: scoreLevel(coachCommunication) },
        energy: { value: energy, level: scoreLevel(energy) },
      },
      lastReviewDays: getLastReviewDays(teamCheckIns),
      complianceRate: summary.complianceRate,
      trend: { mentalDelta, wellbeingDelta, socialDelta },
    }
  })
}

export function sortTeamsByClinicalPriority(overviews) {
  return [...overviews].sort((a, b) => {
    if (a.statusPriority !== b.statusPriority) {
      return a.statusPriority - b.statusPriority
    }
    if (b.alertCount !== a.alertCount) return b.alertCount - a.alertCount
    if (b.pending !== a.pending) return b.pending - a.pending
    return a.complianceRate - b.complianceRate
  })
}
