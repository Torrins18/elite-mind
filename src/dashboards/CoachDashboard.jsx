import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { WeeklyEorChart } from "../components/WeeklyEorTeamChart"
import { InsightCard } from "../components/InsightCard"
import { TeamJoinLink } from "../components/TeamJoinLink"
import { CoachWeeklySnapshot } from "../components/CoachWeeklySnapshot"
import { EorIndexSummary } from "../components/EorIndexSummary"
import { calculateRiskLevel } from "../lib/risk"
import { buildTeamInsight } from "../lib/insights"
import { buildCoachWeeklyInsight } from "../lib/insights/buildCoachWeeklyInsight"
import {
  aggregateWeeklyEorTrend,
  getLatestWeeklyTeamSnapshot,
} from "../lib/coachTeamAnalytics"
import { getLatestWeeklyReflection } from "../lib/weeklyEor"
import {
  CHECK_IN_WINDOW_DAYS,
  countAthletesActiveThisWeek,
  isDateWithinLastDays,
} from "../lib/dates"

const COACH_COLUMNS =
  "id, athlete_id, check_in_date, created_at, " +
  "performance_rating, involvement_rating, effort_rating, weekly_rest_quality, weekly_energy, " +
  "physical_fatigue, general_recovery, confidence_rating, concentration_rating, motivation_rating, " +
  "pressure_management, teammate_communication, coach_communication, group_integration, role_clarity, " +
  "sport_life_balance, life_outside_sport, personal_time_management, " +
  "weekly_went_well, weekly_main_difficulty, next_goal, psychologist_contact"

export function CoachDashboard({ profile, teamName }) {
  const { t } = useTranslation()
  const [athletes, setAthletes] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [teamJoinToken, setTeamJoinToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    if (!profile.team_id) {
      setAthletes([])
      setCheckIns([])
      setTeamJoinToken(null)
      setLoading(false)
      return
    }

    const { data: teamRow } = await supabase
      .from("teams")
      .select("join_token")
      .eq("id", profile.team_id)
      .maybeSingle()

    setTeamJoinToken(teamRow?.join_token || null)

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

  const latestByAthlete = useMemo(
    () =>
      athletes.map((a) => {
        const athleteRows = checkIns.filter((c) => c.athlete_id === a.id)
        const latestWeekly = getLatestWeeklyReflection(athleteRows)
        const latest = latestWeekly || athleteRows[0] || null
        return { athlete: a, latest, risk: calculateRiskLevel(latest) }
      }),
    [athletes, checkIns]
  )

  const teamInsight = useMemo(
    () => buildTeamInsight({ athletes, checkIns, latestByAthlete }, t, { forCoach: true }),
    [athletes, checkIns, latestByAthlete, t]
  )

  const weeklyTrend = useMemo(() => aggregateWeeklyEorTrend(checkIns), [checkIns])
  const latestWeeklySnapshot = useMemo(
    () => getLatestWeeklyTeamSnapshot(weeklyTrend),
    [weeklyTrend]
  )

  const weeklyInsight = useMemo(
    () =>
      buildCoachWeeklyInsight({
        weeklyTrend,
        athleteCount: athletes.length,
        t,
      }),
    [weeklyTrend, athletes.length, t]
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

  const athleteIds = athletes.map((a) => a.id)
  const activeThisWeek = countAthletesActiveThisWeek(checkIns, athleteIds)
  const inactiveCount = latestByAthlete.filter(
    (x) => !isDateWithinLastDays(x.latest?.check_in_date, CHECK_IN_WINDOW_DAYS)
  ).length

  return (
    <div className="dashboard-grid">
      <section className="hero-strip">
        <div>
          <h2>{teamName || t("coach.team")}</h2>
          <p>{t("coach.subtitle")}</p>
        </div>
      </section>

      {teamJoinToken && (
        <Card title={t("teams.joinLinkTitle")} subtitle={t("teams.joinLinkCoachSubtitle")}>
          <TeamJoinLink joinToken={teamJoinToken} teamName={teamName} />
        </Card>
      )}

      <div className="stats-row">
        <StatCard label={t("coach.athletes")} value={athletes.length} />
        <StatCard
          label={t("coach.checkedInThisWeek")}
          value={`${activeThisWeek}/${athletes.length}`}
          hint={t("coach.weeklyCompliance")}
        />
      </div>

      <Card title={t("coach.eorTeamTitle")} subtitle={t("coach.eorTeamSubtitle")}>
        <EorIndexSummary indexes={latestWeeklySnapshot} variant="coach" t={t} />
      </Card>

      <WeeklyEorChart
        weeklyTrend={weeklyTrend}
        variant="coach"
        title={t("coach.historyChartTitle")}
        subtitle={t("coach.historyChartSubtitle")}
      />

      <Card>
        <InsightCard
          title={t("insights.teamTitle")}
          insight={teamInsight}
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

      <section className="coach-weekly-section">
        <header className="coach-weekly-section__header">
          <h3>{t("coach.weeklySectionTitle")}</h3>
          <p>{t("coach.weeklySectionSubtitle")}</p>
        </header>

        <Card>
          <InsightCard
            title={t("coach.weeklyInsightTitle")}
            insight={weeklyInsight}
          />
        </Card>

        <CoachWeeklySnapshot snapshot={latestWeeklySnapshot} t={t} />
      </section>
    </div>
  )
}
