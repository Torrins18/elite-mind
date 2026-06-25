import { buildOrgAlerts } from "./alerts"

function alertKey(athleteId, alertType) {
  return `${athleteId}:${alertType}`
}

function mapDbRow(row, athleteMap) {
  const athlete = athleteMap[row.athlete_id]
  return {
    dbId: row.id,
    id: row.alert_type,
    athleteId: row.athlete_id,
    athleteName: athlete?.name || "",
    severity: row.severity,
    status: row.status,
    context: row.context || {},
    value: row.context?.value,
    days: row.context?.days,
    reviewedAt: row.reviewed_at,
    dismissedAt: row.dismissed_at,
  }
}

export function countActiveAlerts(alerts) {
  return (alerts || []).filter((alert) => alert.status === "active").length
}

export async function syncAndLoadPsychologistAlerts(supabase, athletes, checkIns, today) {
  const athleteMap = Object.fromEntries(athletes.map((a) => [a.id, a]))
  const computed = buildOrgAlerts(athletes, checkIns, today).map((alert) => ({
    athlete_id: alert.athleteId,
    alert_type: alert.id,
    severity: alert.severity,
    context: {
      value: alert.value ?? null,
      days: alert.days ?? null,
    },
  }))

  const computedKeys = new Set(
    computed.map((alert) => alertKey(alert.athlete_id, alert.alert_type))
  )

  const [{ data: openRows, error: openError }, { data: dismissedRows }] = await Promise.all([
    supabase.from("psychologist_alerts").select("*").in("status", ["active", "reviewed"]),
    supabase
      .from("psychologist_alerts")
      .select("athlete_id, alert_type")
      .eq("status", "dismissed"),
  ])

  if (openError) {
    return buildOrgAlerts(athletes, checkIns, today).map((alert) => ({
      ...alert,
      dbId: null,
      status: "active",
      context: {},
    }))
  }

  const dismissedKeys = new Set(
    (dismissedRows || []).map((row) => alertKey(row.athlete_id, row.alert_type))
  )

  const openByKey = new Map(
    (openRows || []).map((row) => [alertKey(row.athlete_id, row.alert_type), row])
  )

  const now = new Date().toISOString()

  for (const alert of computed) {
    const key = alertKey(alert.athlete_id, alert.alert_type)
    const existing = openByKey.get(key)

    if (!existing) {
      if (dismissedKeys.has(key)) continue

      const { data: inserted } = await supabase
        .from("psychologist_alerts")
        .insert([
          {
            athlete_id: alert.athlete_id,
            alert_type: alert.alert_type,
            severity: alert.severity,
            status: "active",
            context: alert.context,
            updated_at: now,
          },
        ])
        .select("*")
        .single()

      if (inserted) openByKey.set(key, inserted)
      continue
    }

    if (dismissedKeys.has(key)) {
      await supabase
        .from("psychologist_alerts")
        .update({
          status: "dismissed",
          dismissed_at: now,
          context: { ...(existing.context || {}), supersededByDismiss: true },
          updated_at: now,
        })
        .eq("id", existing.id)
      openByKey.delete(key)
      continue
    }

    if (existing.status === "active") {
      await supabase
        .from("psychologist_alerts")
        .update({
          severity: alert.severity,
          context: alert.context,
          updated_at: now,
        })
        .eq("id", existing.id)
    }
  }

  for (const row of openRows || []) {
    const key = alertKey(row.athlete_id, row.alert_type)
    if (!computedKeys.has(key) && row.status === "active") {
      await supabase
        .from("psychologist_alerts")
        .update({
          status: "dismissed",
          dismissed_at: now,
          context: { ...(row.context || {}), autoResolved: true },
          updated_at: now,
        })
        .eq("id", row.id)
    }
  }

  const { data: visibleRows } = await supabase
    .from("psychologist_alerts")
    .select("*")
    .in("status", ["active", "reviewed"])
    .order("updated_at", { ascending: false })

  return (visibleRows || []).map((row) => mapDbRow(row, athleteMap))
}

export async function markAlertsReviewedForAthlete(supabase, athleteId, psychologistId) {
  const now = new Date().toISOString()

  const { data } = await supabase
    .from("psychologist_alerts")
    .update({
      status: "reviewed",
      reviewed_at: now,
      reviewed_by: psychologistId,
      updated_at: now,
    })
    .eq("athlete_id", athleteId)
    .eq("status", "active")
    .select("*")

  return data || []
}

export async function dismissPsychologistAlert(supabase, alertId, psychologistId) {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("psychologist_alerts")
    .update({
      status: "dismissed",
      dismissed_at: now,
      dismissed_by: psychologistId,
      updated_at: now,
    })
    .eq("id", alertId)
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function loadVisiblePsychologistAlerts(supabase, athletes) {
  const athleteMap = Object.fromEntries(athletes.map((a) => [a.id, a]))

  const { data, error } = await supabase
    .from("psychologist_alerts")
    .select("*")
    .in("status", ["active", "reviewed"])
    .order("updated_at", { ascending: false })

  if (error) return []
  return (data || []).map((row) => mapDbRow(row, athleteMap))
}
