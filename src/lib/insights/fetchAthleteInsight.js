import { supabase } from "../../supabase"
import { buildAthleteInsightContext } from "./buildAthleteInsightContext"
import { synthesizeAthleteNarrative } from "./synthesizeAthleteNarrative"

export async function fetchAthleteInsight({
  athlete,
  checkIns,
  assessment,
  teamName,
  lang,
  t,
}) {
  const fallback = () => {
    const context = buildAthleteInsightContext({
      athlete,
      checkIns,
      assessment,
      teamName,
      lang,
    })
    return {
      insight: synthesizeAthleteNarrative(context),
      source: "synthesis",
    }
  }

  if (!athlete) return { insight: null, source: null }

  const context = buildAthleteInsightContext({
    athlete,
    checkIns,
    assessment,
    teamName,
    lang,
  })

  try {
    const { data, error } = await supabase.functions.invoke("generate-athlete-insight", {
      body: context,
    })

    if (error || !data?.text) {
      return fallback()
    }

    return {
      insight: {
        tone: data.tone || "neutral",
        text: data.text,
      },
      source: data.source || "ai",
    }
  } catch {
    return fallback()
  }
}
