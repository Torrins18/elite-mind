import { summarizeAthlete } from "./metrics"

export function buildAthleteInsight({ athlete, checkIns }, t) {
  const summary = summarizeAthlete({ athlete, checkIns })

  if (!summary.hasData) {
    return { tone: "neutral", text: t("insights.athlete.noData", { name: athlete.name }) }
  }

  const { latest, risk, avg7, weakAreas, moodTrend, stressTrend, energyTrend, sleepTrend } =
    summary

  if (risk === "high") {
    return {
      tone: "danger",
      text: t("insights.athlete.highRisk", {
        name: athlete.name,
        mood: latest.mood,
        stress: latest.stress,
        sleep: latest.sleep_quality,
        energy: latest.energy,
        areas: formatAreas(weakAreas, t),
      }),
    }
  }

  if (summary.daysSince >= 3) {
    return {
      tone: "warning",
      text: t("insights.athlete.inactive", {
        name: athlete.name,
        days: summary.daysSince,
      }),
    }
  }

  if (risk === "medium") {
    return {
      tone: "warning",
      text: t("insights.athlete.watch", {
        name: athlete.name,
        mood: latest.mood,
        stress: latest.stress,
        areas: formatAreas(weakAreas, t),
        notes: summary.hasRecentNotes ? t("insights.athlete.hasNotes") : "",
      }),
    }
  }

  if (moodTrend <= -1.2 || stressTrend >= 1.2) {
    return {
      tone: "warning",
      text: t("insights.athlete.trendConcern", {
        name: athlete.name,
        mood: latest.mood,
        stress: latest.stress,
        moodTrend: formatTrend(moodTrend, t),
        stressTrend: formatTrend(stressTrend, t, true),
      }),
    }
  }

  if (summary.hasRecentNotes) {
    return {
      tone: "neutral",
      text: t("insights.athlete.stableWithNotes", {
        name: athlete.name,
        mood: avg7.mood,
        energy: avg7.energy,
        entries: summary.totalEntries,
      }),
    }
  }

  if (avg7.mood >= 7 && avg7.stress <= 5 && energyTrend >= 0) {
    return {
      tone: "positive",
      text: t("insights.athlete.healthy", {
        name: athlete.name,
        mood: avg7.mood,
        energy: avg7.energy,
        sleep: avg7.sleep_quality,
      }),
    }
  }

  return {
    tone: "neutral",
    text: t("insights.athlete.stable", {
      name: athlete.name,
      mood: latest.mood,
      stress: latest.stress,
      sleep: latest.sleep_quality,
      sleepTrend: formatTrend(sleepTrend, t),
    }),
  }
}

function formatAreas(areas, t) {
  if (!areas.length) return t("insights.areas.general")
  return areas.map((area) => t(`insights.areas.${area}`)).join(", ")
}

function formatTrend(delta, t, invert = false) {
  if (Math.abs(delta) < 0.5) return t("insights.trend.stable")
  const rising = delta > 0
  const bad = invert ? !rising : rising
  if (bad) return t("insights.trend.worse", { delta: Math.abs(delta) })
  return t("insights.trend.better", { delta: Math.abs(delta) })
}
