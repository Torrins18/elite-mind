import { WEEKLY_REFLECTIONS } from "../data/weeklyReflections"
import { weekStartSundayISO } from "./checkInSchedule"

const STORAGE_PREFIX = "zm-weekly-reflection:"

function storageKey(athleteId) {
  return `${STORAGE_PREFIX}${athleteId}`
}

function defaultState() {
  return {
    shownIndices: [],
    acknowledgedWeek: null,
    currentWeekStart: null,
    currentWeekIndex: null,
  }
}

function loadState(athleteId) {
  try {
    const raw = localStorage.getItem(storageKey(athleteId))
    if (!raw) return defaultState()
    return { ...defaultState(), ...JSON.parse(raw) }
  } catch {
    return defaultState()
  }
}

function saveState(athleteId, state) {
  localStorage.setItem(storageKey(athleteId), JSON.stringify(state))
}

/** Show reflection only when starting a new weekly review (not after completion this week). */
export function shouldShowWeeklyReflection(athleteId, today, weeklyDoneThisWeek) {
  if (weeklyDoneThisWeek) return false
  const weekStart = weekStartSundayISO(today)
  const state = loadState(athleteId)
  return state.acknowledgedWeek !== weekStart
}

function pickNextIndex(shownIndices) {
  const all = WEEKLY_REFLECTIONS.map((_, index) => index)
  let pool = all.filter((index) => !shownIndices.includes(index))

  if (!pool.length) {
    pool = all
    return { index: pool[0], shownIndices: [pool[0]] }
  }

  return { index: pool[0], shownIndices: [...shownIndices, pool[0]] }
}

/** Resolve the reflection text for the current week (stable until acknowledged). */
export function getWeeklyReflectionText(athleteId, lang, today) {
  const weekStart = weekStartSundayISO(today)
  const state = loadState(athleteId)
  const locale = lang === "ca" ? "ca" : "es"

  if (state.currentWeekStart === weekStart && state.currentWeekIndex != null) {
    return WEEKLY_REFLECTIONS[state.currentWeekIndex][locale]
  }

  const { index, shownIndices } = pickNextIndex(state.shownIndices)
  saveState(athleteId, {
    ...state,
    shownIndices,
    currentWeekStart: weekStart,
    currentWeekIndex: index,
  })

  return WEEKLY_REFLECTIONS[index][locale]
}

export function acknowledgeWeeklyReflection(athleteId, today) {
  const weekStart = weekStartSundayISO(today)
  const state = loadState(athleteId)
  saveState(athleteId, {
    ...state,
    acknowledgedWeek: weekStart,
  })
}
