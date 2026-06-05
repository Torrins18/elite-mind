import { summarizeTeam } from "./metrics"

export function buildTeamInsight(input, t, { forCoach = false } = {}) {
  const summary = summarizeTeam(input)
  const prefix = forCoach ? "insights.team.coach" : "insights.team"

  if (!input.athletes.length) {
    return { tone: "neutral", text: t(`${prefix}.noAthletes`) }
  }

  if (!summary.hasData) {
    return { tone: "neutral", text: t(`${prefix}.noData`) }
  }

  const { teamAvg, highRiskAthletes, complianceRate, moodTrend, stressTrend } = summary
  const highCount = highRiskAthletes.length
  const compliancePct = Math.round(complianceRate * 100)

  if (highCount >= 1) {
    const key = highCount >= 2 ? "multipleHighRisk" : "singleHighRisk"
    return {
      tone: highCount >= 2 ? "danger" : "warning",
      text: t(`${prefix}.${key}`, {
        count: highCount,
        ...(forCoach
          ? {}
          : {
              names: formatNameList(highRiskAthletes, t),
              name: highRiskAthletes[0],
            }),
        mood: teamAvg.mood,
        stress: teamAvg.stress,
      }),
    }
  }

  if (summary.withoutRecentCount >= Math.max(2, Math.ceil(summary.totalAthletes / 2))) {
    return {
      tone: "warning",
      text: t(`${prefix}.lowCompliance`, {
        count: summary.withoutRecentCount,
        ...(forCoach ? {} : { names: formatNameList(summary.withoutRecentNames, t) }),
        compliance: compliancePct,
      }),
    }
  }

  if (stressTrend >= 1.2 && teamAvg.stress >= 6) {
    return {
      tone: "warning",
      text: t(`${prefix}.risingStress`, {
        stress: teamAvg.stress,
        delta: stressTrend,
        compliance: compliancePct,
      }),
    }
  }

  if (moodTrend <= -1 && teamAvg.mood <= 6) {
    return {
      tone: "warning",
      text: t(`${prefix}.decliningMood`, {
        mood: teamAvg.mood,
        delta: Math.abs(moodTrend),
        compliance: compliancePct,
      }),
    }
  }

  if (complianceRate >= 0.7 && teamAvg.mood >= 6.5 && teamAvg.stress <= 5.5) {
    return {
      tone: "positive",
      text: t(`${prefix}.healthy`, {
        mood: teamAvg.mood,
        energy: teamAvg.energy,
        compliance: compliancePct,
      }),
    }
  }

  return {
    tone: "neutral",
    text: t(`${prefix}.mixed`, {
      mood: teamAvg.mood,
      stress: teamAvg.stress,
      compliance: compliancePct,
      watch: summary.riskBreakdown.medium || 0,
    }),
  }
}

function formatNameList(names, t) {
  if (!names.length) return ""
  if (names.length === 1) return names[0]
  if (names.length === 2) return t("insights.namePair", { a: names[0], b: names[1] })
  return t("insights.nameList", {
    names: names.slice(0, -1).join(", "),
    last: names[names.length - 1],
  })
}
