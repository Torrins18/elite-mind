import { supabase } from "../../supabase"
import { buildTeamEvolutionInsight } from "./buildTeamEvolutionInsight"

export async function fetchTeamInsight({ context, weeklyTrend, complianceTrend, t }) {
  const fallback = () => ({
    insight: buildTeamEvolutionInsight({ weeklyTrend, complianceTrend, t }),
    source: "synthesis",
  })

  if (!context) return { insight: null, source: null }

  try {
    const { data, error } = await supabase.functions.invoke("generate-team-insight", {
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
