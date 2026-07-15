function delta(current, previous) {
  if (current == null || previous == null) return null
  return Math.round((current - previous) * 10) / 10
}

/** Team-level coach AI — never references individual athletes. */
export function buildCoachDashboardInsight({ weeklyMetrics, indicators, t }) {
  const latest = weeklyMetrics.at(-1)
  const previous = weeklyMetrics.length >= 2 ? weeklyMetrics.at(-2) : null

  if (!latest || latest.responses === 0) {
    return { tone: "neutral", text: t("coach.dashboardInsight.noData") }
  }

  const participation = indicators.participation ?? latest.participation
  const energyDelta = delta(latest.energy, previous?.energy)
  const communication = indicators.communication ?? latest.communication
  const cohesion = indicators.cohesion ?? latest.cohesion
  const communicationDelta = delta(latest.communication, previous?.communication)
  const participationDelta = delta(latest.participation, previous?.participation)

  if (energyDelta != null && energyDelta <= -1.2) {
    return {
      tone: "warning",
      text: t("coach.dashboardInsight.energyDown", {
        energy: latest.energy ?? "—",
        communication: communication ?? "—",
        participation,
      }),
    }
  }

  if (participationDelta != null && participationDelta >= 10 && participation >= 55) {
    return {
      tone: "positive",
      text: t("coach.dashboardInsight.participationUp", {
        participation,
        communication: communication ?? "—",
        cohesion: cohesion ?? "—",
      }),
    }
  }

  if (communicationDelta != null && Math.abs(communicationDelta) < 0.5 && participation >= 50) {
    return {
      tone: "neutral",
      text: t("coach.dashboardInsight.stableWeek", {
        participation,
        communication: communication ?? "—",
        cohesion: cohesion ?? "—",
      }),
    }
  }

  if (cohesion != null && cohesion <= 5.5) {
    return {
      tone: "warning",
      text: t("coach.dashboardInsight.cohesionGap", {
        cohesion,
        communication: communication ?? "—",
        participation,
      }),
    }
  }

  if (participation >= 65 && (cohesion == null || cohesion >= 6.5)) {
    return {
      tone: "positive",
      text: t("coach.dashboardInsight.healthyTeam", {
        participation,
        communication: communication ?? "—",
        energy: latest.energy ?? "—",
      }),
    }
  }

  return {
    tone: "neutral",
    text: t("coach.dashboardInsight.mixed", {
      participation,
      communication: communication ?? "—",
      energy: latest.energy ?? "—",
    }),
  }
}
