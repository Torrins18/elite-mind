import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { buildCheckInsExport, downloadCsv } from "../lib/export"
import {
  buildTeamReportSections,
  downloadPrintReport,
} from "../lib/pdfReports"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { InsightCard } from "../components/InsightCard"
import { calculateRiskLevel } from "../lib/risk"
import { buildTeamInsight } from "../lib/insights"
import { summarizeTeam } from "../lib/insights/metrics"
import { getLatestWeeklyReflection } from "../lib/weeklyEor"
import {
  aggregateWeeklyEorTrend,
  getLatestWeeklyTeamSnapshot,
} from "../lib/coachTeamAnalytics"
import { useAthleteInsight } from "../hooks/useAthleteInsight"
import { PsychologistCoachAdmin } from "../components/PsychologistCoachAdmin"
import { CoachDashboard } from "./CoachDashboard"
import { PsychologistActionCenter } from "../components/psychologist/PsychologistActionCenter"
import { todayISO } from "../lib/dates"
import {
  countActiveAlerts,
  dismissPsychologistAlert,
  loadVisiblePsychologistAlerts,
  markAlertsReviewedForAthlete,
  syncAndLoadPsychologistAlerts,
} from "../lib/alertPersistence"
import { filterActiveTeams } from "../lib/teams"
import { AthleteClinicalFile } from "../components/psychologist/AthleteClinicalFile"
import { useTeamInsight } from "../hooks/useTeamInsight"
import { EorIndexSummary } from "../components/EorIndexSummary"
import { WeeklyEorChart } from "../components/WeeklyEorTeamChart"
import { ComplianceTrendChart } from "../components/ComplianceTrendChart"
import { buildWeeklyComplianceTrend, currentWeekCompliance } from "../lib/complianceTrend"

const OVERVIEW_TAB = "overview"

