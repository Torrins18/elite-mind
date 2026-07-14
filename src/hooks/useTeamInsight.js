import { useEffect, useState } from "react"
import { buildTeamInsightContext } from "../lib/insights/buildTeamInsightContext"
import { fetchTeamInsight } from "../lib/insights/fetchTeamInsight"

export function useTeamInsight({
  teamName,
  athletes,
  summary,
  weeklyTrend,
  complianceTrend,
  lang,
  t,
  enabled = true,
}) {
  const [insight, setInsight] = useState(null)
  const [source, setSource] = useState(null)
  const [loading, setLoading] = useState(false)

  const trendKey = (weeklyTrend || [])
    .slice(-4)
    .map((row) => `${row.weekDate}:${row.mental}`)
    .join("|")
  const complianceKey = (complianceTrend || [])
    .slice(-4)
    .map((row) => `${row.weekDate}:${row.compliance}`)
    .join("|")

  useEffect(() => {
    if (!enabled || !teamName || !athletes?.length) {
      setInsight(null)
      setSource(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const context = buildTeamInsightContext({
      teamName,
      athletes,
      summary,
      weeklyTrend,
      complianceTrend,
      lang,
    })

    fetchTeamInsight({ context, weeklyTrend, complianceTrend, t })
      .then((result) => {
        if (cancelled) return
        setInsight(result.insight)
        setSource(result.source)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamName, athletes, summary, trendKey, complianceKey, lang, enabled, weeklyTrend, complianceTrend, t])

  return { insight, source, loading }
}
