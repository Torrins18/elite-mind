export const WEEKLY_EOR_DEFAULTS = {
  performance_rating: 5,
  involvement_rating: 5,
  effort_rating: 5,
  weekly_rest_quality: 5,
  weekly_energy: 5,
  physical_fatigue: 5,
  general_recovery: 5,
  confidence_rating: 5,
  concentration_rating: 5,
  motivation_rating: 5,
  pressure_management: 5,
  teammate_communication: 5,
  coach_communication: 5,
  group_integration: 5,
  role_clarity: 5,
  sport_life_balance: 5,
  life_outside_sport: 5,
  personal_time_management: 5,
  weekly_went_well: "",
  weekly_main_difficulty: "",
  next_goal: "",
  psychologist_contact: "no",
}

export const WEEKLY_EOR_SCALE_FIELDS = [
  "performance_rating",
  "involvement_rating",
  "effort_rating",
  "weekly_rest_quality",
  "weekly_energy",
  "physical_fatigue",
  "general_recovery",
  "confidence_rating",
  "concentration_rating",
  "motivation_rating",
  "pressure_management",
  "teammate_communication",
  "coach_communication",
  "group_integration",
  "role_clarity",
  "sport_life_balance",
  "life_outside_sport",
  "personal_time_management",
]

export const WEEKLY_EOR_TEXT_FIELDS = [
  "weekly_went_well",
  "weekly_main_difficulty",
  "next_goal",
]

function averageFields(row, keys) {
  const values = keys.map((key) => row?.[key]).filter((value) => value != null && value >= 0)
  if (!values.length) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

function averageWellbeing(row) {
  const values = [
    row?.weekly_rest_quality,
    row?.weekly_energy,
    row?.general_recovery,
    row?.sport_life_balance,
    row?.life_outside_sport,
    row?.personal_time_management,
  ].filter((value) => value != null && value >= 0)

  if (row?.physical_fatigue != null && row.physical_fatigue >= 0) {
    values.push(10 - row.physical_fatigue)
  }

  if (!values.length) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

export function hasWeeklyReflection(checkIn) {
  if (!checkIn) return false

  if (WEEKLY_EOR_SCALE_FIELDS.some((key) => checkIn[key] != null)) return true
  if (WEEKLY_EOR_TEXT_FIELDS.some((key) => Boolean(checkIn[key]?.trim?.()))) return true
  if (checkIn.psychologist_contact && checkIn.psychologist_contact !== "no") return true

  return (
    checkIn.performance_rating != null ||
    checkIn.involvement_rating != null ||
    Boolean(checkIn.general_mood_words?.trim()) ||
    Boolean(checkIn.mood_change_event?.trim())
  )
}

export function computeWeeklyIndexes(checkIn) {
  if (!checkIn || !hasWeeklyReflection(checkIn)) return null

  return {
    performance: averageFields(checkIn, [
      "performance_rating",
      "involvement_rating",
      "effort_rating",
    ]),
    wellbeing: averageWellbeing(checkIn),
    social: averageFields(checkIn, ["teammate_communication", "group_integration"]),
    mental: averageFields(checkIn, [
      "confidence_rating",
      "concentration_rating",
      "motivation_rating",
      "pressure_management",
    ]),
    coachCommunication: checkIn.coach_communication ?? null,
    roleClarity: checkIn.role_clarity ?? null,
    psychologistContact: checkIn.psychologist_contact ?? null,
    wantsPsychologistTalk:
      checkIn.psychologist_contact === "yes" || checkIn.psychologist_contact === "maybe",
  }
}

export function buildWeeklyEorPayload(form) {
  const payload = {}

  for (const key of WEEKLY_EOR_SCALE_FIELDS) {
    payload[key] = form[key] ?? null
  }

  for (const key of WEEKLY_EOR_TEXT_FIELDS) {
    payload[key] = form[key]?.trim() || null
  }

  payload.psychologist_contact = form.psychologist_contact || "no"

  return payload
}

export function getLatestWeeklyReflection(checkIns) {
  return (checkIns || []).find(hasWeeklyReflection) || null
}
