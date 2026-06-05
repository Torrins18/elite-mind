import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { CheckInChart } from "../components/CheckInChart"
import { InsightCard } from "../components/InsightCard"
import { averageMetrics, calculateRiskLevel } from "../lib/risk"
import { buildTeamInsight } from "../lib/insights"
import {
  CHECK_IN_WINDOW_DAYS,
  countAthletesActiveThisWeek,
  isDateWithinLastDays,
  lastNDays,
} from "../lib/dates"

const COACH_COLUMNS =
  "id, athlete_id, check_in_date, mood, stress, sleep_quality, energy, focus, created_at"

export function CoachDashboard({ profile, teamName }) {
  const { t } = useTranslation()
  const [athletes, setAthletes] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    if (!profile.team_id) {
      setAthletes([])
      setCheckIns([])
      setLoading(false)
      return
    }

    const { data: roster } = await supabase
      .from("profiles")
      .select("id, name, role")
      .eq("team_id", profile.team_id)
      .eq("role", "athlete")

    setAthletes(roster || [])

    const athleteIds = (roster || []).map((a) => a.id)
    if (!athleteIds.length) {
      setCheckIns([])
      setLoading(false)
      return
    }

    const since = lastNDays(7)[0]
    const { data: ins } = await supabase
      .from("check_ins")
      .select(COACH_COLUMNS)
      .in("athlete_id", athleteIds)
      .gte("check_in_date", since)
      .order("check_in_date", { ascending: false })

    setCheckIns(ins || [])
    setLoading(false)
  }, [profile.team_id])

  useEffect(() => {
    load()
  }, [load])

  const latestByAthlete = useMemo(
    () =>
      athletes.map((a) => {
        const latest = checkIns.find((c) => c.athlete_id === a.id)
        return { athlete: a, latest, risk: calculateRiskLevel(latest) }
      }),
    [athletes, checkIns]
  )

  const teamInsight = useMemo(
    () => buildTeamInsight({ athletes, checkIns, latestByAthlete }, t, { forCoach: true }),
    [athletes, checkIns, latestByAthlete, t]
  )

  const athleteRiskCounts = useMemo(
    () =>
      latestByAthlete.reduce(
        (acc, row) => {
          if (!row.latest) return acc
          acc[row.risk] += 1
          return acc
        },
        { low: 0, medium: 0, high: 0 }
      ),
    [latestByAthlete]
  )

  if (loading) return <LoadingSpinner label={t("coach.loading")} />

  const teamAvg = averageMetrics(checkIns)
  const athleteIds = athletes.map((a) => a.id)
  const activeThisWeek = countAthletesActiveThisWeek(checkIns, athleteIds)
  const inactiveCount = latestByAthlete.filter(
    (x) => !isDateWithinLastDays(x.latest?.check_in_date, CHECK_IN_WINDOW_DAYS)
  ).length

  const teamTrend = checkIns.reduce((acc, c) => {
    const key = c.check_in_date
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  const aggregatedTrend = Object.entries(teamTrend)
    .map(([date, rows]) => ({
      check_in_date: date,
      mood: Math.round(rows.reduce((s, r) => s + r.mood, 0) / rows.length),
      energy: Math.round(rows.reduce((s, r) => s + r.energy, 0) / rows.length),
      stress: Math.round(rows.reduce((s, r) => s + r.stress, 0) / rows.length),
    }))
    .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))

  return (
    <div className="dashboard-grid">
      <section className="hero-strip">
        <div>
          <h2>{teamName || t("coach.team")}</h2>
          <p>{t("coach.subtitle")}</p>
        </div>
      </section>

      <div className="stats-row">
        <StatCard label={t("coach.athletes")} value={athletes.length} />
        <StatCard
          label={t("coach.checkedInThisWeek")}
          value={`${activeThisWeek}/${athletes.length}`}
          hint={t("coach.weeklyCompliance")}
        />
        <StatCard label={t("coach.teamAvgMood")} value={teamAvg.mood || "—"} />
        <StatCard
          label={t("coach.teamAvgStress")}
          value={teamAvg.stress || "—"}
          hint={t("coach.aggregatedOnly")}
        />
      </div>

      <Card>
        <InsightCard
          title={t("insights.teamTitle")}
          insight={teamInsight}
          footer={t("insights.footerCoach")}
        />
      </Card>

      <Card title={t("coach.teamSummary")} subtitle={t("coach.teamSummarySubtitle")}>
        <ul className="team-summary-list">
          <li>
            <span>{t("coach.summaryCompliance")}</span>
            <strong>
              {athletes.length
                ? `${Math.round((activeThisWeek / athletes.length) * 100)}%`
                : "—"}
            </strong>
          </li>
          <li>
            <span>{t("coach.summaryStable")}</span>
            <strong>{athleteRiskCounts.low}</strong>
          </li>
          <li>
            <span>{t("coach.summaryWatch")}</span>
            <strong>{athleteRiskCounts.medium}</strong>
          </li>
          <li>
            <span>{t("coach.summaryAtRisk")}</span>
            <strong>{athleteRiskCounts.high}</strong>
          </li>
          <li>
            <span>{t("coach.summaryInactive")}</span>
            <strong>{inactiveCount}</strong>
          </li>
        </ul>
        <p className="team-summary-note">{t("coach.privacyNote")}</p>
      </Card>

      <CheckInChart checkIns={aggregatedTrend} />
    </div>
  )
}
