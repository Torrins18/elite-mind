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
  const activeAlerts = (alerts || []).filter((row) => row.status === "active")
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

export function buildTodayPriorities({
  teamOverviews,
  alerts,
  appointmentRequests,
  psychologistMessages,
  mostChangedTeam,
}) {
  const items = []

  const criticalTeams = (teamOverviews || []).filter((row) => row.status === "critical")
  for (const overview of criticalTeams.slice(0, 2)) {
    items.push({
      id: `team-critical-${overview.team.id}`,
      tone: "critical",
      key: "teamCriticalReview",
      params: { team: overview.team.name },
      action: { type: "team", id: overview.team.id },
    })
  }

  const observationTeams = (teamOverviews || []).filter((row) => row.status === "observation")
  for (const overview of observationTeams.slice(0, 1)) {
    if (items.some((row) => row.action?.id === overview.team.id)) continue
    items.push({
      id: `team-observation-${overview.team.id}`,
      tone: "observation",
      key: "teamObservationReview",
      params: { team: overview.team.name },
      action: { type: "team", id: overview.team.id },
    })
  }

  const totalPending = (teamOverviews || []).reduce((sum, row) => sum + row.pending, 0)
  if (totalPending > 0) {
    items.push({
      id: "pending-reviews",
      tone: "observation",
      key: totalPending === 1 ? "athletesPendingReviewOne" : "athletesPendingReview",
      params: { count: totalPending },
    })
  }

  if (appointmentRequests?.length) {
    items.push({
      id: "appointments",
      tone: "watch",
      key: appointmentRequests.length === 1 ? "appointmentPendingOne" : "appointmentPending",
      params: { count: appointmentRequests.length },
    })
  }

  if (psychologistMessages?.length) {
    items.push({
      id: "messages",
      tone: "watch",
      key: psychologistMessages.length === 1 ? "messagesUnreadOne" : "messagesUnread",
      params: { count: psychologistMessages.length },
    })
  }

  const highAlerts = (alerts || []).filter(
    (row) => row.status === "active" && row.severity === "high"
  )
  if (highAlerts.length && !items.some((row) => row.id.startsWith("team-critical"))) {
    items.push({
      id: "high-alerts",
      tone: "critical",
      key: highAlerts.length === 1 ? "priorityAlertOne" : "priorityAlerts",
      params: { count: highAlerts.length },
      action: { type: "athlete", id: highAlerts[0].athleteId },
    })
  }

  if (
    mostChangedTeam &&
    mostChangedTeam.changeMagnitude >= 1.2 &&
    mostChangedTeam.status !== "critical"
  ) {
    items.push({
      id: `changed-${mostChangedTeam.team.id}`,
      tone: "watch",
      key: "teamMostChanged",
      params: { team: mostChangedTeam.team.name },
      action: { type: "team", id: mostChangedTeam.team.id },
    })
  }

  return items.slice(0, 5)
}
