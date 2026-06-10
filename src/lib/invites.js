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

export async function validateCoachInvite(token, { timeoutMs = 8000 } = {}) {
  if (!token) return false

  const rpc = supabase.rpc("validate_coach_invite", {
    invite_token: token,
  })

  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("invite_timeout")), timeoutMs)
  })

  try {
    const { data, error } = await Promise.race([rpc, timeout])
    return !error && data === true
  } catch {
    return false
  } finally {
    window.clearTimeout(timeoutId)
  }
}
