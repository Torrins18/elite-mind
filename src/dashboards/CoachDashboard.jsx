import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { InsightCard } from "../components/InsightCard"
import { TeamJoinLink } from "../components/TeamJoinLink"
import { CoachTeamStatusCard } from "../components/coach/CoachTeamStatusCard"
import { CoachTeamIndicators } from "../components/coach/CoachTeamIndicators"
import { CoachTeamEvolutionPanel } from "../components/coach/CoachTeamEvolutionPanel"
import { CoachRecommendationsPanel } from "../components/coach/CoachRecommendationsPanel"
import { buildCoachDashboardInsight } from "../lib/insights/buildCoachDashboardInsight"
import {
  buildCoachTeamIndicators,
  buildCoachTeamStatus,
  buildCoachWeeklyMetrics,
} from "../lib/coachTeamDashboard"
import { currentWeekCompliance } from "../lib/complianceTrend"

const COACH_COLUMNS =
  "id, athlete_id, check_in_date, " +
  "confidence_rating, weekly_energy, group_integration, coach_communication, general_recovery, " +
  "performance_rating, involvement_rating, effort_rating, weekly_rest_quality, physical_fatigue, " +
  "teammate_communication, role_clarity, motivation_rating, pressure_management"

export function CoachDashboard({ profile, teamName }) {
  const { t } = useTranslation()
  const [athletes, setAthletes] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [teamJoinToken, setTeamJoinToken] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    if (!profile.team_id) {
      setAthletes([])
      setCheckIns([])
      setTeamJoinToken(null)
      setRecommendations([])
      setLoading(false)
      return
    }

    const [{ data: teamRow }, { data: roster }, recRes] = await Promise.all([
      supabase.from("teams").select("join_token").eq("id", profile.team_id).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, role")
        .eq("team_id", profile.team_id)
        .eq("role", "athlete"),
      supabase
        .from("coach_recommendations")
        .select("id, message, shared_at")
        .eq("team_id", profile.team_id)
        .is("archived_at", null)
        .order("shared_at", { ascending: false })
        .limit(5),
    ])

    setTeamJoinToken(teamRow?.join_token || null)
    setAthletes(roster || [])
    setRecommendations(recRes.error ? [] : recRes.data || [])

    const athleteIds = (roster || []).map((a) => a.id)
    if (!athleteIds.length) {
      setCheckIns([])
      setLoading(false)
      return
    }

    const { data: ins } = await supabase
      .from("check_ins")
      .select(COACH_COLUMNS)
      .in("athlete_id", athleteIds)
      .order("check_in_date", { ascending: false })
      .limit(1000)

    setCheckIns(ins || [])
    setLoading(false)
  }, [profile.team_id])

  useEffect(() => {
    load()
  }, [load])

  const athleteCount = athletes.length
  const athleteIds = useMemo(() => athletes.map((a) => a.id), [athletes])

  const complianceNow = useMemo(
    () => currentWeekCompliance(checkIns, athleteIds),
    [checkIns, athleteIds]
  )

  const weeklyMetrics = useMemo(
    () => buildCoachWeeklyMetrics(checkIns, athleteCount, 8),
    [checkIns, athleteCount]
  )

  const indicators = useMemo(
    () => buildCoachTeamIndicators(checkIns, athleteCount, complianceNow),
    [checkIns, athleteCount, complianceNow]
  )

  const teamStatus = useMemo(
    () =>
      buildCoachTeamStatus({
        indicators,
        weeklyMetrics,
        recommendationCount: recommendations.length,
      }),
    [indicators, weeklyMetrics, recommendations.length]
  )

  const dashboardInsight = useMemo(
    () => buildCoachDashboardInsight({ weeklyMetrics, indicators, t }),
    [weeklyMetrics, indicators, t]
  )

  if (loading) return <LoadingSpinner label={t("coach.loading")} />

  return (
    <div className="dashboard-grid dashboard-grid--coach">
      <section className="hero-strip hero-strip--coach">
        <div>
          <h2>{teamName || t("coach.team")}</h2>
          <p>{t("coach.subtitle")}</p>
        </div>
        <p className="hero-strip__meta">
          {t("coach.rosterSize", { count: athleteCount })}
          {" · "}
          {t("psychologist.complianceRatio", {
            done: complianceNow.done,
            total: complianceNow.total,
            pct: complianceNow.pct,
          })}
        </p>
      </section>

      <CoachTeamStatusCard status={teamStatus} t={t} />

      <CoachTeamIndicators indicators={indicators} t={t} />

      <section className="coach-ai-section">
        <h3 className="coach-section-title">{t("coach.dashboardInsightTitle")}</h3>
        <p className="coach-section-subtitle">{t("coach.dashboardInsightSubtitle")}</p>
        <InsightCard title={t("coach.dashboardInsightCardTitle")} insight={dashboardInsight} />
      </section>

      <CoachTeamEvolutionPanel weeklyMetrics={weeklyMetrics} />

      <CoachRecommendationsPanel recommendations={recommendations} t={t} />

      {teamJoinToken && (
        <details className="coach-join-details">
          <summary>{t("teams.joinLinkTitle")}</summary>
          <TeamJoinLink joinToken={teamJoinToken} teamName={teamName} />
        </details>
      )}

      <p className="coach-confidentiality-footer">{t("coach.confidentialityFooter")}</p>
    </div>
  )
}
