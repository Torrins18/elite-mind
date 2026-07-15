import {
  DEFAULT_SEASON_PROGRAM,
  MENTAL_TRAINING_PHASES,
} from "../../data/entrenamentMental/defaultSeason"
import { DEFAULT_MENTAL_TRAINING_PACK } from "./types"

/**
 * Loads a Mental Training program pack.
 * Future packs: football, basketball, academy, injured, etc.
 *
 * @param {import('./types.js').MentalTrainingPackId} [packId]
 */
export function loadMentalTrainingProgram(packId = DEFAULT_MENTAL_TRAINING_PACK) {
  void packId
  return DEFAULT_SEASON_PROGRAM
}

export function loadMentalTrainingPhases(packId = DEFAULT_MENTAL_TRAINING_PACK) {
  void packId
  return MENTAL_TRAINING_PHASES
}

/**
 * Maps calendar season week to a defined program week (phase 9 rotates from week 17+).
 * @param {number} seasonWeek
 * @param {import('./types.js').MentalTrainingWeek[]} program
 */
export function resolveProgramWeek(seasonWeek, program) {
  const maxWeek = program.reduce((max, row) => Math.max(max, row.week), 0)
  if (seasonWeek <= maxWeek) return seasonWeek

  const phase9Start = program.find((row) => row.phaseId === "season_finale")?.week ?? 17
  const phase9Weeks = program.filter((row) => row.week >= phase9Start)
  if (!phase9Weeks.length) return maxWeek

  const offset = seasonWeek - phase9Start
  return phase9Weeks[offset % phase9Weeks.length].week
}
