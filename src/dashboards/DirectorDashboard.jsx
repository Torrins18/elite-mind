import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { WeeklyEorChart } from "../components/WeeklyEorTeamChart"

export function DirectorDashboard({ profile }) {
  const { t } = useTranslation()
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!profile?.club_id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    const { data, error: rpcError } = await supabase.rpc("get_director_club_snapshot", {
      p_club_id: profile.club_id,
    })

    if (rpcError) {
      setError(rpcError.message)
      setSnapshot(null)
    } else {
      setSnapshot(data)
    }

    setLoading(false)
  }, [profile?.club_id])

  useEffect(() => {
    load()
  }, [load])

  const monthlyTrend = useMemo(
    () =>
      (snapshot?.monthly_trend || []).map((row) => ({
        weekDate: `${row.month}-01`,
        mental: row.compliance_pct,
        wellbeing: row.compliance_pct,
        social: row.compliance_pct,
        performance: row.compliance_pct,
      })),
    [snapshot]
  )

  if (!profile?.club_id) {
    return (
      <Card title={t("director.noClubTitle")} subtitle={t("director.noClubSubtitle")}>
        <p className="empty-state">{t("director.noClubText")}</p>
      </Card>
    )
  }

  if (loading) return <LoadingSpinner variant="dashboard" />

  if (error) {
    return (
      <Card title={t("director.title")}>
        <p className="form-error">{error}</p>
        <p className="empty-state">{t("director.migrationHint")}</p>
      </Card>
    )
  }

  const totals = snapshot?.totals || {}

  return (
    <div className="dashboard-grid dashboard-grid--director">
      <section className="hero-strip">
        <div>
          <h2>{snapshot?.club?.name || t("director.title")}</h2>
          <p>{t("director.subtitle")}</p>
        </div>
      </section>

      <div className="stats-row stats-row--compact">
        <StatCard label={t("director.athletes")} value={totals.athletes ?? 0} />
        <StatCard label={t("director.teams")} value={totals.teams ?? 0} />
        <StatCard
          label={t("director.compliance")}
          value={`${totals.compliance_pct ?? 0}%`}
        />
        <StatCard
          label={t("director.wellbeingIndex")}
          value={totals.avg_wellbeing ?? "—"}
        />
      </div>

      <div className="stats-row stats-row--compact">
        <StatCard label={t("director.mentalIndex")} value={totals.avg_mental ?? "—"} />
        <StatCard label={t("director.socialIndex")} value={totals.avg_social ?? "—"} />
        <StatCard
          label={t("director.appointmentsCompleted")}
          value={totals.appointments_completed ?? 0}
        />
        <StatCard label={t("director.alertsResolved")} value={totals.alerts_resolved ?? 0} />
      </div>

      <Card title={t("director.usageTitle")} subtitle={t("director.usageSubtitle")}>
        <StatCard
          label={t("director.checkInsThisMonth")}
          value={totals.check_ins_this_month ?? 0}
        />
      </Card>

      <Card title={t("director.complianceTrendTitle")} subtitle={t("director.complianceTrendSubtitle")}>
        {monthlyTrend.length === 0 ? (
          <p className="empty-state">{t("director.noTrend")}</p>
        ) : (
          <WeeklyEorChart
            weeklyTrend={monthlyTrend}
            variant="coach"
            title=""
            subtitle=""
          />
        )}
      </Card>

      <Card title={t("director.teamsTitle")} subtitle={t("director.teamsSubtitle")}>
        {(snapshot?.teams || []).length === 0 ? (
          <p className="empty-state">{t("director.noTeams")}</p>
        ) : (
          <ul className="director-team-list">
            {(snapshot?.teams || []).map((team) => (
              <li key={team.id} className="director-team-list__item">
                <strong>{team.name}</strong>
                <span>
                  {team.athletes} {t("director.athletesShort")} · {team.compliance_pct}%{" "}
                  {t("director.complianceShort")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="director-privacy-note">{t("director.privacyNote")}</p>
    </div>
  )
}
