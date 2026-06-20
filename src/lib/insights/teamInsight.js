import {
  aggregateWeeklyEorTrend,
  getLatestWeeklyTeamSnapshot,
  getPreviousWeeklyTeamSnapshot,
} from "../coachTeamAnalytics"
import { summarizeTeam } from "./metrics"

export function buildTeamInsight(input, t, { forCoach = false } = {}) {
  const summary = summarizeTeam(input)
  const prefix = forCoach ? "insights.team.coach" : "insights.team"
  const weeklyTrend = aggregateWeeklyEorTrend(input.checkIns)
  const latest = getLatestWeeklyTeamSnapshot(weeklyTrend)
  const previous = getPreviousWeeklyTeamSnapshot(weeklyTrend)

  if (!input.athletes.length) {
    return { tone: "neutral", text: t(`${prefix}.noAthletes`) }
  }

  if (!latest || latest.responses === 0) {
    return { tone: "neutral", text: t(`${prefix}.noData`) }
  }

  const compliancePct = Math.round(summary.complianceRate * 100)
  const { highRiskAthletes } = summary
  const highCount = highRiskAthletes.length

  const mental = latest.mental
  const wellbeing = latest.wellbeing
  const social = latest.social
  const coachCommunication = latest.coachCommunication

  const mentalDelta = delta(latest.mental, previous?.mental)
  const socialDelta = delta(latest.social, previous?.social)
  const wellbeingDelta = delta(latest.wellbeing, previous?.wellbeing)

  const eorBase = { mental, wellbeing, social, compliance: compliancePct }

  if (highCount >= 1) {
    const key = highCount >= 2 ? "multipleHighRisk" : "singleHighRisk"
    return {
      tone: highCount >= 2 ? "danger" : "warning",
      text: t(`${prefix}.${key}`, {
        count: highCount,
        ...eorBase,
        ...(forCoach
          ? {}
          : {
              names: formatNameList(highRiskAthletes, t),
              name: highRiskAthletes[0],
            }),
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
        ...eorBase,
      }),
    }
  }

  if (!forCoach && coachCommunication != null && coachCommunication <= 4) {
    return {
      tone: "warning",
      text: t(`${prefix}.coachCommunicationLow`, {
        coachCommunication,
        mental: mental ?? "—",
        social: social ?? "—",
        compliance: compliancePct,
      }),
    }
  }

  if (social != null && social <= 5 && mental != null && mental >= 7) {
    return {
      tone: "warning",
      text: t(`${prefix}.mentalSocialGap`, {
        mental,
        social,
        wellbeing: wellbeing ?? "—",
        compliance: compliancePct,
      }),
    }
  }

  if (socialDelta != null && socialDelta <= -1.5) {
    return {
      tone: "warning",
      text: t(`${prefix}.socialDrop`, {
        social,
        delta: Math.abs(socialDelta),
        compliance: compliancePct,
      }),
    }
  }

  if (mentalDelta != null && mentalDelta <= -1.5) {
    return {
      tone: "warning",
      text: t(`${prefix}.mentalDrop`, {
        mental,
        delta: Math.abs(mentalDelta),
        compliance: compliancePct,
      }),
    }
  }

  if (wellbeingDelta != null && wellbeingDelta <= -1.5 && wellbeing != null && wellbeing <= 6) {
    return {
      tone: "warning",
      text: t(`${prefix}.wellbeingDrop`, {
        wellbeing,
        delta: Math.abs(wellbeingDelta),
        compliance: compliancePct,
      }),
    }
  }

  if (
    compliancePct >= 70 &&
    mental != null &&
    mental >= 7 &&
    social != null &&
    social >= 7 &&
    (wellbeing == null || wellbeing >= 6)
  ) {
    return {
      tone: "positive",
      text: t(`${prefix}.healthy`, {
        ...eorBase,
      }),
    }
  }

  return {
    tone: "neutral",
    text: t(`${prefix}.mixed`, {
      ...eorBase,
      watch: summary.riskBreakdown.medium || 0,
      ...(forCoach ? {} : { coachCommunication: coachCommunication ?? "—" }),
    }),
  }
}

function delta(current, previous) {
  if (current == null || previous == null) return null
  return Math.round((current - previous) * 10) / 10
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