export function PsychologistDashboard({ profile }) {
  const { t, lang } = useTranslation()
  const [athletes, setAthletes] = useState([])
  const [teams, setTeams] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [assessments, setAssessments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [activeTab, setActiveTab] = useState(OVERVIEW_TAB)
  const [coachPreviewTeamId, setCoachPreviewTeamId] = useState("")
  const [appointmentRequests, setAppointmentRequests] = useState([])
  const [psychologistMessages, setPsychologistMessages] = useState([])
  const [psychologistAlerts, setPsychologistAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const [
      { data: roster, error: rosterError },
      { data: teamList },
      { data: ins },
      assessmentRes,
      appointmentsRes,
      messagesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "athlete").order("name"),
      supabase.from("teams").select("id, name, deleted_at, club_id").is("deleted_at", null).order("name"),
      supabase
        .from("check_ins")
        .select("*")
        .order("check_in_date", { ascending: false })
        .limit(500),
      supabase.from("athlete_initial_assessments").select("*"),
      supabase
        .from("appointment_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("psychologist_messages")
        .select("*")
        .eq("status", "unread")
        .eq("sender_role", "athlete")
        .order("created_at", { ascending: false }),
    ])

    if (rosterError) {
      console.error("Athletes load error:", rosterError.message)
    }

    const athleteRows = roster || []
    const checkInRows = ins || []

    setAthletes(athleteRows)
    setTeams(filterActiveTeams(teamList || []))
    setCheckIns(checkInRows)
    setAssessments(assessmentRes.error ? [] : assessmentRes.data || [])
    setAppointmentRequests(appointmentsRes.error ? [] : appointmentsRes.data || [])
    setPsychologistMessages(messagesRes.error ? [] : messagesRes.data || [])

    const alerts = await syncAndLoadPsychologistAlerts(
      supabase,
      athleteRows,
      checkInRows,
      todayISO(),
      assessmentRes.error ? [] : assessmentRes.data || []
    )
    setPsychologistAlerts(alerts)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((tm) => [tm.id, tm.name])),
    [teams]
  )

  const athleteMap = useMemo(
    () => Object.fromEntries(athletes.map((a) => [a.id, a])),
    [athletes]
  )

  const teamSummaries = useMemo(
    () => buildTeamSummaries(teams, athletes, checkIns, t),
    [teams, athletes, checkIns, t]
  )

  const activeTeamSummary = useMemo(
    () => teamSummaries.find((item) => item.team.id === activeTab) ?? null,
    [teamSummaries, activeTab]
  )

  const tabAthletes = activeTeamSummary?.athletes ?? []
  const tabCheckIns = activeTeamSummary?.checkIns ?? []

  const selected = useMemo(
    () => tabAthletes.find((a) => a.id === selectedId) ?? null,
    [tabAthletes, selectedId]
  )

  const athleteCheckIns = useMemo(
    () => tabCheckIns.filter((c) => c.athlete_id === selectedId),
    [tabCheckIns, selectedId]
  )

  const teamWeeklyTrend = useMemo(
    () => aggregateWeeklyEorTrend(tabCheckIns),
    [tabCheckIns]
  )
  const teamComplianceTrend = useMemo(
    () => buildWeeklyComplianceTrend(tabCheckIns, tabAthletes.map((a) => a.id)),
    [tabCheckIns, tabAthletes]
  )
  const teamComplianceNow = useMemo(
    () => currentWeekCompliance(tabCheckIns, tabAthletes.map((a) => a.id)),
    [tabCheckIns, tabAthletes]
  )
  const {
    insight: teamEvolutionInsight,
    source: teamEvolutionSource,
    loading: teamEvolutionLoading,
  } = useTeamInsight({
    teamName: teamMap[activeTab],
    athletes: tabAthletes,
    summary: activeTeamSummary?.summary,
    weeklyTrend: teamWeeklyTrend,
    complianceTrend: teamComplianceTrend,
    lang,
    t,
    enabled: activeTab !== OVERVIEW_TAB && Boolean(activeTeamSummary),
  })
  const teamWeeklySnapshot = useMemo(
    () => getLatestWeeklyTeamSnapshot(teamWeeklyTrend),
    [teamWeeklyTrend]
  )

  const activeAlertCount = useMemo(
    () => countActiveAlerts(psychologistAlerts),
    [psychologistAlerts]
  )

  const teamAlertCounts = useMemo(() => {
    const counts = {}
    for (const alert of psychologistAlerts) {
      if (alert.status !== "active") continue
      const athlete = athleteMap[alert.athleteId]
      if (!athlete?.team_id) continue
      counts[athlete.team_id] = (counts[athlete.team_id] || 0) + 1
    }
    return counts
  }, [psychologistAlerts, athleteMap])

  const selectedAssessment = useMemo(
    () => assessments.find((item) => item.athlete_id === selectedId) ?? null,
    [assessments, selectedId]
  )

  const selectedAthleteAlerts = useMemo(
    () => psychologistAlerts.filter((alert) => alert.athleteId === selectedId),
    [psychologistAlerts, selectedId]
  )

  const {
    insight: athleteInsight,
    source: athleteInsightSource,
    loading: athleteInsightLoading,
  } = useAthleteInsight({
    athlete: selected,
    checkIns: athleteCheckIns,
    assessment: selectedAssessment,
    teamName: selected?.team_id ? teamMap[selected.team_id] : "",
    lang,
    t,
    enabled: Boolean(selected),
  })

  const markAppointmentHandled = async (id) => {
    const { error } = await supabase
      .from("appointment_requests")
      .update({ status: "scheduled" })
      .eq("id", id)

    if (!error) {
      setAppointmentRequests((rows) => rows.filter((row) => row.id !== id))
    }
  }

  const markMessageRead = async (id) => {
    const { error } = await supabase
      .from("psychologist_messages")
      .update({ status: "read" })
      .eq("id", id)

    if (!error) {
      setPsychologistMessages((rows) => rows.filter((row) => row.id !== id))
    }
  }

  const openTeam = (teamId) => {
    setActiveTab(teamId)
    setSelectedId(null)
  }

  const refreshAlerts = useCallback(async () => {
    const alerts = await loadVisiblePsychologistAlerts(supabase, athletes)
    setPsychologistAlerts(alerts)
  }, [athletes])

  const openAthlete = async (athleteId) => {
    const athlete = athleteMap[athleteId]
    if (athlete?.team_id) {
      setActiveTab(athlete.team_id)
    }
    setSelectedId(athleteId)
    await markAlertsReviewedForAthlete(supabase, athleteId, profile.id)
    await refreshAlerts()
  }

  const selectAthlete = async (athleteId) => {
    setSelectedId(athleteId)
    await markAlertsReviewedForAthlete(supabase, athleteId, profile.id)
    await refreshAlerts()
  }

  const dismissAlert = async (alertId) => {
    try {
      await dismissPsychologistAlert(supabase, alertId, profile.id)
      setPsychologistAlerts((rows) => rows.filter((row) => row.dbId !== alertId))
    } catch (error) {
      console.error("Dismiss alert failed:", error.message)
    }
  }

  const exportCsv = () => {
    const exportAthletes = activeTab === OVERVIEW_TAB ? athletes : tabAthletes
    const exportCheckIns = activeTab === OVERVIEW_TAB ? checkIns : tabCheckIns
    const rows = buildCheckInsExport({
      checkIns: exportCheckIns,
      athletes: exportAthletes,
      teams,
      t,
    })
    const suffix =
      activeTab === OVERVIEW_TAB
        ? "todos"
        : teamMap[activeTab] || t("psychologist.tabOverview")
    downloadCsv(`zona-mental-checkins-${suffix}.csv`, rows)
  }

  const exportTeamPdf = () => {
    if (!activeTeamSummary) return
    downloadPrintReport({
      title: `${teamMap[activeTab]} — ${t("reports.teamReport")}`,
      subtitle: t("reports.monthlySubtitle"),
      rows: buildTeamReportSections({
        teamName: teamMap[activeTab],
        summary: activeTeamSummary.summary,
        eorSnapshot: teamWeeklySnapshot,
        evolutionInsight: teamEvolutionInsight,
        complianceTrend: teamComplianceTrend,
        weeklyTrend: teamWeeklyTrend,
        t,
        lang,
      }),
      filename: `equip-${teamMap[activeTab]}`,
      source: teamEvolutionSource,
    })
  }

  if (loading) return <LoadingSpinner label={t("psychologist.loading")} />

  const inboxCount =
    appointmentRequests.length + psychologistMessages.length + activeAlertCount

  return (
    <div className="dashboard-grid dashboard-grid--psych">
      <section className="hero-strip">
        <div>
          <h2>{t("psychologist.title")}</h2>
          <p>{t("psychologist.subtitle")}</p>
        </div>
        <Button variant="ghost" onClick={exportCsv}>
          {t("export.button")}
        </Button>
      </section>

      <nav className="psych-tabs" aria-label={t("psychologist.tabsLabel")}>
        <button
          type="button"
          className={activeTab === OVERVIEW_TAB ? "psych-tabs__btn active" : "psych-tabs__btn"}
          onClick={() => {
            setActiveTab(OVERVIEW_TAB)
            setSelectedId(null)
          }}
        >
          {t("psychologist.tabOverview")}
          {inboxCount > 0 && activeTab !== OVERVIEW_TAB && (
            <span className="psych-tabs__badge">{inboxCount}</span>
          )}
        </button>
        {teams.map((team) => {
          const alertCount = teamAlertCounts[team.id] ?? 0
          return (
            <button
              key={team.id}
              type="button"
              className={activeTab === team.id ? "psych-tabs__btn active" : "psych-tabs__btn"}
              onClick={() => openTeam(team.id)}
            >
              {team.name}
              {alertCount > 0 && <span className="psych-tabs__badge">{alertCount}</span>}
            </button>
          )
        })}
      </nav>

      {activeTab === OVERVIEW_TAB ? (
        <>
          <PsychologistActionCenter
            alerts={psychologistAlerts}
            appointmentRequests={appointmentRequests}
            psychologistMessages={psychologistMessages}
            teamSummaries={teamSummaries}
            athleteMap={athleteMap}
            t={t}
            onOpenAthlete={openAthlete}
            onDismissAlert={dismissAlert}
            onMarkAppointmentHandled={markAppointmentHandled}
            onMarkMessageRead={markMessageRead}
            onOpenTeam={openTeam}
          />

          <PsychologistCoachAdmin
            psychologistId={profile.id}
            onPreviewCoachTeam={setCoachPreviewTeamId}
            onOpenTeam={openTeam}
            athletes={athletes}
            checkIns={checkIns}
            alerts={psychologistAlerts}
          />
        </>
      ) : (
        activeTeamSummary && (
          <>
            <Card
              title={teamMap[activeTab]}
              subtitle={t("psychologist.teamPanelSubtitle")}
              action={
                <Button variant="ghost" onClick={exportTeamPdf}>
                  {t("reports.exportPdf")}
                </Button>
              }
            >
              <InsightCard
                title={t("insights.orgTitle")}
                insight={activeTeamSummary.insight}
              />
            </Card>

            <div className="stats-row stats-row--compact">
              <StatCard
                label={t("psychologist.athletesMonitored")}
                value={activeTeamSummary.athletes.length}
              />
              <StatCard
                label={t("coach.checkedInThisWeek")}
                value={t("psychologist.complianceRatio", {
                  done: teamComplianceNow.done,
                  total: teamComplianceNow.total,
                  pct: teamComplianceNow.pct,
                })}
              />
            </div>

            <ComplianceTrendChart trend={teamComplianceTrend} />

            <Card title={t("insights.evolutionTitle")} subtitle={t("insights.evolutionSubtitle")}>
              <InsightCard
                title={t("insights.evolutionCardTitle")}
                insight={teamEvolutionInsight}
                loading={teamEvolutionLoading}
                source={teamEvolutionSource}
              />
            </Card>

            <Card title={t("psychologist.teamEorTitle")} subtitle={t("psychologist.teamEorSubtitle")}>
              <EorIndexSummary indexes={teamWeeklySnapshot} variant="psychologist" t={t} />
            </Card>

            <WeeklyEorChart
              weeklyTrend={teamWeeklyTrend}
              variant="psychologist"
              title={t("psychologist.teamEorChartTitle")}
              subtitle={t("psychologist.teamEorChartSubtitle")}
            />

            <div className="psych-layout">
              <Card
                className="psych-sidebar"
                title={t("psychologist.allAthletes")}
                subtitle={t("psychologist.allAthletesSubtitle")}
              >
                {tabAthletes.length === 0 ? (
                  <p className="empty-state">{t("psychologist.noAthletesInCategory")}</p>
                ) : (
                  <ul className="athlete-picker">
                    {tabAthletes.map((a) => {
                      const athleteCheckInRows = tabCheckIns.filter((c) => c.athlete_id === a.id)
                      const latestWeekly = getLatestWeeklyReflection(athleteCheckInRows)
                      const risk = latestWeekly ? calculateRiskLevel(latestWeekly) : "noData"
                      const teamLabel = a.team_id ? teamMap[a.team_id] : null

                      return (
                        <li key={a.id}>
                          <button
                            type="button"
                            className={
                              selectedId === a.id
                                ? "athlete-picker__btn active"
                                : "athlete-picker__btn"
                            }
                            onClick={() => selectAthlete(a.id)}
                          >
                            <span className="athlete-picker__main">
                              <strong>{a.name}</strong>
                              {teamLabel && (
                                <small className="athlete-picker__team">{teamLabel}</small>
                              )}
                            </span>
                            <Badge variant={risk === "noData" ? "default" : risk}>
                              {t(`psychologist.riskBadge.${risk}`)}
                            </Badge>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>

              <div className="psych-detail">
                {selected ? (
                  <AthleteClinicalFile
                    athlete={selected}
                    teamName={teamMap[activeTab]}
                    checkIns={athleteCheckIns}
                    assessment={selectedAssessment}
                    insight={athleteInsight}
                    insightLoading={athleteInsightLoading}
                    insightSource={athleteInsightSource}
                    psychologistId={profile.id}
                    athleteAlerts={selectedAthleteAlerts}
                    onAlertsChange={refreshAlerts}
                    onAssessmentUpdated={load}
                    t={t}
                  />
                ) : (
                  <Card title={t("psychologist.selectAthleteTitle")}>
                    <p className="empty-state">{t("psychologist.selectAthleteText")}</p>
                  </Card>
                )}
              </div>
            </div>
          </>
        )
      )}

      {coachPreviewTeamId && (
        <section className="coach-preview-panel">
          <div className="coach-preview-panel__bar">
            <div>
              <h3>{t("teams.previewingTitle")}</h3>
              <p>{teamMap[coachPreviewTeamId] || t("coach.team")}</p>
            </div>
            <Button variant="ghost" onClick={() => setCoachPreviewTeamId("")}>
              {t("common.close")}
            </Button>
          </div>
          <CoachDashboard
            profile={{ ...profile, role: "coach", team_id: coachPreviewTeamId }}
            teamName={teamMap[coachPreviewTeamId]}
          />
        </section>
      )}
    </div>
  )
}

function buildTeamSummaries(teams, athletes, checkIns, t) {
  return teams.map((team) => {
    const teamAthletes = athletes.filter((a) => a.team_id === team.id)
    const ids = new Set(teamAthletes.map((a) => a.id))
    const teamCheckIns = checkIns.filter((c) => ids.has(c.athlete_id))
    const latestByAthlete = teamAthletes.map((a) => {
      const latest = teamCheckIns.find((c) => c.athlete_id === a.id)
      return { athlete: a, latest, risk: calculateRiskLevel(latest) }
    })
    const insight = buildTeamInsight(
      { athletes: teamAthletes, checkIns: teamCheckIns, latestByAthlete },
      t
    )
    const summary = summarizeTeam({
      athletes: teamAthletes,
      checkIns: teamCheckIns,
      latestByAthlete,
    })
    const highRiskCount = latestByAthlete.filter((row) => row.risk === "high").length
    const eorSnapshot = getLatestWeeklyTeamSnapshot(aggregateWeeklyEorTrend(teamCheckIns))

    return {
      team,
      athletes: teamAthletes,
      checkIns: teamCheckIns,
      latestByAthlete,
      insight,
      summary,
      highRiskCount,
      eorSnapshot,
    }
  })
}
