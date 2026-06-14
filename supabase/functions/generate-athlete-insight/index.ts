import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { synthesizeAthleteNarrative } from "./synthesize.ts"

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

  const synthesized = synthesizeAthleteNarrative(context as Record<string, unknown>)
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
            "Ets un/a psicòleg/òloga de l'esport escrivint notes clíniques per a un company. Escriu com una persona, no com un informe. 2-3 frases fluides, màxim ~70 paraules. No llistis mètriques amb X/10 ni seccions tipus 'Context clínic'. Integra tendències (energia, son, estrès, ànim, focus), reflexió setmanal (performance, implicació, paraules d'ànim, esdeveniments, objectius), notes personals i dades rellevants de l'avaluació inicial (son, pressió, confiança, equilibri, suport). Connecta-ho amb el que cal vigilar. No diagnostiquis. Respon només JSON: {\"tone\":\"positive|neutral|warning|danger\",\"text\":\"...\"}.",
        },
        {
          role: "user",
          content: `Idioma: ${lang}.

Exemple de to desitjat (català):
"Veient els resultats dels últims dies, l'esportista està més cansat i amb menys energia que fa uns dies; convé controlar perquè tampoc dorm bé. A les notes comenta que ha dormit malament i el seu objectiu proper és mantenir la calma."

Genera una lectura similar usant totes les dades disponibles:
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

function normalizeTone(tone: unknown) {
  const value = String(tone || "neutral")
  if (["positive", "neutral", "warning", "danger"].includes(value)) return value
  return "neutral"
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
