import { hasWeeklyReflection } from "./weeklyEor"
import { weekStartSundayISO } from "./checkInSchedule"
import { todayISO } from "./dates"

function average(values) {
  const nums = values.filter((value) => value != null && !Number.isNaN(value))
  if (!nums.length) return null
  return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 10) / 10
}

function delta(current, previous) {
  if (current == null || previous == null) return null
  return Math.round((current - previous) * 10) / 10
}

function latestWeeklyRows(checkIns) {
  const weekly = (checkIns || []).filter(hasWeeklyReflection)
  if (!weekly.length) return []

  const latestDate = weekly
    .map((row) => row.check_in_date)
    .sort((a, b) => b.localeCompare(a))[0]

  return weekly.filter((row) => row.check_in_date === latestDate)
}

export function buildCoachWeeklyMetrics(checkIns, athleteCount, maxWeeks = 8) {
  const weeklyRows = (checkIns || []).filter(hasWeeklyReflection)
  const byDate = weeklyRows.reduce((acc, row) => {
    if (!acc[row.check_in_date]) acc[row.check_in_date] = []
    acc[row.check_in_date].push(row)
    return acc
  }, {})

  return Object.entries(byDate)
    .map(([weekDate, rows]) => ({
      weekDate,
      responses: rows.length,
      participation:
        athleteCount > 0 ? Math.round((rows.length / athleteCount) * 100) : 0,
      mental: average(rows.map((row) => row.confidence_rating)),
      energy: average(rows.map((row) => row.weekly_energy)),
      cohesion: average(rows.map((row) => row.group_integration)),
      communication: average(rows.map((row) => row.coach_communication)),
      recovery: average(rows.map((row) => row.general_recovery)),
    }))
    .sort((a, b) => a.weekDate.localeCompare(b.weekDate))
    .slice(-maxWeeks)
}

export function buildCoachTeamIndicators(checkIns, athleteCount, complianceNow) {
  const rows = latestWeeklyRows(checkIns)
  const participationPct =
    athleteCount > 0 && rows.length
      ? Math.round((rows.length / athleteCount) * 100)
      : complianceNow?.pct ?? 0

  return {
    confidence: average(rows.map((row) => row.confidence_rating)),
    energy: average(rows.map((row) => row.weekly_energy)),
    cohesion: average(rows.map((row) => row.group_integration)),
    communication: average(rows.map((row) => row.coach_communication)),
    recovery: average(rows.map((row) => row.general_recovery)),
    participation: participationPct,
    responseCount: rows.length,
    athleteCount,
  }
}

export function buildCoachTeamStatus({ indicators, weeklyMetrics, recommendationCount }) {
  const latest = weeklyMetrics.at(-1)
  const previous = weeklyMetrics.length >= 2 ? weeklyMetrics.at(-2) : null

  if (!latest || latest.responses === 0) {
    return {
      status: "unknown",
      icon: "⚪",
      titleKey: "coach.teamStatus.unknownTitle",
      line1Key: "coach.teamStatus.unknownLine1",
      line2Key: "coach.teamStatus.unknownLine2",
      params: { recommendations: recommendationCount },
    }
  }

  const energyDelta = delta(latest.energy, previous?.energy)
  const cohesion = indicators.cohesion ?? latest.cohesion
  const communication = indicators.communication ?? latest.communication
  const participation = indicators.participation ?? latest.participation

  const collectiveLow =
    (indicators.confidence != null && indicators.confidence <= 5) ||
    (cohesion != null && cohesion <= 5) ||
    participation < 40

  const collectiveDrop =
    (energyDelta != null && energyDelta <= -1.5) ||
    (delta(latest.cohesion, previous?.cohesion) != null &&
      delta(latest.cohesion, previous?.cohesion) <= -1.5)

  if (collectiveLow || collectiveDrop) {
    return {
      status: "watch",
      icon: "🟠",
      titleKey: "coach.teamStatus.watchTitle",
      line1Key: collectiveDrop ? "coach.teamStatus.watchLine1Drop" : "coach.teamStatus.watchLine1",
      line2Key: "coach.teamStatus.watchLine2",
      params: {
        recommendations: recommendationCount,
        participation,
        communication: communication ?? "—",
      },
    }
  }

  const strong =
    participation >= 60 &&
    (cohesion == null || cohesion >= 6.5) &&
    (communication == null || communication >= 6)

  if (strong) {
    return {
      status: "stable",
      icon: "🟢",
      titleKey: "coach.teamStatus.stableTitle",
      line1Key: "coach.teamStatus.stableLine1",
      line2Key: "coach.teamStatus.stableLine2",
      params: {
        recommendations: recommendationCount,
        participation,
      },
    }
  }

  return {
    status: "neutral",
    icon: "🟡",
    titleKey: "coach.teamStatus.neutralTitle",
    line1Key: "coach.teamStatus.neutralLine1",
    line2Key: "coach.teamStatus.neutralLine2",
    params: {
      recommendations: recommendationCount,
      participation,
      communication: communication ?? "—",
    },
  }
}

export function coachRecommendationSummary(count, t) {
  if (!count) return t("coach.teamStatus.noRecommendations")
  if (count === 1) return t("coach.teamStatus.oneRecommendation")
  return t("coach.teamStatus.multipleRecommendations", { count })
}

export { weekStartSundayISO, todayISO }
