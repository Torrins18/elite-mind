import { aggregateWeeklyEorTrend } from "../coachTeamAnalytics"
import { buildWeeklyComplianceTrend } from "../complianceTrend"
import { summarizeTeam } from "./metrics"

export function buildClubInsightContext({ clubName, teams, athletes, checkIns, lang }) {
  const athleteIds = (athletes || []).map((a) => a.id)
  const clubCheckIns = (checkIns || []).filter((c) => athleteIds.includes(c.athlete_id))
  const weeklyTrend = aggregateWeeklyEorTrend(clubCheckIns)
  const complianceTrend = buildWeeklyComplianceTrend(clubCheckIns, athleteIds)

  const latestByAthlete = (athletes || []).map((athlete) => ({
    athlete,
    latest: clubCheckIns.find((c) => c.athlete_id === athlete.id) || null,
  }))

  const summary = summarizeTeam({
    athletes: athletes || [],
    checkIns: clubCheckIns,
    latestByAthlete,
  })

  const teamBreakdown = (teams || []).map((team) => {
    const teamAthletes = (athletes || []).filter((a) => a.team_id === team.id)
    const ids = new Set(teamAthletes.map((a) => a.id))
    const teamCheckIns = clubCheckIns.filter((c) => ids.has(c.athlete_id))
    const teamCompliance = buildWeeklyComplianceTrend(
      teamCheckIns,
      teamAthletes.map((a) => a.id)
    )
    const lastCompliance = teamCompliance[teamCompliance.length - 1]
    return {
      name: team.name,
      athletes: teamAthletes.length,
      compliancePct: lastCompliance?.compliance ?? 0,
    }
  })

  const weeks = weeklyTrend.slice(-8)
  const compliance = complianceTrend.slice(-8)

  return {
    lang,
    scope: "club",
    club: {
      name: clubName,
      teamCount: teams?.length ?? 0,
      athleteCount: athletes?.length ?? 0,
    },
    teams: teamBreakdown,
    summary: {
      compliancePct: Math.round((summary.complianceRate ?? 0) * 100),
      checkedInThisWeek: summary.checkedInThisWeek,
      totalAthletes: summary.totalAthletes,
      riskBreakdown: summary.riskBreakdown,
    },
    evolution: {
      eorWeeks: weeks.map((row) => ({
        date: row.weekDate,
        mental: row.mental,
        wellbeing: row.wellbeing,
        social: row.social,
        coachCommunication: row.coachCommunication,
        responses: row.responses,
      })),
      complianceWeeks: compliance.map((row) => ({
        date: row.weekDate,
        pct: row.compliance,
        done: row.done,
        total: row.total,
      })),
    },
    latestEor: weeks[weeks.length - 1] || null,
  }
}
