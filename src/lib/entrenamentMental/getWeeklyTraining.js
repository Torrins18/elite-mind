import {
  loadMentalTrainingProgram,
  resolveProgramWeek,
} from "./programProvider"
import { getSeasonWeekNumber, resolveSeasonStart } from "./seasonWeek"
import { MENTAL_TRAINING_TYPE_EMOJI } from "./types"

function findWeekLesson(program, programWeek) {
  return program.find((row) => row.week === programWeek) || null
}

/**
 * @param {import('./types.js').MentalTrainingWeek} lesson
 * @param {'es' | 'ca'} lang
 * @param {(key: string) => string} t
 * @param {number} seasonWeek
 * @param {number} programWeek
 * @param {string} phaseId
 */
function toDisplay(lesson, lang, t, seasonWeek, programWeek, phaseId) {
  const locale = lang === "ca" ? "ca" : "es"
  const copy = lesson[locale]
  const typeKey = `entrenamentMental.types.${lesson.type}`
  const phaseKey = `entrenamentMental.phases.${phaseId}`

  return {
    seasonWeek,
    programWeek,
    phaseId,
    phaseLabel: t(phaseKey),
    type: lesson.type,
    typeLabel: t(typeKey),
    topic: copy.topic,
    concept: copy.concept,
    action: copy.action || null,
    tryThisWeek: t("entrenamentMental.tryThisWeek"),
    emoji: MENTAL_TRAINING_TYPE_EMOJI[lesson.type],
  }
}

/**
 * @param {string} today ISO date
 * @param {'es' | 'ca'} lang
 * @param {(key: string) => string} t
 * @param {{ season_start_date?: string } | null} [team]
 * @param {import('./types.js').MentalTrainingPackId} [packId]
 * @returns {import('./types.js').MentalTrainingDisplay | null}
 */
export function getWeeklyMentalTraining(today, lang, t, team = null, packId) {
  const program = loadMentalTrainingProgram(packId || team?.mental_training_pack)
  if (!program.length) return null

  const seasonStart = resolveSeasonStart(today, team)
  const seasonWeek = getSeasonWeekNumber(today, seasonStart)
  const programWeek = resolveProgramWeek(seasonWeek, program)
  const lesson = findWeekLesson(program, programWeek)
  if (!lesson) return null

  return toDisplay(lesson, lang, t, seasonWeek, programWeek, lesson.phaseId)
}

/**
 * @param {string} today
 * @param {'es' | 'ca'} lang
 * @param {(key: string) => string} t
 * @param {{ season_start_date?: string } | null} [team]
 * @param {import('./types.js').MentalTrainingPackId} [packId]
 * @returns {import('./types.js').MentalTrainingTeamStatus | null}
 */
export function getTeamMentalTrainingStatus(today, lang, t, team = null, packId) {
  const display = getWeeklyMentalTraining(today, lang, t, team, packId)
  if (!display) return null

  return {
    seasonWeek: display.seasonWeek,
    programWeek: display.programWeek,
    phaseId: display.phaseId,
    phaseLabel: display.phaseLabel,
    topic: display.topic,
    typeLabel: display.typeLabel,
  }
}

export { findWeekLesson }
