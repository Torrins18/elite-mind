import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type InsightContext = {
  lang?: "ca" | "es"
  athlete?: {
    name?: string
    team?: string | null
    dateOfBirth?: string | null
  }
  metrics?: {
    latest?: {
      date?: string
      mood?: number
      stress?: number
      sleep?: number
      energy?: number
      focus?: number
      performance?: number | null
      involvement?: number | null
    } | null
    avg7?: Record<string, number>
    risk?: string
    daysSince?: number | null
    trends?: Record<string, number>
    weakAreas?: string[]
    totalEntries?: number
  }
  qualitative?: {
    personalNotes?: Array<{ date: string; text: string }>
    moodWords?: string[]
    moodEvents?: Array<{ date: string; text: string }>
    nextGoals?: Array<{ date: string; text: string }>
  }
  initialAssessment?: {
    personal?: Record<string, string>
    sleep?: Record<string, string>
    nutrition?: Record<string, string>
    sports?: Record<string, string>
    support?: Record<string, string>
  } | null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase configuration" }, 500)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const token = authHeader.replace(/^Bearer\s+/i, "")
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token)

  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401)
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "psychologist") {
    return json({ error: "Forbidden" }, 403)
  }

  const context = (await req.json().catch(() => ({}))) as InsightContext
  const openAiKey = Deno.env.get("OPENAI_API_KEY")

  if (openAiKey) {
    try {
      const aiInsight = await generateWithOpenAI(openAiKey, context)
      if (aiInsight?.text) {
        return json({ ...aiInsight, source: "ai" })
      }
    } catch (error) {
      console.error("OpenAI insight failed:", error)
    }
  }

  const synthesized = synthesizeInsight(context)
  return json({ ...synthesized, source: "synthesis" })
})

