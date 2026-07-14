function delta(current, previous) {
  if (current == null || previous == null) return null
  return Math.round((current - previous) * 10) / 10
}

/** Multi-week team evolution summary (last ~4 weekly snapshots). */
export function buildTeamEvolutionInsight({ weeklyTrend, complianceTrend, t }) {
  const weeks = (weeklyTrend || []).slice(-4)
  const complianceWeeks = (complianceTrend || []).slice(-4)

  if (weeks.length < 2) {
    return { tone: "neutral", text: t("insights.evolution.noData") }
  }

  const first = weeks[0]
  const last = weeks[weeks.length - 1]
  const span = weeks.length

  const mentalDelta = delta(last.mental, first.mental)
  const wellbeingDelta = delta(last.wellbeing, first.wellbeing)
  const socialDelta = delta(last.social, first.social)
  const coachDelta = delta(last.coachCommunication, first.coachCommunication)

  const complianceFirst = complianceWeeks[0]?.compliance
  const complianceLast = complianceWeeks[complianceWeeks.length - 1]?.compliance
  const complianceDelta =
    complianceFirst != null && complianceLast != null ? complianceLast - complianceFirst : null

  const base = {
    weeks: span,
    mental: last.mental ?? "—",
    wellbeing: last.wellbeing ?? "—",
    social: last.social ?? "—",
    compliance: complianceLast ?? "—",
  }

  if (mentalDelta != null && mentalDelta <= -1.5 && socialDelta != null && socialDelta <= -1) {
    return {
      tone: "warning",
      text: t("insights.evolution.mentalSocialDecline", {
        ...base,
        mentalDelta: Math.abs(mentalDelta),
        socialDelta: Math.abs(socialDelta),
      }),
    }
  }

  if (complianceDelta != null && complianceDelta <= -15 && complianceLast != null && complianceLast < 70) {
    return {
      tone: "warning",
      text: t("insights.evolution.complianceDrop", {
        ...base,
        complianceDelta: Math.abs(complianceDelta),
      }),
    }
  }

  if (coachDelta != null && coachDelta <= -1.5 && last.coachCommunication != null && last.coachCommunication <= 5) {
    return {
      tone: "warning",
      text: t("insights.evolution.coachCommDecline", {
        ...base,
        coachCommunication: last.coachCommunication,
        coachDelta: Math.abs(coachDelta),
      }),
    }
  }

  if (wellbeingDelta != null && wellbeingDelta <= -1.5 && last.wellbeing != null && last.wellbeing <= 6) {
    return {
      tone: "warning",
      text: t("insights.evolution.wellbeingDecline", {
        ...base,
        wellbeingDelta: Math.abs(wellbeingDelta),
      }),
    }
  }

  if (
    mentalDelta != null &&
    mentalDelta >= 1 &&
    socialDelta != null &&
    socialDelta >= 0.5 &&
    (complianceDelta == null || complianceDelta >= 0)
  ) {
    return {
      tone: "positive",
      text: t("insights.evolution.improving", base),
    }
  }

  if (complianceDelta != null && complianceDelta >= 10 && complianceLast != null && complianceLast >= 75) {
    return {
      tone: "positive",
      text: t("insights.evolution.complianceUp", {
        ...base,
        complianceDelta,
      }),
    }
  }

  return {
    tone: "neutral",
    text: t("insights.evolution.stable", {
      ...base,
      mentalDelta: mentalDelta ?? 0,
      socialDelta: socialDelta ?? 0,
    }),
  }
}
