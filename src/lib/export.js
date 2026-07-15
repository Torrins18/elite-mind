import { calculateRiskLevel } from "./risk"
import { trackFeatureUsed } from "./productAnalytics"

function escapeCsv(value) {
  const str = String(value ?? "")
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function downloadCsv(filename, rows) {
  trackFeatureUsed("export_csv", { filename })
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function buildCheckInsExport({ checkIns, athletes, teams, t }) {
  const athleteMap = Object.fromEntries(athletes.map((a) => [a.id, a]))
  const teamMap = Object.fromEntries(teams.map((tm) => [tm.id, tm.name]))

  const headers = [
    t("export.date"),
    t("export.athlete"),
    t("export.category"),
    t("checkIn.metricMood"),
    t("checkIn.metricStress"),
    t("checkIn.metricSleep"),
    t("checkIn.metricEnergy"),
    t("checkIn.metricFocus"),
    t("export.risk"),
    t("checkIn.notes"),
  ]

  const rows = checkIns.map((c) => {
    const athlete = athleteMap[c.athlete_id]
    const risk = calculateRiskLevel(c)
    return [
      c.check_in_date,
      athlete?.name || "—",
      teamMap[athlete?.team_id] || "—",
      c.mood,
      c.stress,
      c.sleep_quality,
      c.energy,
      c.focus,
      t(`risk.${risk}`),
      c.personal_notes || "",
    ]
  })

  return [headers, ...rows]
}
