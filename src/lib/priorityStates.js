const TABLE = "priority_states"
const HIDDEN_STATUSES = new Set(["reviewed", "dismissed"])

export function isPriorityHidden(state) {
  return Boolean(state && HIDDEN_STATUSES.has(state.status))
}

export function splitPriorities(items, states = {}) {
  const active = []
  const suppressed = []

  for (const item of items) {
    const state = states[item.priorityKey]
    if (isPriorityHidden(state)) {
      suppressed.push({ ...item, state })
    } else {
      active.push(item)
    }
  }

  return { active, suppressed }
}

export function buildPriorityHistory(states = {}, limit = 12) {
  return Object.values(states)
    .filter((row) => HIDDEN_STATUSES.has(row.status))
    .sort((a, b) => {
      const aTime = a.reviewed_at || a.dismissed_at || a.updated_at || ""
      const bTime = b.reviewed_at || b.dismissed_at || b.updated_at || ""
      return bTime.localeCompare(aTime)
    })
    .slice(0, limit)
}

export async function loadPriorityStates(supabase, psychologistId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("psychologist_id", psychologistId)

  if (error) {
    if (error.message?.includes("priority_states")) return {}
    console.warn("priority_states load:", error.message)
    return {}
  }

  return Object.fromEntries((data || []).map((row) => [row.priority_key, row]))
}

export async function upsertPriorityState(
  supabase,
  psychologistId,
  priorityKey,
  status,
  { metadata = null } = {}
) {
  const now = new Date().toISOString()
  const payload = {
    psychologist_id: psychologistId,
    priority_key: priorityKey,
    status,
    updated_at: now,
  }

  if (metadata) payload.metadata = metadata

  if (status === "reviewed") {
    payload.reviewed_at = now
    payload.reviewed_by = psychologistId
  }

  if (status === "dismissed") {
    payload.dismissed_at = now
    payload.dismissed_by = psychologistId
  }

  if (status === "resolved") {
    payload.resolved_at = now
  }

  const { error } = await supabase.from(TABLE).upsert(payload, {
    onConflict: "psychologist_id,priority_key",
  })

  if (error) throw error
  return payload
}

export async function resolvePriorityStates(supabase, psychologistId, currentKeys, states) {
  const current = new Set(currentKeys)
  const updates = []

  for (const [priorityKey, state] of Object.entries(states)) {
    if (state.status === "resolved") continue
    if (current.has(priorityKey)) continue
    updates.push(
      upsertPriorityState(supabase, psychologistId, priorityKey, "resolved", {
        metadata: state.metadata,
      })
    )
  }

  if (!updates.length) return states

  await Promise.allSettled(updates)

  const next = { ...states }
  for (const key of Object.keys(next)) {
    if (!current.has(key) && next[key].status !== "resolved") {
      next[key] = { ...next[key], status: "resolved", resolved_at: new Date().toISOString() }
    }
  }
  return next
}

export function priorityItemMetadata(item) {
  return {
    labelKey: item.key,
    params: item.params || {},
    tone: item.tone,
  }
}
