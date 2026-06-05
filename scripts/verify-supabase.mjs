import { createClient } from "@supabase/supabase-js"

const url = process.env.VITE_SUPABASE_URL || "https://wdibvfgvgmpgorzaraud.supabase.co"
const key =
  process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_v6Oex6NVYMrWQQbMI7RtLQ_0oZIKnYJ"

const supabase = createClient(url, key)

const checks = []

async function check(name, fn) {
  try {
    const result = await fn()
    checks.push({ name, ok: true, ...result })
  } catch (e) {
    checks.push({ name, ok: false, error: e.message })
  }
}

await check("teams", async () => {
  const { data, error } = await supabase.from("teams").select("name").limit(20)
  if (error) throw error
  return { count: data?.length ?? 0, sample: data?.map((t) => t.name) }
})

await check("profiles columns", async () => {
  const { data, error } = await supabase.from("profiles").select("id, role, approved, is_rejected, date_of_birth, team_id, initial_assessment_completed_at").limit(1)
  if (error) throw error
  return { hasRow: Boolean(data?.length) }
})

await check("check_ins", async () => {
  const { count, error } = await supabase.from("check_ins").select("*", { count: "exact", head: true })
  if (error) throw error
  return { count }
})

await check("coach_invites", async () => {
  const { count, error } = await supabase.from("coach_invites").select("*", { count: "exact", head: true })
  if (error) throw error
  return { count }
})

await check("athlete_initial_assessments", async () => {
  const { count, error } = await supabase.from("athlete_initial_assessments").select("*", { count: "exact", head: true })
  if (error) throw error
  return { count }
})

await check("rpc validate_coach_invite", async () => {
  const { data, error } = await supabase.rpc("validate_coach_invite", {
    invite_token: "00000000-0000-0000-0000-000000000000",
  })
  if (error) throw error
  return { result: data }
})

await check("rpc ensure_my_profile (no auth)", async () => {
  const { error } = await supabase.rpc("ensure_my_profile")
  return { expectedAuthError: error?.message?.includes("Not authenticated") ?? false, message: error?.message }
})

await check("profiles by role", async () => {
  const { data, error } = await supabase.from("profiles").select("role")
  if (error) throw error
  const counts = (data || []).reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1
    return acc
  }, {})
  return { counts, total: data?.length ?? 0 }
})

console.log(JSON.stringify({ url, checks }, null, 2))

const failed = checks.filter((c) => !c.ok)
process.exit(failed.length ? 1 : 0)