async function generateWithOpenAI(apiKey: string, context: InsightContext) {
  const lang = context.lang === "ca" ? "català" : "castellà"
  const payload = JSON.stringify(context, null, 2)

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Ets un/a assistent de psicologia de l'esport per a professionals. Genera lectures clíniques breus, factuals i accionables. No diagnostiquis. Màxim 2 frases i ~45 paraules. Respon només JSON amb claus tone i text. tone ha de ser una de: positive, neutral, warning, danger.",
        },
        {
          role: "user",
          content: `Idioma de sortida: ${lang}.

Combina mètriques recents, notes personals, objectius, esdeveniments d'ànim i avaluació inicial (context personal, familiar, son, pressió, objectiu esportiu).

Prioritza:
1) risc o tendències rellevants
2) temes de notes i objectius recents
3) factors clau de l'avaluació inicial (suport familiar, pressió, son, objectiu actual)

Dades:
${payload}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content
  if (!content) return null

  const parsed = JSON.parse(content)
  return {
    tone: normalizeTone(parsed.tone),
    text: String(parsed.text || "").trim(),
  }
}

function synthesizeInsight(context: InsightContext) {
  const lang = context.lang === "ca" ? "ca" : "es"
  const name = context.athlete?.name || (lang === "ca" ? "L'esportista" : "El deportista")
  const latest = context.metrics?.latest
  const risk = context.metrics?.risk || "neutral"
  const avg7 = context.metrics?.avg7 || {}
  const notes = context.qualitative?.personalNotes || []
  const goals = context.qualitative?.nextGoals || []
  const events = context.qualitative?.moodEvents || []
  const assessment = context.initialAssessment

  const parts: string[] = []

  if (!latest) {
    return {
      tone: "neutral",
      text:
        lang === "ca"
          ? `${name} encara no té autoavaluacions recents per generar una lectura combinada.`
          : `${name} aún no tiene autoevaluaciones recientes para generar una lectura combinada.`,
    }
  }

  const metricLine =
    lang === "ca"
      ? `Ànim mitjà ${avg7.mood ?? latest.mood}/10, estrès ${avg7.stress ?? latest.stress}/10 i energia ${avg7.energy ?? latest.energy}/10 (7 dies).`
      : `Ánimo medio ${avg7.mood ?? latest.mood}/10, estrés ${avg7.stress ?? latest.stress}/10 y energía ${avg7.energy ?? latest.energy}/10 (7 días).`

  parts.push(
    lang === "ca"
      ? `${name} es manté ${riskLabel(risk, lang)} amb ${metricLine}`
      : `${name} se mantiene ${riskLabel(risk, lang)} con ${metricLine}`
  )

  const noteSnippet = notes[0]?.text
  const goalSnippet = goals[0]?.text
  const eventSnippet = events[0]?.text
  const qualitativeBits: string[] = []

  if (noteSnippet) {
    qualitativeBits.push(
      lang === "ca"
        ? `notes recents sobre «${truncate(noteSnippet, 90)}»`
        : `notas recientes sobre «${truncate(noteSnippet, 90)}»`
    )
  }
  if (goalSnippet) {
    qualitativeBits.push(
      lang === "ca"
        ? `objectiu proper: «${truncate(goalSnippet, 70)}»`
        : `objetivo próximo: «${truncate(goalSnippet, 70)}»`
    )
  }
  if (eventSnippet) {
    qualitativeBits.push(
      lang === "ca"
        ? `esdeveniment rellevant: «${truncate(eventSnippet, 70)}»`
        : `evento relevante: «${truncate(eventSnippet, 70)}»`
    )
  }

  const assessmentBits = extractAssessmentHighlights(assessment, lang)
  if (assessmentBits.length) {
    qualitativeBits.push(assessmentBits.join("; "))
  }

  if (qualitativeBits.length) {
    parts.push(
      lang === "ca"
        ? `Context clínic: ${qualitativeBits.join("; ")}.`
        : `Contexto clínico: ${qualitativeBits.join("; ")}.`
    )
  }

  return {
    tone: riskToTone(risk),
    text: parts.join(" "),
  }
}

function extractAssessmentHighlights(assessment: InsightContext["initialAssessment"], lang: "ca" | "es") {
  if (!assessment) return []

  const bits: string[] = []
  const sports = assessment.sports || {}
  const support = assessment.support || {}
  const personal = assessment.personal || {}
  const sleep = assessment.sleep || {}

  if (sports.currentGoal) {
    bits.push(
      lang === "ca"
        ? `objectiu inicial: ${sports.currentGoal}`
        : `objetivo inicial: ${sports.currentGoal}`
    )
  }
  if (sports.perceivedPressure) {
    bits.push(
      lang === "ca"
        ? `pressió percebuda ${sports.perceivedPressure}`
        : `presión percibida ${sports.perceivedPressure}`
    )
  }
  if (support.familySupport) {
    bits.push(
      lang === "ca"
        ? `suport familiar ${support.familySupport}`
        : `apoyo familiar ${support.familySupport}`
    )
  }
  if (personal.balanceDifficulty) {
    bits.push(
      lang === "ca"
        ? `equilibri vida-esport ${personal.balanceDifficulty}`
        : `equilibrio vida-deporte ${personal.balanceDifficulty}`
    )
  }
  if (sleep.sleepHoursTypical) {
    bits.push(
      lang === "ca"
        ? `son habitual ${sleep.sleepHoursTypical}`
        : `sueño habitual ${sleep.sleepHoursTypical}`
    )
  }

  return bits.slice(0, 3)
}

function riskLabel(risk: string, lang: "ca" | "es") {
  if (risk === "high") return lang === "ca" ? "en risc" : "en riesgo"
  if (risk === "medium") return lang === "ca" ? "en vigilància" : "en vigilancia"
  return lang === "ca" ? "estable" : "estable"
}

function riskToTone(risk: string) {
  if (risk === "high") return "danger"
  if (risk === "medium") return "warning"
  if (risk === "low") return "positive"
  return "neutral"
}

function normalizeTone(tone: unknown) {
  const value = String(tone || "neutral")
  if (["positive", "neutral", "warning", "danger"].includes(value)) return value
  return "neutral"
}

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}
