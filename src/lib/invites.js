import { supabase } from "../supabase"

const COACH_INVITE_STORAGE_KEY = "elite-mind-coach-invite"
const ATHLETE_JOIN_STORAGE_KEY = "elite-mind-athlete-join"

export function getCoachInviteFromUrl() {
  return new URLSearchParams(window.location.search).get("invite")
}

export function getAthleteJoinFromUrl() {
  return new URLSearchParams(window.location.search).get("join")
}

export function savePendingCoachInvite(token) {
  if (token) localStorage.setItem(COACH_INVITE_STORAGE_KEY, token)
}

export function getPendingCoachInvite() {
  return localStorage.getItem(COACH_INVITE_STORAGE_KEY)
}

export function clearPendingCoachInvite() {
  localStorage.removeItem(COACH_INVITE_STORAGE_KEY)
}

export function savePendingAthleteJoin(token) {
  if (token) localStorage.setItem(ATHLETE_JOIN_STORAGE_KEY, token)
}

export function getPendingAthleteJoin() {
  return localStorage.getItem(ATHLETE_JOIN_STORAGE_KEY)
}

export function clearPendingAthleteJoin() {
  localStorage.removeItem(ATHLETE_JOIN_STORAGE_KEY)
}

export function buildAthleteJoinLink(token) {
  return `${window.location.origin}/?join=${token}`
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

export async function validateAthleteJoin(token, { timeoutMs = 8000 } = {}) {
  if (!token) return null

  const rpc = supabase.rpc("validate_athlete_invite", {
    invite_token: token,
  })

  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("invite_timeout")), timeoutMs)
  })

  try {
    const { data, error } = await Promise.race([rpc, timeout])
    if (error || !data?.valid) return null
    return data
  } catch {
    return null
  } finally {
    window.clearTimeout(timeoutId)
  }
}

// Backward-compatible aliases used elsewhere
export const getInviteFromUrl = getCoachInviteFromUrl
export const savePendingInvite = savePendingCoachInvite
export const getPendingInvite = getPendingCoachInvite
export const clearPendingInvite = clearPendingCoachInvite
