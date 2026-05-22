import { useCallback, useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { Badge } from "../components/ui/Badge"
import { CheckInChart } from "../components/CheckInChart"
import { averageMetrics, calculateRiskLevel, countByRisk } from "../lib/risk"
import { lastNDays } from "../lib/dates"

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

  if (loading) return <LoadingSpinner label={t("coach.loading")} />

  const latestByAthlete = athletes.map((a) => {
    const latest = checkIns.find((c) => c.athlete_id === a.id)
    return { athlete: a, latest, risk: calculateRiskLevel(latest) }
  })

  const atRisk = latestByAthlete.filter((x) => x.risk === "high")
  const teamAvg = averageMetrics(checkIns)
  const riskCounts = countByRisk(checkIns)
  const completionToday = latestByAthlete.filter((x) => {
    const today = new Date().toISOString().slice(0, 10)
    return x.latest?.check_in_date === today
  }).length

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
          label={t("coach.checkedInToday")}
          value={`${completionToday}/${athletes.length}`}
          hint={t("coach.dailyCompliance")}
        />
        <StatCard label={t("coach.teamAvgMood")} value={teamAvg.mood || "—"} />
        <StatCard
          label={t("coach.highRiskAlerts")}
          value={atRisk.length}
          hint={t("coach.requiresAttention")}
          accent="var(--danger)"
        />
      </div>

      {atRisk.length > 0 && (
        <Card title={t("coach.riskAlerts")} subtitle={t("coach.riskAlertsSubtitle")}>
          <ul className="alert-list">
            {atRisk.map(({ athlete, latest, risk }) => (
              <li key={athlete.id} className="alert-list__item alert-list__item--high">
                <div>
                  <strong>{athlete.name}</strong>
                  <span>
                    {t("coach.moodStressSleep", {
                      mood: latest?.mood,
                      stress: latest?.stress,
                      sleep: latest?.sleep_quality,
                    })}
                  </span>
                </div>
                <Badge variant={risk}>{t(`risk.${risk}`)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="stats-row stats-row--compact">
        <StatCard label={t("coach.stable")} value={riskCounts.low} />
        <StatCard label={t("coach.watch")} value={riskCounts.medium} />
        <StatCard label={t("coach.atRisk")} value={riskCounts.high} />
      </div>

      <CheckInChart checkIns={aggregatedTrend} />

      <Card title={t("coach.roster")} subtitle={t("coach.rosterSubtitle")}>
        {athletes.length === 0 ? (
          <p className="empty-state">{t("coach.noAthletes")}</p>
        ) : (
          <ul className="roster-list">
            {latestByAthlete.map(({ athlete, latest, risk }) => (
              <li key={athlete.id}>
                <div>
                  <strong>{athlete.name}</strong>
                  <span>
                    {latest
                      ? t("coach.moodEnergy", {
                          mood: latest.mood,
                          energy: latest.energy,
                          date: latest.check_in_date,
                        })
                      : t("coach.noRecentCheckIn")}
                  </span>
                </div>
                <Badge variant={latest ? risk : "default"}>
                  {latest ? t(`risk.${risk}`) : t("risk.noData")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
