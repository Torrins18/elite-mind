import { todayISO } from "./dates"
import { weekStartSundayISO } from "./checkInSchedule"

export function getGreetingKey(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 19) return "afternoon"
  return "evening"
}

export function buildExecutiveSummary({
  profile,
  teamOverviews,
  alerts,
  appointmentRequests,
  psychologistMessages,
  athletes,
  teams,
}) {
  const activeAlerts = (alerts || []).filter(
    (row) => row.status === "active" || row.status === "monitoring"
  )
  const priorityAlerts = activeAlerts.filter(
    (row) => row.severity === "high" || row.severity === "medium"
  )
  const teamIds = new Set((teams || []).map((row) => row.id))
  const activeAthletes = (athletes || []).filter((row) => teamIds.has(row.team_id)).length

  let totalDone = 0
  let totalAthletes = 0
  for (const overview of teamOverviews || []) {
    totalDone += overview.reviewsDone
    totalAthletes += overview.athleteCount
  }

  const compliancePct = totalAthletes ? Math.round((totalDone / totalAthletes) * 100) : 0
  const name = profile?.name?.trim() || ""
  const firstName = name.split(/\s+/)[0] || name

  return {
    firstName,
    priorityAlerts: priorityAlerts.length,
    highAlerts: activeAlerts.filter((row) => row.severity === "high").length,
    appointments: appointmentRequests?.length || 0,
    messages: psychologistMessages?.length || 0,
    activeAthletes,
    compliancePct,
  }
}

function athleteName(athleteMap, athleteId, fallback = "") {
  return athleteMap?.[athleteId]?.name || fallback
}

export function buildTodayPriorities({
  teamOverviews,
  alerts,
  appointmentRequests,
  psychologistMessages,
  mostChangedTeam,
  athleteMap = {},
}) {
  const items = []
  const weekKey = weekStartSundayISO(todayISO())
  const seenKeys = new Set()

  const push = (item) => {
    if (seenKeys.has(item.priorityKey)) return
    seenKeys.add(item.priorityKey)
    items.push(item)
  }

  const criticalTeams = (teamOverviews || []).filter((row) => row.status === "critical")
  for (const overview of criticalTeams.slice(0, 3)) {
    push({
      id: `team-critical-${overview.team.id}`,
      priorityKey: `team:${overview.team.id}:status:critical`,
      tone: "critical",
      key: "teamCriticalReview",
      params: { team: overview.team.name },
      action: { type: "team", id: overview.team.id, tab: "alerts" },
    })
  }

  const observationTeams = (teamOverviews || []).filter((row) => row.status === "observation")
  for (const overview of observationTeams.slice(0, 2)) {
    if (items.some((row) => row.action?.id === overview.team.id)) continue
    push({
      id: `team-observation-${overview.team.id}`,
      priorityKey: `team:${overview.team.id}:status:observation`,
      tone: "observation",
      key: "teamObservationReview",
      params: { team: overview.team.name },
      action: { type: "team", id: overview.team.id, tab: "athletes" },
    })
  }

  for (const overview of teamOverviews || []) {
    if (!overview.pending) continue
    push({
      id: `team-pending-${overview.team.id}`,
      priorityKey: `team:${overview.team.id}:pending-reviews:${weekKey}`,
      tone: "observation",
      key: overview.pending === 1 ? "teamPendingReviewOne" : "teamPendingReview",
      params: { team: overview.team.name, count: overview.pending },
      action: { type: "team", id: overview.team.id, tab: "participation" },
    })
  }

  for (const item of appointmentRequests || []) {
    const name = athleteName(athleteMap, item.user_id)
    push({
      id: `appointment-${item.id}`,
      priorityKey: `appointment:${item.id}:pending`,
      tone: "watch",
      key: "appointmentPendingAthlete",
      params: { name: name || "?" },
      action: {
        type: "appointment",
        id: item.id,
        athleteId: item.user_id,
      },
    })
  }

  for (const item of psychologistMessages || []) {
    const name = athleteName(athleteMap, item.user_id)
    push({
      id: `message-${item.id}`,
      priorityKey: `message:${item.id}:unread`,
      tone: "watch",
      key: "messageUnreadFrom",
      params: { name: name || "?" },
      action: {
        type: "message",
        id: item.id,
        athleteId: item.user_id,
      },
    })
  }

  const highAlerts = (alerts || []).filter(
    (row) =>
      (row.status === "active" || row.status === "monitoring") &&
      row.severity === "high"
  )
  for (const alert of highAlerts.slice(0, 4)) {
    const alertKey = alert.dbId || alert.id
    const name = alert.athleteName || athleteName(athleteMap, alert.athleteId)
    push({
      id: `alert-${alertKey}`,
      priorityKey: `alert:${alertKey}:active`,
      tone: "critical",
      key: "priorityAlertAthlete",
      params: { name: name || "?" },
      action: {
        type: "athlete",
        id: alert.athleteId,
        tab: "profile",
        focusAlertId: alert.dbId || null,
      },
    })
  }

  if (
    mostChangedTeam &&
    mostChangedTeam.changeMagnitude >= 1.2 &&
    mostChangedTeam.status !== "critical"
  ) {
    push({
      id: `changed-${mostChangedTeam.team.id}`,
      priorityKey: `team:${mostChangedTeam.team.id}:most-changed:${weekKey}`,
      tone: "watch",
      key: "teamMostChanged",
      params: { team: mostChangedTeam.team.name },
      action: { type: "team", id: mostChangedTeam.team.id, tab: "eor" },
    })
  }

  return items.slice(0, 15)
}
