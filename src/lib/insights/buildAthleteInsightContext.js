import { summarizeAthlete, sortByDateDesc } from "./metrics"
import { computeWeeklyIndexes, getLatestWeeklyReflection } from "../weeklyEor"
import { compareWeeklyToBaseline } from "../baseline"

export function buildAthleteInsightContext({ athlete, checkIns, assessment, teamName, lang }) {
  const rows = sortByDateDesc(checkIns.filter((c) => c.athlete_id === athlete.id))
  const summary = summarizeAthlete({ athlete, checkIns: rows })
  const recentRows = rows.slice(0, 7)
  const latestWeekly = getLatestWeeklyReflection(rows)
  const weeklyIndexes = computeWeeklyIndexes(latestWeekly)
  const baselineComparison = compareWeeklyToBaseline(assessment, latestWeekly)

  return {
    lang,
    athlete: {
      name: athlete.name,
      team: teamName || null,
      dateOfBirth: athlete.date_of_birth || null,
    },
    metrics: {
      latest: summary.latest
        ? {
            date: summary.latest.check_in_date,
            mood: summary.latest.mood,
            stress: summary.latest.stress,
            sleep: summary.latest.sleep_quality,
            energy: summary.latest.energy,
            focus: summary.latest.focus,
            performance: summary.latest.performance_rating,
            involvement: summary.latest.involvement_rating,
          }
        : null,
      avg7: summary.avg7,
      risk: summary.risk,
      daysSince: summary.daysSince,
      trends: {
        mood: summary.moodTrend,
        stress: summary.stressTrend,
        energy: summary.energyTrend,
        sleep: summary.sleepTrend,
        focus: summary.focusTrend,
      },
      weakAreas: summary.weakAreas,
      totalEntries: summary.totalEntries,
      weeklyEor: weeklyIndexes,
    },
    qualitative: {
      personalNotes: recentRows
        .filter((row) => row.personal_notes?.trim())
        .map((row) => ({ date: row.check_in_date, text: row.personal_notes.trim() })),
      weeklyWentWell: recentRows
        .filter((row) => row.weekly_went_well?.trim())
        .map((row) => ({ date: row.check_in_date, text: row.weekly_went_well.trim() })),
      weeklyDifficulties: recentRows
        .filter((row) => row.weekly_main_difficulty?.trim())
        .map((row) => ({ date: row.check_in_date, text: row.weekly_main_difficulty.trim() })),
      nextGoals: recentRows
        .filter((row) => row.next_goal?.trim())
        .map((row) => ({ date: row.check_in_date, text: row.next_goal.trim() })),
      psychologistContactRequests: recentRows
        .filter((row) => row.psychologist_contact === "yes" || row.psychologist_contact === "maybe")
        .map((row) => ({ date: row.check_in_date, level: row.psychologist_contact })),
      moodWords: recentRows
        .filter((row) => row.general_mood_words?.trim())
        .map((row) => row.general_mood_words.trim()),
      moodEvents: recentRows
        .filter((row) => row.mood_change_event?.trim())
        .map((row) => ({ date: row.check_in_date, text: row.mood_change_event.trim() })),
    },
    initialAssessment: assessment
      ? {
          personal: assessment.personal_info || {},
          sleep: assessment.sleep_habits || {},
          nutrition: assessment.nutrition_habits || {},
          sports: assessment.sports_background || {},
          support: assessment.family_social_support || {},
          mental: assessment.mental_profile || {},
          objectives: assessment.objectives || {},
          summary: assessment.baseline_summary || "",
        }
      : null,
    baselineComparison: baselineComparison.filter((row) => row.significant),
  }
}
