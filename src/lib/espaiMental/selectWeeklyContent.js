import { weekStartSundayISO } from "../checkInSchedule"
import { loadEspaiMentalCatalog, loadEspaiMentalCatalogSync } from "./contentProvider"
import { ESPAI_MENTAL_TYPE_EMOJI } from "./types"

const STORAGE_PREFIX = "zm-espai-mental:"

function storageKey(athleteId) {
  return `${STORAGE_PREFIX}${athleteId}`
}

function defaultState() {
  return {
    shownIds: [],
    currentWeekStart: null,
    currentItemId: null,
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

function pickNextItem(pool, shownIds) {
  let candidates = pool.filter((item) => !shownIds.includes(item.id))

  if (!candidates.length) {
    candidates = pool
    const index = Math.floor(Math.random() * candidates.length)
    return { item: candidates[index], shownIds: [candidates[index].id] }
  }

  const index = Math.floor(Math.random() * candidates.length)
  const item = candidates[index]
  return { item, shownIds: [...shownIds, item.id] }
}

/**
 * @param {import('./types.js').EspaiMentalItem} item
 * @param {'es' | 'ca'} lang
 * @param {(key: string) => string} t
 * @returns {import('./types.js').EspaiMentalDisplay}
 */
export function toDisplayItem(item, lang, t) {
  const locale = lang === "ca" ? "ca" : "es"
  const copy = item[locale]
  const typeKey = `espaiMental.types.${item.type}`

  return {
    id: item.id,
    type: item.type,
    emoji: ESPAI_MENTAL_TYPE_EMOJI[item.type],
    label: copy.title || t(typeKey),
    body: copy.body,
    source: item.source,
  }
}

/**
 * Resolves one Espai Mental card for the current week (stable until next week).
 *
 * @param {string} athleteId
 * @param {string} today ISO date
 * @param {'es' | 'ca'} lang
 * @param {(key: string) => string} t
 * @param {import('./types.js').EspaiMentalContext} [context]
 */
export function getWeeklyEspaiMentalContent(athleteId, today, lang, t, context = {}) {
  const weekStart = weekStartSundayISO(today)
  const state = loadState(athleteId)
  const pool = loadEspaiMentalCatalogSync(context)

  if (!pool.length) return null

  if (state.currentWeekStart === weekStart && state.currentItemId) {
    const existing = pool.find((item) => item.id === state.currentItemId)
    if (existing) return toDisplayItem(existing, lang, t)
  }

  const { item, shownIds } = pickNextItem(pool, state.shownIds)
  saveState(athleteId, {
    shownIds,
    currentWeekStart: weekStart,
    currentItemId: item.id,
  })

  return toDisplayItem(item, lang, t)
}

/**
 * Async resolver for future psychologist catalog merges.
 */
export async function resolveWeeklyEspaiMentalContent(
  athleteId,
  today,
  lang,
  t,
  context = {},
  options = {}
) {
  const catalog = await loadEspaiMentalCatalog(context, options)
  const filtered = catalog.filter((item) => {
    const syncPool = loadEspaiMentalCatalogSync(context)
    return syncPool.some((row) => row.id === item.id) || item.source === "psychologist"
  })

  const weekStart = weekStartSundayISO(today)
  const state = loadState(athleteId)
  const pool = filtered.length ? filtered : catalog

  if (!pool.length) return null

  if (state.currentWeekStart === weekStart && state.currentItemId) {
    const existing = pool.find((item) => item.id === state.currentItemId)
    if (existing) return toDisplayItem(existing, lang, t)
  }

  const { item, shownIds } = pickNextItem(pool, state.shownIds)
  saveState(athleteId, {
    shownIds,
    currentWeekStart: weekStart,
    currentItemId: item.id,
  })

  return toDisplayItem(item, lang, t)
}
