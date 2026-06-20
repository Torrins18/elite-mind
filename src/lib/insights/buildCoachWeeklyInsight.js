export function buildCoachWeeklyInsight({ weeklyTrend, athleteCount, t }) {
  const latest = weeklyTrend.at(-1)
  const previous = weeklyTrend.length >= 2 ? weeklyTrend.at(-2) : null

  if (!latest || latest.responses === 0) {
    return { tone: "neutral", text: t("coach.weeklyInsight.noData") }
  }

  const compliancePct = athleteCount
    ? Math.round((latest.responses / athleteCount) * 100)
    : 0

  const social = latest.social
  const mental = latest.mental
  const wellbeing = latest.wellbeing

  const socialDelta =
    previous?.social != null && social != null
      ? Math.round((social - previous.social) * 10) / 10
      : null
  const mentalDelta =
    previous?.mental != null && mental != null
      ? Math.round((mental - previous.mental) * 10) / 10
      : null

  if (social != null && social <= 5 && mental != null && mental >= 7) {
    return {
      tone: "warning",
      text: t("coach.weeklyInsight.mentalSocialGap", {
        mental,
        social,
        wellbeing: wellbeing ?? "—",
      }),
    }
  }

  if (socialDelta != null && socialDelta <= -1.5) {
    return {
      tone: "warning",
      text: t("coach.weeklyInsight.socialDrop", {
        value: social,
        delta: Math.abs(socialDelta),
      }),
    }
  }

  if (mentalDelta != null && mentalDelta <= -1.5) {
    return {
      tone: "warning",
      text: t("coach.weeklyInsight.mentalDrop", {
        value: mental,
        delta: Math.abs(mentalDelta),
      }),
    }
  }

  if (
    compliancePct >= 70 &&
    mental != null &&
    mental >= 7 &&
    social != null &&
    social >= 7
  ) {
    return {
      tone: "positive",
      text: t("coach.weeklyInsight.healthy", {
        mental,
        wellbeing: wellbeing ?? "—",
        social,
        compliance: compliancePct,
      }),
    }
  }

  return {
    tone: "neutral",
    text: t("coach.weeklyInsight.mixed", {
      mental: mental ?? "—",
      wellbeing: wellbeing ?? "—",
      social: social ?? "—",
      compliance: compliancePct,
    }),
  }
}
