/** @typedef {'reflection' | 'focus' | 'breathing' | 'mental_skill' | 'quote' | 'mini_challenge' | 'visualization'} EspaiMentalType */

/** @typedef {'system' | 'psychologist'} EspaiMentalSource */

/**
 * @typedef {Object} EspaiMentalLocalized
 * @property {string} [title] - Optional type-specific heading (e.g. "Gestió de l'error")
 * @property {string} body
 */

/**
 * @typedef {Object} EspaiMentalItem
 * @property {string} id
 * @property {EspaiMentalType} type
 * @property {EspaiMentalLocalized} es
 * @property {EspaiMentalLocalized} ca
 * @property {{ sports?: string[], contexts?: string[] }} [tags]
 * @property {EspaiMentalSource} source
 * @property {string} [psychologistId] - Set when source is psychologist (future)
 */

/**
 * @typedef {Object} EspaiMentalContext
 * @property {string} [sport] - e.g. football, basketball, volleyball, individual
 * @property {string} [seasonPhase] - e.g. competition, recovery, injury_return, finals, playoffs
 */

/**
 * @typedef {Object} EspaiMentalDisplay
 * @property {string} id
 * @property {EspaiMentalType} type
 * @property {string} emoji
 * @property {string} label
 * @property {string} body
 * @property {EspaiMentalSource} source
 */

export const ESPAI_MENTAL_TYPES = [
  "reflection",
  "focus",
  "breathing",
  "mental_skill",
  "quote",
  "mini_challenge",
  "visualization",
]

export const ESPAI_MENTAL_TYPE_EMOJI = {
  reflection: "💭",
  focus: "🎯",
  breathing: "🌬",
  mental_skill: "🧠",
  quote: "💬",
  mini_challenge: "📝",
  visualization: "👁",
}
