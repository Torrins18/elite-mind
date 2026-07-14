import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { synthesizeTeamNarrative } from "./synthesize.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const context = await req.json().catch(() => ({}))
  const openAiKey = Deno.env.get("OPENAI_API_KEY")

  if (openAiKey) {
    try {
      const aiInsight = await generateWithOpenAI(openAiKey, context)
      if (aiInsight?.text) {
        return json({ ...aiInsight, source: "ai" })
      }
    } catch (error) {
      console.error("OpenAI team insight failed:", error)
    }
  }

  const synthesized = synthesizeTeamNarrative(context)
  return json({ ...synthesized, source: "synthesis" })
})

async function generateWithOpenAI(apiKey: string, context: Record<string, unknown>) {
  const lang = context.lang === "ca" ? "català" : "castellà"
  const scope = context.scope === "club" ? "club" : "equip"
  const payload = JSON.stringify(context, null, 2)

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Ets un/a psicòleg/òloga de l'esport escrivint un resum agregat per a un company. Escriu 2-4 frases fluides, màxim ~90 paraules. Resumeix evolució de les darreres setmanes (índexs EOR agregats i compliment), sense noms individuals. No diagnostiquis. No llistis mètriques amb format informe. Respon només JSON: {\"tone\":\"positive|neutral|warning|danger\",\"text\":\"...\"}.",
        },
        {
          role: "user",
          content: `Idioma: ${lang}. Àmbit: ${scope}.

Genera un resum d'evolució recent per al panell del psicòleg:
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
