import { ESPAI_MENTAL_LIBRARY } from "../../data/espaiMentalLibrary"

/**
 * Loads the full Espai Mental catalog (system + psychologist items).
 * Future: fetch psychologist rows from Supabase and merge here.
 *
 * @param {import('./types.js').EspaiMentalContext} [context]
 * @param {{ psychologistId?: string }} [options]
 * @returns {Promise<import('./types.js').EspaiMentalItem[]>}
 */
export async function loadEspaiMentalCatalog(context = {}, options = {}) {
  const systemItems = ESPAI_MENTAL_LIBRARY

  // Future: const customItems = await fetchPsychologistEspaiMental(options.psychologistId)
  void context
  void options

  return [...systemItems]
}

/**
 * Synchronous catalog for current client-only flow.
 * @param {import('./types.js').EspaiMentalContext} [context]
 * @returns {import('./types.js').EspaiMentalItem[]}
 */
export function loadEspaiMentalCatalogSync(context = {}) {
  return filterCatalog(ESPAI_MENTAL_LIBRARY, context)
}

/**
 * @param {import('./types.js').EspaiMentalItem[]} catalog
 * @param {import('./types.js').EspaiMentalContext} context
 */
export function filterCatalog(catalog, context = {}) {
  const { sport, seasonPhase } = context

  return catalog.filter((item) => {
    const sports = item.tags?.sports || ["general"]
    const contexts = item.tags?.contexts || ["general"]

    const sportMatch = !sport || sports.includes("general") || sports.includes(sport)
    const contextMatch =
      !seasonPhase || contexts.includes("general") || contexts.includes(seasonPhase)

    return sportMatch && contextMatch
  })
}
