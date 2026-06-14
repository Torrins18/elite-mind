import { summarizeAthlete, sortByDateDesc } from "./metrics"

export function buildAthleteInsightContext({ athlete, checkIns, assessment, teamName, lang }) {
  const rows = sortByDateDesc(checkIns.filter((c) => c.athlete_id === athlete.id))
  const summary = summarizeAthlete({ athlete, checkIns: rows })
  const recentRows = rows.slice(0, 7)

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
    },
    qualitative: {
      personalNotes: recentRows
        .filter((row) => row.personal_notes?.trim())
        .map((row) => ({ date: row.check_in_date, text: row.personal_notes.trim() })),
      moodWords: recentRows
        .filter((row) => row.general_mood_words?.trim())
        .map((row) => row.general_mood_words.trim()),
      moodEvents: recentRows
        .filter((row) => row.mood_change_event?.trim())
        .map((row) => ({ date: row.check_in_date, text: row.mood_change_event.trim() })),
      nextGoals: recentRows
        .filter((row) => row.next_goal?.trim())
        .map((row) => ({ date: row.check_in_date, text: row.next_goal.trim() })),
    },
    initialAssessment: assessment
      ? {
          personal: assessment.personal_info || {},
          sleep: assessment.sleep_habits || {},
          nutrition: assessment.nutrition_habits || {},
          sports: assessment.sports_background || {},
          support: assessment.family_social_support || {},
        }
      : null,
  }
}
