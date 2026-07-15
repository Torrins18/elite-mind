import { supabase } from "../../supabase"

const SESSION_KEY = "zm-product-session"
const REVIEW_START_KEY = "zm-review-start"

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

let context = {
  role: null,
  clubId: null,
  teamId: null,
  enabled: true,
}

export function initProductAnalytics(profile) {
  if (!profile || profile.is_platform_admin) {
    context.enabled = false
    return
  }

  context = {
    role: profile.role || null,
    clubId: profile.club_id || null,
    teamId: profile.team_id || null,
    enabled: true,
  }
}

export function disableProductAnalytics() {
  context.enabled = false
}

/**
 * @param {string} eventName
 * @param {string} category
 * @param {Record<string, unknown>} [properties]
 * @param {{ experimentId?: string, variant?: string }} [experiment]
 */
export async function trackProductEvent(eventName, category, properties = {}, experiment = {}) {
  if (!context.enabled) return

  const payload = {
    event_name: eventName,
    event_category: category,
    user_role: context.role,
    club_id: context.clubId,
    team_id: context.teamId,
    session_id: getSessionId(),
    properties,
    experiment_id: experiment.experimentId || null,
    variant: experiment.variant || null,
  }

  const { error } = await supabase.from("product_events").insert([payload])
  if (error) {
    console.debug("[product-analytics]", error.message)
  }
}

export function trackPageView(page) {
  return trackProductEvent(page, "navigation", { page })
}

export function startWeeklyReviewTracking() {
  try {
    sessionStorage.setItem(REVIEW_START_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
  return trackProductEvent("review_started", "weekly_review")
}

export function completeWeeklyReviewTracking() {
  let durationMs = null
  try {
    const started = Number(sessionStorage.getItem(REVIEW_START_KEY))
    if (started) durationMs = Date.now() - started
    sessionStorage.removeItem(REVIEW_START_KEY)
  } catch {
    /* ignore */
  }
  return trackProductEvent("review_completed", "weekly_review", {
    duration_ms: durationMs,
  })
}

export function abandonWeeklyReviewTracking(step) {
  return trackProductEvent("review_abandoned", "weekly_review", { step })
}

export function trackMentalTrainingShown(topic, programWeek) {
  return trackProductEvent("mental_training_shown", "mental_training", {
    topic,
    program_week: programWeek,
  })
}

export function trackMentalTrainingRead(topic, programWeek, dwellMs) {
  return trackProductEvent("mental_training_read", "mental_training", {
    topic,
    program_week: programWeek,
    dwell_ms: dwellMs,
  })
}

export function trackFeatureUsed(featureName, meta = {}) {
  return trackProductEvent(featureName, "feature", meta)
}

export function trackExperimentEvent(eventName, category, properties, experimentId, variant) {
  return trackProductEvent(eventName, category, properties, { experimentId, variant })
}

export function isPlatformAdmin(profile) {
  return profile?.is_platform_admin === true
}
