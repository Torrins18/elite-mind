/**
 * Entrenament Mental™ — types and content-pack architecture.
 */

/** @typedef {'reflection' | 'mini_challenge' | 'breathing' | 'visualization' | 'attention_exercise' | 'communication_challenge' | 'confidence_exercise' | 'mental_routine'} MentalTrainingType */

/** @typedef {'default' | 'football' | 'basketball' | 'volleyball' | 'academy' | 'professional' | 'injured' | 'return_competition' | 'goalkeepers' | 'captains'} MentalTrainingPackId */

/**
 * @typedef {Object} MentalTrainingPhase
 * @property {string} id
 * @property {number} weekStart
 * @property {number} weekEnd
 */

/**
 * @typedef {Object} MentalTrainingLocalized
 * @property {string} topic
 * @property {string} concept
 * @property {string} [action]
 */

/**
 * @typedef {Object} MentalTrainingWeek
 * @property {number} week
 * @property {string} phaseId
 * @property {MentalTrainingType} type
 * @property {MentalTrainingLocalized} es
 * @property {MentalTrainingLocalized} ca
 * @property {MentalTrainingPackId} [packId]
 */

/**
 * @typedef {Object} MentalTrainingDisplay
 * @property {number} seasonWeek
 * @property {number} programWeek
 * @property {string} phaseId
 * @property {string} phaseLabel
 * @property {MentalTrainingType} type
 * @property {string} typeLabel
 * @property {string} topic
 * @property {string} concept
 * @property {string} [action]
 * @property {string} tryThisWeek
 */

/**
 * @typedef {Object} MentalTrainingTeamStatus
 * @property {number} seasonWeek
 * @property {number} programWeek
 * @property {string} phaseId
 * @property {string} phaseLabel
 * @property {string} topic
 * @property {string} typeLabel
 */

export const MENTAL_TRAINING_TYPE_EMOJI = {
  reflection: "💭",
  mini_challenge: "📝",
  breathing: "🌬",
  visualization: "👁",
  attention_exercise: "🎯",
  communication_challenge: "💬",
  confidence_exercise: "🧠",
  mental_routine: "🔄",
}

export const DEFAULT_MENTAL_TRAINING_PACK = "default"
