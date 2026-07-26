/** Baseline Assessment — personal reference profile (never compare athletes to each other). */

const SIGNIFICANT_DROP = 2
const SIGNIFICANT_RISE = 2

function num(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function sleepBaselineScore(habits = {}) {
  const wake = habits.wakeRecovered
  if (wake === "very" || wake === "quite") return 8
  if (wake === "little") return 5
  if (wake === "never") return 3
  const trouble = habits.troubleSleepingImportant
  if (trouble === "very" || trouble === "quite") return 4
  if (habits.sleepHoursTypical === "sevenEight" || habits.sleepHoursTypical === "moreThan8") return 8
  if (habits.sleepHoursTypical === "sixSeven") return 6
  return null
}

function fatigueBaselineScore(habits = {}) {
  const wake = habits.wakeRecovered
  if (wake === "very" || wake === "quite") return 3
  if (wake === "little") return 6
  if (wake === "never") return 8
  return null
}

export function getBaselineMetrics(assessment) {
  if (!assessment) return null

  const sports = assessment.sports_background || {}
  const sleep = assessment.sleep_habits || {}

  return {
    confidence: num(sports.currentConfidence),
    coachCommunication: num(sports.coachRelationship),
    pressureManagement: num(sports.perceivedPressure),
    sleepQuality: sleepBaselineScore(sleep),
    fatigue: fatigueBaselineScore(sleep),
    motivation: num(sports.currentConfidence),
  }
}

export function buildBaselineSummary(assessment, lang = "es") {
  if (!assessment) return ""

  const sports = assessment.sports_background || {}
  const support = assessment.family_social_support || {}
  const sleep = assessment.sleep_habits || {}
  const mental = assessment.mental_profile || {}
  const objectives = assessment.objectives || {}

  const bullets = []
  const isCa = lang === "ca"

  const confidence = num(sports.currentConfidence)
  if (confidence != null && confidence >= 7) {
    bullets.push(isCa ? "Confiança inicial alta." : "Confianza inicial alta.")
  } else if (confidence != null && confidence <= 4) {
    bullets.push(isCa ? "Confiança inicial baixa." : "Confianza inicial baja.")
  }

  const family = support.familySupport
  if (family === "very" || family === "quite") {
    bullets.push(isCa ? "Bon suport familiar." : "Fuerte apoyo familiar.")
  } else if (family === "never" || family === "little") {
    bullets.push(isCa ? "Suport familiar limitat." : "Apoyo familiar limitado.")
  }

  const wake = sleep.wakeRecovered
  if (wake === "very" || wake === "quite") {
    bullets.push(isCa ? "Normalment dorm bé." : "Suele dormir bien.")
  } else if (wake === "never" || wake === "little") {
    bullets.push(isCa ? "Patrons de son irregulars." : "Patrones de sueño irregulares.")
  }

  if (mental.mistakeReaction?.match(/perfecc|autocrític|culp/i)) {
    bullets.push(isCa ? "Tendència perfeccionista després d'errors." : "Tendencia perfeccionista tras errores.")
  }

  if (mental.poorPerformanceThoughts?.match(/culp|frustr|decepc/i)) {
    bullets.push(isCa ? "La confiança baixa després de errors." : "La confianza baja tras errores.")
  }

  const coach = num(sports.coachRelationship)
  if (coach != null && coach <= 4) {
    bullets.push(isCa ? "Comunicació inicial amb entrenador/a tensa." : "Comunicación inicial con entrenador/a tensa.")
  }

  const mainObjective =
    objectives.seasonObjective || sports.currentGoal || objectives.personalObjective
  if (mainObjective) {
    bullets.push(
      isCa ? `Objectiu principal: ${mainObjective.trim()}.` : `Objetivo principal: ${mainObjective.trim()}.`
    )
  }

  if (!bullets.length) {
    return isCa
      ? "Perfil de referència inicial registrat. Comparar evolució setmanal respecte aquesta línia base."
      : "Perfil de referencia inicial registrado. Comparar evolución semanal respecto a esta línea base."
  }

  return bullets.join(" ")
}

export function compareWeeklyToBaseline(assessment, latestWeekly) {
  if (!assessment || !latestWeekly) return []

  const baseline = getBaselineMetrics(assessment)
  const rows = []

  const add = (key, baselineVal, currentVal, labelKey, invert = false) => {
    if (baselineVal == null || currentVal == null) return
    const delta = Math.round((currentVal - baselineVal) * 10) / 10
    const significant = invert
      ? delta >= SIGNIFICANT_RISE
      : delta <= -SIGNIFICANT_DROP
    rows.push({
      key,
      labelKey,
      baseline: baselineVal,
      current: currentVal,
      delta,
      significant,
    })
  }

  add("confidence", baseline.confidence, num(latestWeekly.confidence_rating), "confidence")
  add(
    "coachCommunication",
    baseline.coachCommunication,
    num(latestWeekly.coach_communication),
    "coachCommunication"
  )
  add(
    "motivation",
    baseline.motivation,
    num(latestWeekly.motivation_rating),
    "motivation"
  )
  add("fatigue", baseline.fatigue, num(latestWeekly.physical_fatigue), "fatigue", true)

  const weeklySleep =
    num(latestWeekly.weekly_rest_quality) ?? num(latestWeekly.sleep_quality)
  add("sleep", baseline.sleepQuality, weeklySleep, "sleep")

  return rows
}

export function detectBaselineAlerts(athlete, assessment, latestWeekly) {
  if (!assessment || !latestWeekly) return []

  const comparisons = compareWeeklyToBaseline(assessment, latestWeekly)
  const alerts = []

  for (const row of comparisons) {
    if (!row.significant) continue

    const alertMap = {
      confidence: "baseline_confidence_drop",
      coachCommunication: "baseline_coach_comm_drop",
      motivation: "baseline_motivation_drop",
      fatigue: "baseline_fatigue_rise",
      sleep: "baseline_sleep_drop",
    }

    const id = alertMap[row.key]
    if (!id) continue

    alerts.push({
      id,
      severity: "high",
      kind: "notice",
      athleteId: athlete.id,
      athleteName: athlete.name,
      value: row.current,
      baseline: row.baseline,
      delta: row.delta,
    })
  }

  return alerts
}

export function formatAssessmentFieldValue(value, t) {
  if (value == null || value === "") return "—"
  const translated = t(`initialAssessment.options.${value}`)
  return translated === `initialAssessment.options.${value}` ? String(value) : translated
}

export function assessmentToForm(assessment) {
  if (!assessment) return null
  return {
    ...assessment.personal_info,
    ...assessment.family_social_support,
    ...assessment.sleep_habits,
    ...assessment.nutrition_habits,
    ...assessment.sports_background,
    ...assessment.mental_profile,
    ...assessment.objectives,
    baseline_summary: assessment.baseline_summary || "",
  }
}

export function formToAssessmentPayload(form, calculatedAge) {
  return {
    personal_info: {
      calculatedAge,
      sportPosition: form.sportPosition,
      yearsCompeting: form.yearsCompeting,
      categoryLevel: form.categoryLevel,
      gender: form.gender,
      weeklyTrainingSessions: form.weeklyTrainingSessions,
      weeklyCompetitions: form.weeklyCompetitions,
    },
    family_social_support: {
      livingWith: form.livingWith,
      familySupport: form.familySupport,
      studiesWork: form.studiesWork,
      balanceDifficulty: form.balanceDifficulty,
      travelTimeToTraining: form.travelTimeToTraining,
    },
    sleep_habits: {
      sleepHoursTypical: form.sleepHoursTypical,
      preEventSleep: form.preEventSleep,
      troubleSleepingImportant: form.troubleSleepingImportant,
      wakeRecovered: form.wakeRecovered,
      restPerformanceImpact: form.restPerformanceImpact,
    },
    nutrition_habits: {
      mealsPerDay: form.mealsPerDay,
      hydration: form.hydration,
      dailyEnergy: form.dailyEnergy,
      caffeineUse: form.caffeineUse,
      nutritionRating: form.nutritionRating,
      eatsBeforeTraining: form.eatsBeforeTraining,
      recoversNutritionally: form.recoversNutritionally,
      followsNutritionPlan: form.followsNutritionPlan,
    },
    sports_background: {
      importantInjuries: form.importantInjuries,
      hardestSportMoment: form.hardestSportMoment,
      majorSetbacks: form.majorSetbacks,
      clubChanges: form.clubChanges,
      bestAchievement: form.bestAchievement,
      currentGoal: form.currentGoal,
      perceivedPressure: form.perceivedPressure,
      currentConfidence: form.currentConfidence,
      coachRelationship: form.coachRelationship,
    },
    mental_profile: {
      greatestStrength: form.greatestStrength,
      aspectToImprove: form.aspectToImprove,
      preCompetitionWorry: form.preCompetitionWorry,
      performanceHelps: form.performanceHelps,
      mistakeReaction: form.mistakeReaction,
      poorPerformanceThoughts: form.poorPerformanceThoughts,
      mostConfidentWhen: form.mostConfidentWhen,
      leastConfidentWhen: form.leastConfidentWhen,
    },
    objectives: {
      seasonObjective: form.seasonObjective,
      personalObjective: form.personalObjective,
      teamObjective: form.teamObjective,
      seasonSuccess: form.seasonSuccess,
    },
  }
}
