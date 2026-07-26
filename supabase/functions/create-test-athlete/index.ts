/**
 * TEMPORARY (development only)
 *
 * Aquesta és una solució temporal per facilitar les proves internes durant el
 * desenvolupament. Abans del llançament s'haurà de revisar el flux definitiu
 * d'autenticació dels esportistes.
 *
 * Crea / reutilitza un esportista de prova via RPC `dev_ensure_test_athlete`
 * (email confirmat, sense correu de verificació, is_test_athlete = true).
 *
 * NO afecta el registre públic (signUp) dels comptes reals.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type Body = {
  email?: string
  password?: string
  name?: string
  isTestAthlete?: boolean
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function isAllowedTestEmail(email: string) {
  const value = email.toLowerCase()
  return (
    value.endsWith("@zonamental.app") ||
    value.endsWith(".test") ||
    value.includes("+test@")
  )
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: "Missing Supabase configuration" }, 500)
  }

  const authHeader = req.headers.get("Authorization") || ""
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser()

  if (callerError || !caller) {
    return json({ error: "Unauthorized" }, 401)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerProfile, error: profileError } = await admin
    .from("profiles")
    .select("role, is_platform_admin")
    .eq("id", caller.id)
    .maybeSingle()

  if (profileError) {
    return json({ error: profileError.message }, 500)
  }

  const allowed =
    callerProfile?.is_platform_admin === true || callerProfile?.role === "psychologist"

  if (!allowed) {
    return json({ error: "Forbidden" }, 403)
  }

  const body = (await req.json().catch(() => ({}))) as Body

  // TEMPORARY DEV: només quan isTestAthlete = true (no crear comptes reals confirmats)
  if (body.isTestAthlete !== true) {
    return json({ error: "isTestAthlete must be true" }, 400)
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password || ""
  const name = body.name?.trim() || (email ? email.split("@")[0] : "Prova Esportista")

  if (!email || !isAllowedTestEmail(email)) {
    return json(
      {
        error:
          "Test athletes must use @zonamental.app (or .test / +test@) emails during development",
      },
      400
    )
  }

  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400)
  }

  const { data: userId, error: rpcError } = await admin.rpc("dev_ensure_test_athlete", {
    p_email: email,
    p_password: password,
    p_name: name,
  })

  if (rpcError) {
    return json({ error: rpcError.message }, 400)
  }

  return json({
    id: userId,
    email,
    isTestAthlete: true,
  })
})
