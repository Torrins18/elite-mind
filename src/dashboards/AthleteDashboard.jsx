import { useCallback, useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { CheckInForm } from "../components/CheckInForm"
import { CheckInChart } from "../components/CheckInChart"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { Badge } from "../components/ui/Badge"
import { todayISO } from "../lib/dates"
import { calculateRiskLevel } from "../lib/risk"

export function AthleteDashboard({ profile, teamName }) {
  const { t } = useTranslation()
  const [checkIns, setCheckIns] = useState([])
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .eq("athlete_id", profile.id)
      .order("check_in_date", { ascending: false })
      .limit(14)

    if (!error && data) {
      setCheckIns(data)
      setTodayCheckIn(data.find((c) => c.check_in_date === todayISO()) || null)
    }

    setLoading(false)
  }, [profile.id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingSpinner label={t("athlete.loading")} />

  const latest = checkIns[0]
  const risk = calculateRiskLevel(latest)
  const streak = checkIns.length

  return (
    <div className="dashboard-grid">
      <section className="hero-strip">
        <div>
          <h2>
            {t("athlete.greeting")}, {profile.name}
          </h2>
          <p>
            {teamName && (
              <>
                <strong>{teamName}</strong>
                {" · "}
              </>
            )}
            {t("athlete.subtitle")}
          </p>
        </div>
        {latest && <Badge variant={risk}>{t(`risk.${risk}`)}</Badge>}
      </section>

      <div className="stats-row">
        <StatCard label={t("athlete.checkInsLogged")} value={streak} hint={t("athlete.last14Days")} />
        <StatCard
          label={t("athlete.todayMood")}
          value={todayCheckIn?.mood ?? "—"}
          hint={todayCheckIn ? t("athlete.logged") : t("athlete.notLogged")}
        />
        <StatCard
          label={t("athlete.avgEnergy")}
          value={
            checkIns.length
              ? (
                  checkIns.slice(0, 7).reduce((s, c) => s + c.energy, 0) /
                  Math.min(7, checkIns.length)
                ).toFixed(1)
              : "—"
          }
        />
        <StatCard
          label={t("athlete.avgStress")}
          value={
            checkIns.length
              ? (
                  checkIns.slice(0, 7).reduce((s, c) => s + c.stress, 0) /
                  Math.min(7, checkIns.length)
                ).toFixed(1)
              : "—"
          }
        />
      </div>

      <CheckInForm athleteId={profile.id} existing={todayCheckIn} onSaved={load} />

      <CheckInChart checkIns={checkIns.slice(0, 7)} />

      {checkIns.length > 0 && (
        <Card title={t("athlete.recentCheckIns")} subtitle={t("athlete.recentSubtitle")}>
          <ul className="check-in-list">
            {checkIns.map((c) => {
              const r = calculateRiskLevel(c)
              return (
                <li key={c.id}>
                  <span>{c.check_in_date}</span>
                  <span>
                    {t("athlete.mood")} {c.mood}
                  </span>
                  <span>
                    {t("athlete.stress")} {c.stress}
                  </span>
                  <Badge variant={r}>{t(`risk.${r}`)}</Badge>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
