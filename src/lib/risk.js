import { computeWeeklyIndexes } from "./weeklyEor"

export const RISK_COLORS = {
  low: "var(--success)",
  medium: "var(--warning)",
  high: "var(--danger)",
}

export function calculateRiskLevel(checkIn) {
  if (!checkIn) return "low"

  const eor = computeWeeklyIndexes(checkIn)
  if (eor) {
    let score = 0
    if (eor.mental != null && eor.mental <= 4) score += 2
    if (eor.wellbeing != null && eor.wellbeing <= 4) score += 1
    if (eor.social != null && eor.social <= 4) score += 1
    if (eor.coachCommunication != null && eor.coachCommunication <= 3) score += 1
    if (eor.wantsPsychologistTalk) score += 2

    if (score >= 3) return "high"
    if (score >= 1) return "medium"
    return "low"
  }

  let score = 0
  if (checkIn.mood <= 4) score += 2
  if (checkIn.stress >= 7) score += 2
  if (checkIn.sleep_quality <= 4) score += 1
  if (checkIn.energy <= 4) score += 1
  if (checkIn.focus <= 4) score += 1

  if (score >= 4) return "high"
  if (score >= 2) return "medium"
  return "low"
}

export function averageMetrics(checkIns) {
  if (!checkIns?.length) {
    return { mood: 0, stress: 0, sleep_quality: 0, energy: 0, focus: 0 }
  }

  const sum = checkIns.reduce(
    (acc, c) => ({
      mood: acc.mood + c.mood,
      stress: acc.stress + c.stress,
      sleep_quality: acc.sleep_quality + c.sleep_quality,
      energy: acc.energy + c.energy,
      focus: acc.focus + (c.focus ?? 0),
    }),
    { mood: 0, stress: 0, sleep_quality: 0, energy: 0, focus: 0 }
  )

  const n = checkIns.length
  return {
    mood: Math.round((sum.mood / n) * 10) / 10,
    stress: Math.round((sum.stress / n) * 10) / 10,
    sleep_quality: Math.round((sum.sleep_quality / n) * 10) / 10,
    energy: Math.round((sum.energy / n) * 10) / 10,
    focus: Math.round((sum.focus / n) * 10) / 10,
  }
}

export function countByRisk(checkIns) {
  return checkIns.reduce(
    (acc, c) => {
      const level = calculateRiskLevel(c)
      acc[level] += 1
      return acc
    },
    { low: 0, medium: 0, high: 0 }
  )
}
