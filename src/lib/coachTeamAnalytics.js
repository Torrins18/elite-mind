import { computeWeeklyIndexes, hasWeeklyReflection } from "./weeklyEor"

function average(values) {
  const nums = values.filter((value) => value != null && !Number.isNaN(value))
  if (!nums.length) return null
  return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 10) / 10
}

export function aggregateDailyTeamTrend(checkIns) {
  const byDate = checkIns.reduce((acc, row) => {
    if (!acc[row.check_in_date]) acc[row.check_in_date] = []
    acc[row.check_in_date].push(row)
    return acc
  }, {})

  return Object.entries(byDate)
    .map(([date, rows]) => ({
      check_in_date: date,
      mood: average(rows.map((row) => row.mood)),
      energy: average(rows.map((row) => row.energy)),
      stress: average(rows.map((row) => row.stress)),
      sleep_quality: average(rows.map((row) => row.sleep_quality)),
      focus: average(rows.map((row) => row.focus)),
      responses: rows.length,
    }))
    .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))
}

export function aggregateWeeklyEorTrend(checkIns) {
  const weeklyRows = checkIns.filter(hasWeeklyReflection)

  const byDate = weeklyRows.reduce((acc, row) => {
    if (!acc[row.check_in_date]) acc[row.check_in_date] = []
    acc[row.check_in_date].push(row)
    return acc
  }, {})

  return Object.entries(byDate)
    .map(([date, rows]) => {
      const indexes = rows.map((row) => computeWeeklyIndexes(row)).filter(Boolean)
      return {
        weekDate: date,
        responses: rows.length,
        performance: average(indexes.map((item) => item.performance)),
        wellbeing: average(indexes.map((item) => item.wellbeing)),
        social: average(indexes.map((item) => item.social)),
        mental: average(indexes.map((item) => item.mental)),
        coachCommunication: average(indexes.map((item) => item.coachCommunication)),
        roleClarity: average(indexes.map((item) => item.roleClarity)),
      }
    })
    .sort((a, b) => a.weekDate.localeCompare(b.weekDate))
}

export function getLatestWeeklyTeamSnapshot(weeklyTrend) {
  if (!weeklyTrend.length) return null
  return weeklyTrend[weeklyTrend.length - 1]
}

export function getPreviousWeeklyTeamSnapshot(weeklyTrend) {
  if (weeklyTrend.length < 2) return null
  return weeklyTrend[weeklyTrend.length - 2]
}
