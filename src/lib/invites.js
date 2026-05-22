import { supabase } from "../supabase"

const INVITE_STORAGE_KEY = "elite-mind-coach-invite"

export function getInviteFromUrl() {
  return new URLSearchParams(window.location.search).get("invite")
}

export function savePendingInvite(token) {
  if (token) localStorage.setItem(INVITE_STORAGE_KEY, token)
}

export function getPendingInvite() {
  return localStorage.getItem(INVITE_STORAGE_KEY)
}

export function clearPendingInvite() {
  localStorage.removeItem(INVITE_STORAGE_KEY)
}

export async function validateCoachInvite(token) {
  if (!token) return false

  const { data, error } = await supabase.rpc("validate_coach_invite", {
    invite_token: token,
  })

  return !error && data === true
}
