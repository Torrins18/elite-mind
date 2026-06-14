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
            "Ets un/a psicòleg/òloga de l'esport escrivint notes clíniques breus per a un company. Escriu com una persona, no com un informe tècnic. Una o dues frases fluides, màxim ~40 paraules. No llistis mètriques amb X/10, no facis seccions tipus 'Context clínic', no posis cometes ni bullet points. Connecta tendències (energia, son, estrès, ànim) amb el que cal vigilar. No diagnostiquis. Respon només JSON: {\"tone\":\"positive|neutral|warning|danger\",\"text\":\"...\"}.",
        },
        {
          role: "user",
          content: `Idioma: ${lang}.

Exemple de to desitjat (català):
"Veient els resultats dels últims dies, l'esportista està més cansat i amb menys energia que fa uns dies; convé controlar perquè tampoc dorm bé."

Genera una lectura similar per a aquestes dades:
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
  const name = context.athlete?.name || (lang === "ca" ? "l'esportista" : "el deportista")
  const latest = context.metrics?.latest
  const trends = context.metrics?.trends || {}
  const risk = context.metrics?.risk || "neutral"
  const note = context.qualitative?.personalNotes?.[0]?.text || ""

  if (!latest) {
    return {
      tone: "neutral",
      text:
        lang === "ca"
          ? `Veient els registres disponibles, ${name} encara no té autoavaluacions recents.`
          : `Viendo los registros disponibles, ${name} aún no tiene autoevaluaciones recientes.`,
    }
  }

  const noteMentionsSleep = /dorm|son|descans/i.test(note)
  const signals = {
    energyDown: (trends.energy ?? 0) <= -0.5 || latest.energy <= 5,
    sleepBad: (trends.sleep ?? 0) <= -0.5 || latest.sleep <= 4 || noteMentionsSleep,
    stressUp: (trends.stress ?? 0) >= 0.5 || latest.stress >= 7,
    moodDown: (trends.mood ?? 0) <= -0.5 || latest.mood <= 4,
    noteMentionsFatigue: /cansad|cansat|fatig|esgot|malament|mal descans/i.test(note),
  }

  if (lang === "ca") {
    return buildCaNarrative(name, risk, signals)
  }

  return buildEsNarrative(name, risk, signals)
}

function buildCaNarrative(
  name: string,
  risk: string,
  signals: {
    energyDown: boolean
    sleepBad: boolean
    stressUp: boolean
    moodDown: boolean
    noteMentionsFatigue: boolean
  }
) {
  const intro = `Veient els resultats dels últims dies, ${name}`

  if (risk === "high") {
    return {
      tone: "danger",
      text: `${intro} acumula senyals de sobrecàrrega emocional; convé prioritzar contacte i revisar càrrega avui.`,
    }
  }

  if (
    !signals.energyDown &&
    !signals.sleepBad &&
    !signals.stressUp &&
    !signals.moodDown &&
    !signals.noteMentionsFatigue
  ) {
    return {
      tone: risk === "low" ? "positive" : "neutral",
      text:
        risk === "low"
          ? `${intro} es manté estable i respon bé als últims registres.`
          : `${intro} es manté en una línia acceptable; continuar el seguiment habitual.`,
    }
  }

  const parts: string[] = []

  if (signals.energyDown) {
    parts.push("està més cansat i amb menys energia que fa uns dies")
  } else if (signals.moodDown) {
    parts.push("mostra un ànim més baix que fa uns dies")
  } else if (signals.noteMentionsFatigue) {
    parts.push("refereix cansament als darrers registres")
  }

  if (signals.stressUp && !signals.energyDown) {
    parts.push("percep més pressió o estrès que abans")
  }

  let text = `${intro} ${parts.join(" i ")}`

  if (signals.sleepBad) {
    text += parts.length
      ? "; convé controlar perquè tampoc dorm bé"
      : " dorm poc bé darrerament; convé fer seguiment del descans"
  } else if (signals.noteMentionsFatigue) {
    text += parts.length
      ? "; en les notes parla de cansament o mal descans, val la pena repassar-ho"
      : " comenta cansament o mal descans a les notes; convé fer seguiment"
  }

  return {
    tone: riskToTone(risk),
    text: `${text}.`,
  }
}

function buildEsNarrative(
  name: string,
  risk: string,
  signals: {
    energyDown: boolean
    sleepBad: boolean
    stressUp: boolean
    moodDown: boolean
    noteMentionsFatigue: boolean
  }
) {
  const intro = `Viendo los resultados de los últimos días, ${name}`

  if (risk === "high") {
    return {
      tone: "danger",
      text: `${intro} acumula señales de sobrecarga emocional; conviene priorizar contacto y revisar carga hoy.`,
    }
  }

  if (
    !signals.energyDown &&
    !signals.sleepBad &&
    !signals.stressUp &&
    !signals.moodDown &&
    !signals.noteMentionsFatigue
  ) {
    return {
      tone: risk === "low" ? "positive" : "neutral",
      text:
        risk === "low"
          ? `${intro} se mantiene estable y responde bien a los últimos registros.`
          : `${intro} se mantiene en una línea aceptable; continuar el seguimiento habitual.`,
    }
  }

  const parts: string[] = []

  if (signals.energyDown) {
    parts.push("está más cansado y con menos energía que hace unos días")
  } else if (signals.moodDown) {
    parts.push("muestra un ánimo más bajo que hace unos días")
  } else if (signals.noteMentionsFatigue) {
    parts.push("refiere cansancio en los registros recientes")
  }

  if (signals.stressUp && !signals.energyDown) {
    parts.push("percibe más presión o estrés que antes")
  }

  let text = `${intro} ${parts.join(" y ")}`

  if (signals.sleepBad) {
    text += parts.length
      ? "; conviene controlar porque tampoco duerme bien"
      : " duerme mal últimamente; conviene hacer seguimiento del descanso"
  } else if (signals.noteMentionsFatigue) {
    text += parts.length
      ? "; en las notas habla de cansancio o mal descanso, vale la pena repasarlo"
      : " comenta cansancio o mal descanso en las notas; conviene hacer seguimiento"
  }

  return {
    tone: riskToTone(risk),
    text: `${text}.`,
  }
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

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}
