import { buildOrgAlerts } from "./alerts"

const PANEL_STATUSES = ["active", "monitoring"]
const BLOCK_REINSERT_STATUSES = ["dismissed", "reviewed"]

function alertKey(athleteId, alertType) {
  return `${athleteId}:${alertType}`
}

export function isPanelAlertStatus(status) {
  return PANEL_STATUSES.includes(status)
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
    baseline: row.context?.baseline,
    delta: row.context?.delta,
    reviewedAt: row.reviewed_at,
    dismissedAt: row.dismissed_at,
    resolvedAt: row.resolved_at,
    reviewedBy: row.reviewed_by,
    dismissedBy: row.dismissed_by,
    actionTaken: row.action_taken,
    professionalNote: row.professional_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Normalize a raw DB row or mapped alert for history UI. */
export function normalizeAlertRecord(row) {
  if (!row) return null
  if (row.dbId || row.alert_type === undefined) {
    return {
      dbId: row.dbId || row.id,
      alertType: row.id || row.alert_type,
      athleteId: row.athleteId || row.athlete_id,
      severity: row.severity,
      status: row.status,
      context: row.context || {},
      value: row.value ?? row.context?.value,
      days: row.days ?? row.context?.days,
      baseline: row.baseline ?? row.context?.baseline,
      delta: row.delta ?? row.context?.delta,
      reviewedAt: row.reviewedAt || row.reviewed_at,
      dismissedAt: row.dismissedAt || row.dismissed_at,
      resolvedAt: row.resolvedAt || row.resolved_at,
      reviewedBy: row.reviewedBy || row.reviewed_by,
      actionTaken: row.actionTaken || row.action_taken,
      professionalNote: row.professionalNote || row.professional_note,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
    }
  }
  return {
    dbId: row.id,
    alertType: row.alert_type,
    athleteId: row.athlete_id,
    severity: row.severity,
    status: row.status,
    context: row.context || {},
    value: row.context?.value,
    days: row.context?.days,
    baseline: row.context?.baseline,
    delta: row.context?.delta,
    reviewedAt: row.reviewed_at,
    dismissedAt: row.dismissed_at,
    resolvedAt: row.resolved_at,
    reviewedBy: row.reviewed_by,
    actionTaken: row.action_taken,
    professionalNote: row.professional_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function countActiveAlerts(alerts) {
  return (alerts || []).filter((alert) => isPanelAlertStatus(alert.status)).length
}

export async function syncAndLoadPsychologistAlerts(
  supabase,
  athletes,
  checkIns,
  today,
  assessments = []
) {
  const athleteMap = Object.fromEntries(athletes.map((a) => [a.id, a]))
  const assessmentByAthlete = Object.fromEntries(
    (assessments || []).map((item) => [item.athlete_id, item])
  )
  const computed = buildOrgAlerts(athletes, checkIns, today, assessmentByAthlete).map((alert) => ({
    athlete_id: alert.athleteId,
    alert_type: alert.id,
    severity: alert.severity,
    context: {
      value: alert.value ?? null,
      days: alert.days ?? null,
      baseline: alert.baseline ?? null,
      delta: alert.delta ?? null,
    },
  }))

  const computedKeys = new Set(
    computed.map((alert) => alertKey(alert.athlete_id, alert.alert_type))
  )

  const [{ data: openRows, error: openError }, { data: blockedRows }] = await Promise.all([
    supabase.from("psychologist_alerts").select("*").in("status", PANEL_STATUSES),
    supabase
      .from("psychologist_alerts")
      .select("athlete_id, alert_type, status")
      .in("status", BLOCK_REINSERT_STATUSES),
  ])

  if (openError) {
    return buildOrgAlerts(athletes, checkIns, today, assessmentByAthlete).map((alert) => ({
      ...alert,
      dbId: null,
      status: "active",
      context: {},
    }))
  }

  const blockedKeys = new Set(
    (blockedRows || []).map((row) => alertKey(row.athlete_id, row.alert_type))
  )

  const openByKey = new Map(
    (openRows || []).map((row) => [alertKey(row.athlete_id, row.alert_type), row])
  )

  const now = new Date().toISOString()

  for (const alert of computed) {
    const key = alertKey(alert.athlete_id, alert.alert_type)
    const existing = openByKey.get(key)

    if (!existing) {
      if (blockedKeys.has(key)) continue

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
    .in("status", PANEL_STATUSES)
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
  return updatePsychologistAlertStatus(supabase, alertId, {
    status: "dismissed",
    psychologistId,
  })
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} alertId
 * @param {{ status: string, psychologistId: string, actionTaken?: string, professionalNote?: string }} opts
 */
export async function updatePsychologistAlertStatus(supabase, alertId, opts) {
  const { status, psychologistId, actionTaken, professionalNote } = opts
  const now = new Date().toISOString()
  const patch = {
    status,
    updated_at: now,
  }

  if (actionTaken !== undefined) patch.action_taken = actionTaken || null
  if (professionalNote !== undefined) patch.professional_note = professionalNote || null

  if (status === "reviewed" || status === "monitoring" || status === "resolved") {
    patch.reviewed_at = now
    patch.reviewed_by = psychologistId
  }

  if (status === "resolved") {
    patch.resolved_at = now
  }

  if (status === "dismissed") {
    patch.dismissed_at = now
    patch.dismissed_by = psychologistId
  }

  const { data, error } = await supabase
    .from("psychologist_alerts")
    .update(patch)
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
    .in("status", PANEL_STATUSES)
    .order("updated_at", { ascending: false })

  if (error) return []
  return (data || []).map((row) => mapDbRow(row, athleteMap))
}
