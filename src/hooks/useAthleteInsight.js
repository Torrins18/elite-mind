import { useEffect, useState } from "react"
import { fetchAthleteInsight } from "../lib/insights/fetchAthleteInsight"

export function useAthleteInsight({
  athlete,
  checkIns,
  assessment,
  teamName,
  lang,
  t,
  enabled = true,
}) {
  const [insight, setInsight] = useState(null)
  const [source, setSource] = useState(null)
  const [loading, setLoading] = useState(false)

  const athleteId = athlete?.id
  const latestDate = checkIns[0]?.check_in_date || ""
  const assessmentKey = assessment?.updated_at || assessment?.submitted_at || ""

  useEffect(() => {
    if (!enabled || !athleteId) {
      setInsight(null)
      setSource(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchAthleteInsight({
      athlete,
      checkIns,
      assessment,
      teamName,
      lang,
      t,
    })
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
  }, [athleteId, latestDate, assessmentKey, teamName, lang, enabled, athlete, checkIns, assessment, t])

  return { insight, source, loading }
}
