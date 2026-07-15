/**
 * Builds automatic product insights from analytics snapshot (no individual data).
 * @param {object} snapshot
 * @param {(key: string, vars?: object) => string} t
 */
export function buildProductInsights(snapshot, t) {
  if (!snapshot) return []

  const insights = []
  const trend = snapshot.engagement?.completion_trend || []
  const current = trend[trend.length - 1]
  const previous = trend[trend.length - 2]

  if (current && previous && previous.rate_pct > 0) {
    const delta = current.rate_pct - previous.rate_pct
    if (Math.abs(delta) >= 5) {
      insights.push(
        t(delta < 0 ? "productAnalytics.insight.completionDrop" : "productAnalytics.insight.completionUp", {
          delta: Math.abs(Math.round(delta)),
        })
      )
    }
  }

  const review = snapshot.review_completion || {}
  if (review.median_ms && review.median_ms > 60000) {
    insights.push(
      t("productAnalytics.insight.reviewSlow", {
        seconds: Math.round(review.median_ms / 1000),
      })
    )
  }

  if (review.abandonment_rate_pct >= 10) {
    insights.push(
      t("productAnalytics.insight.reviewAbandon", {
        pct: review.abandonment_rate_pct,
      })
    )
  }

  if (review.avg_abandon_step != null && review.avg_abandon_step > 0) {
    insights.push(
      t("productAnalytics.insight.abandonStep", {
        step: review.avg_abandon_step,
      })
    )
  }

  const retention = snapshot.retention || {}
  if (retention.missed_two_weeks_pct >= 25) {
    insights.push(
      t("productAnalytics.insight.missedTwoWeeks", {
        pct: retention.missed_two_weeks_pct,
      })
    )
  }

  const appt = snapshot.appointments || {}
  if (appt.pending > 5 && (appt.completed || 0) < appt.pending) {
    insights.push(t("productAnalytics.insight.appointmentsPending", { count: appt.pending }))
  }

  const mental = snapshot.mental_training || {}
  if (mental.shown > 0 && mental.read > 0) {
    const readRate = Math.round((mental.read / mental.shown) * 100)
    if (readRate >= 40) {
      insights.push(t("productAnalytics.insight.mentalTrainingEngagement", { pct: readRate }))
    }
  }

  const messages = snapshot.messages || {}
  if (messages.unread > 10) {
    insights.push(t("productAnalytics.insight.unreadMessages", { count: messages.unread }))
  }

  if (!insights.length) {
    insights.push(t("productAnalytics.insight.stable"))
  }

  return insights
}

export function formatDurationMs(ms) {
  if (ms == null || Number.isNaN(ms)) return "—"
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
