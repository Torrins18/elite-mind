import { supabase } from "../supabase"
import {
  getPendingCoachInvite,
  clearPendingCoachInvite,
  getPendingAthleteJoin,
  clearPendingAthleteJoin,
} from "./invites"

export async function fetchOrCreateProfile(session) {
  const userId = session.user.id
  const metaRole = session.user.user_metadata?.role
  const isCoachMeta = metaRole === "coach"

  const { data: rpcData, error: rpcError } = await supabase.rpc("ensure_my_profile")

  let profile = rpcData && !rpcError ? rpcData : null

  if (!profile) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (data) profile = data
    else if (!error || error.code === "PGRST116") {
      const name =
        session.user.user_metadata?.name ||
        session.user.email?.split("@")[0] ||
        "Athlete"

      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            id: userId,
            name,
            role: isCoachMeta ? "coach" : "athlete",
            approved: !isCoachMeta,
          },
        ])
        .select()
        .single()

      if (created) profile = created
      else if (insertError) {
        return { profile: null, error: insertError.message }
      }
    }
  }

  if (!profile) {
    return {
      profile: null,
      error: rpcError?.message || "No se pudo cargar el perfil.",
    }
  }

  const pendingCoachInvite = getPendingCoachInvite()
  if (pendingCoachInvite && profile.role === "coach" && !profile.approved) {
    await supabase.rpc("consume_coach_invite", { invite_token: pendingCoachInvite })
    clearPendingCoachInvite()

    const { data: refreshed } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (refreshed) profile = refreshed
  }

  const pendingAthleteJoin = getPendingAthleteJoin()
  if (pendingAthleteJoin && profile.role === "athlete" && !profile.team_id) {
    await supabase.rpc("consume_athlete_invite", { invite_token: pendingAthleteJoin })
    clearPendingAthleteJoin()

    const { data: refreshed } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (refreshed) profile = refreshed
  }

  return { profile, error: null }
}
