import { buildNotices, buildReminders } from "./alerts"

const PANEL_STATUSES = ["active", "monitoring"]
const BLOCK_REINSERT_STATUSES = ["dismissed"]

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 }

function alertKey(athleteId, alertType) {
  return `${athleteId}:${alertType}`
}

export function isPanelAlertStatus(status) {
  return PANEL_STATUSES.includes(status)
}

export function compareNotices(a, b) {
  const rankA = SEVERITY_RANK[a.severity] ?? 9
  const rankB = SEVERITY_RANK[b.severity] ?? 9
  if (rankA !== rankB) return rankA - rankB
  const timeA = new Date(a.updatedAt || a.lastEventAt || a.createdAt || 0).getTime()
  const timeB = new Date(b.updatedAt || b.lastEventAt || b.createdAt || 0).getTime()
  return timeB - timeA
}

function shouldBumpEventCount(lastEventAt, nowIso) {
  if (!lastEventAt) return true
  const last = new Date(lastEventAt).getTime()
  const now = new Date(nowIso).getTime()
  return now - last >= 24 * 60 * 60 * 1000
}

function mapDbRow(row, athleteMap) {
  const athlete = athleteMap[row.athlete_id]
  return {
    dbId: row.id,
    id: row.alert_type,
    athleteId: row.athlete_id,
    athleteName: athlete?.name || "",
    severity: row.severity,
    kind: row.kind || "notice",
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
    lastEventAt: row.last_event_at,
    eventCount: row.event_count ?? 1,
    postponedUntil: row.postponed_until,
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
      kind: row.kind || "notice",
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
      lastEventAt: row.lastEventAt || row.last_event_at,
      eventCount: row.eventCount ?? row.event_count ?? 1,
      postponedUntil: row.postponedUntil || row.postponed_until,
    }
  }
  return {
    dbId: row.id,
    alertType: row.alert_type,
    athleteId: row.athlete_id,
    severity: row.severity,
    kind: row.kind || "notice",
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
    lastEventAt: row.last_event_at,
    eventCount: row.event_count ?? 1,
    postponedUntil: row.postponed_until,
  }
}

export function countActiveAlerts(alerts) {
  return (alerts || []).filter(
    (alert) =>
      (alert.kind || "notice") === "notice" &&
      isPanelAlertStatus(alert.status) &&
      !isPostponed(alert)
  ).length
}

function isPostponed(alert, now = new Date()) {
  if (!alert?.postponedUntil && !alert?.postponed_until) return false
  const until = new Date(alert.postponedUntil || alert.postponed_until)
  return until.getTime() > now.getTime()
}

function filterVisibleNotices(rows) {
  const now = new Date()
  return (rows || [])
    .filter((row) => (row.kind || "notice") === "notice")
    .filter((row) => PANEL_STATUSES.includes(row.status))
    .filter((row) => !isPostponed(row, now))
    .sort(compareNotices)
}

export { buildReminders }

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

  const notices = buildNotices(athletes, checkIns, today, assessmentByAthlete).map((alert) => ({
    athlete_id: alert.athleteId,
    alert_type: alert.id,
    severity: alert.severity,
    kind: "notice",
    context: {
      value: alert.value ?? null,
      days: alert.days ?? null,
      baseline: alert.baseline ?? null,
      delta: alert.delta ?? null,
    },
  }))

  const computedKeys = new Set(
    notices.map((alert) => alertKey(alert.athlete_id, alert.alert_type))
  )

  const [{ data: openRows, error: openError }, { data: blockedRows }] = await Promise.all([
    supabase
      .from("psychologist_alerts")
      .select("*")
      .eq("kind", "notice")
      .in("status", PANEL_STATUSES),
    supabase
      .from("psychologist_alerts")
      .select("athlete_id, alert_type, status")
      .eq("kind", "notice")
      .in("status", BLOCK_REINSERT_STATUSES),
  ])

  if (openError) {
    return notices
      .map((alert) => ({
        dbId: null,
        id: alert.alert_type,
        athleteId: alert.athlete_id,
        athleteName: athleteMap[alert.athlete_id]?.name || "",
        severity: alert.severity,
        kind: "notice",
        status: "active",
        context: alert.context,
        value: alert.context.value,
        days: alert.context.days,
        baseline: alert.context.baseline,
        delta: alert.context.delta,
        eventCount: 1,
        lastEventAt: null,
        updatedAt: null,
        createdAt: null,
      }))
      .sort(compareNotices)
  }

  const blockedKeys = new Set(
    (blockedRows || []).map((row) => alertKey(row.athlete_id, row.alert_type))
  )

  const openByKey = new Map(
    (openRows || []).map((row) => [alertKey(row.athlete_id, row.alert_type), row])
  )

  const now = new Date().toISOString()

  for (const alert of notices) {
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
            kind: "notice",
            status: "active",
            context: alert.context,
            last_event_at: now,
            event_count: 1,
            updated_at: now,
          },
        ])
        .select("*")
        .single()

      if (inserted) openByKey.set(key, inserted)
      continue
    }

    const bump = shouldBumpEventCount(existing.last_event_at, now)
    const patch = {
      severity: alert.severity,
      kind: "notice",
      context: alert.context,
      updated_at: now,
      last_event_at: now,
    }
    if (bump) {
      patch.event_count = (existing.event_count || 1) + 1
    }

    await supabase.from("psychologist_alerts").update(patch).eq("id", existing.id)
  }

  for (const row of openRows || []) {
    const key = alertKey(row.athlete_id, row.alert_type)
    if (!computedKeys.has(key) && row.status === "active") {
      await supabase
        .from("psychologist_alerts")
        .update({
          status: "resolved",
          resolved_at: now,
          context: { ...(row.context || {}), autoResolved: true },
          updated_at: now,
        })
        .eq("id", row.id)
    }
  }

  return loadVisiblePsychologistAlerts(supabase, athletes)
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
    .eq("kind", "notice")
    .select("*")

  return data || []
}

export async function dismissPsychologistAlert(supabase, alertId, psychologistId) {
  return updatePsychologistAlertStatus(supabase, alertId, {
    status: "dismissed",
    psychologistId,
  })
}

export async function closeNotice(supabase, alertId, psychologistId, extra = {}) {
  return updatePsychologistAlertStatus(supabase, alertId, {
    status: "resolved",
    psychologistId,
    ...extra,
  })
}

export async function postponeNotice(supabase, alertId, untilIso) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("psychologist_alerts")
    .update({
      postponed_until: untilIso,
      updated_at: now,
    })
    .eq("id", alertId)
    .select("*")
    .single()

  if (error) throw error
  return data
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
    patch.postponed_until = null
  }

  if (status === "dismissed") {
    patch.dismissed_at = now
    patch.dismissed_by = psychologistId
    patch.postponed_until = null
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
    .eq("kind", "notice")
    .in("status", PANEL_STATUSES)
    .order("updated_at", { ascending: false })

  if (error) return []
  return filterVisibleNotices((data || []).map((row) => mapDbRow(row, athleteMap)))
}
