export function buildTeamInsightContext({
  teamName,
  athletes,
  summary,
  weeklyTrend,
  complianceTrend,
  lang,
}) {
  const weeks = (weeklyTrend || []).slice(-8)
  const compliance = (complianceTrend || []).slice(-8)

  return {
    lang,
    scope: "team",
    team: {
      name: teamName,
      athleteCount: athletes?.length ?? 0,
    },
    summary: summary
      ? {
          compliancePct: Math.round((summary.complianceRate ?? 0) * 100),
          checkedInThisWeek: summary.checkedInThisWeek,
          totalAthletes: summary.totalAthletes,
          riskBreakdown: summary.riskBreakdown,
          withoutRecentCount: summary.withoutRecentCount,
        }
      : null,
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
