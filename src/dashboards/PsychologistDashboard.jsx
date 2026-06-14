import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { buildCheckInsExport, downloadCsv } from "../lib/export"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { InsightCard } from "../components/InsightCard"
import { calculateRiskLevel } from "../lib/risk"
import { buildTeamInsight } from "../lib/insights"
import { summarizeTeam } from "../lib/insights/metrics"
import { useAthleteInsight } from "../hooks/useAthleteInsight"
import { PsychologistCoachAdmin } from "../components/PsychologistCoachAdmin"
import { consentStatus } from "../lib/age"
import { CoachDashboard } from "./CoachDashboard"
import { PsychologistInbox } from "../components/psychologist/PsychologistInbox"
import {
  PsychologistOverview,
  buildConsentCounts,
} from "../components/psychologist/PsychologistOverview"
import { PsychologistAthleteDetail } from "../components/psychologist/PsychologistAthleteDetail"

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
      supabase.from("teams").select("id, name").order("name"),
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
        .order("created_at", { ascending: false }),
    ])

    if (rosterError) {
      console.error("Athletes load error:", rosterError.message)
    }

    setAthletes(roster || [])
    setTeams(teamList || [])
    setCheckIns(ins || [])
    setAssessments(assessmentRes.error ? [] : assessmentRes.data || [])
    setAppointmentRequests(appointmentsRes.error ? [] : appointmentsRes.data || [])
    setPsychologistMessages(messagesRes.error ? [] : messagesRes.data || [])
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

  const orgLatestByAthlete = useMemo(
    () =>
      athletes.map((a) => {
        const latest = checkIns.find((c) => c.athlete_id === a.id)
        return { athlete: a, latest, risk: calculateRiskLevel(latest) }
      }),
    [athletes, checkIns]
  )

  const orgInsight = useMemo(
    () => buildTeamInsight({ athletes, checkIns, latestByAthlete: orgLatestByAthlete }, t),
    [athletes, checkIns, orgLatestByAthlete, t]
  )

  const consentCounts = useMemo(() => buildConsentCounts(athletes), [athletes])

  const selectedAssessment = useMemo(
    () => assessments.find((item) => item.athlete_id === selectedId) ?? null,
    [assessments, selectedId]
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

  const openAthlete = (athleteId) => {
    const athlete = athleteMap[athleteId]
    if (athlete?.team_id) {
      setActiveTab(athlete.team_id)
    }
    setSelectedId(athleteId)
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

  if (loading) return <LoadingSpinner label={t("psychologist.loading")} />

  const inboxCount = appointmentRequests.length + psychologistMessages.length

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
          const summary = teamSummaries.find((item) => item.team.id === team.id)
          const alertCount = summary?.highRiskCount ?? 0
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
          <PsychologistInbox
            appointmentRequests={appointmentRequests}
            psychologistMessages={psychologistMessages}
            athleteMap={athleteMap}
            teamMap={teamMap}
            t={t}
            onMarkAppointmentHandled={markAppointmentHandled}
            onMarkMessageRead={markMessageRead}
            onOpenAthlete={openAthlete}
          />

          <PsychologistOverview
            athletes={athletes}
            checkIns={checkIns}
            teamSummaries={teamSummaries}
            orgInsight={orgInsight}
            consentCounts={consentCounts}
            t={t}
            onOpenTeam={openTeam}
          />

          <PsychologistCoachAdmin
            psychologistId={profile.id}
            onPreviewCoachTeam={setCoachPreviewTeamId}
          />
        </>
      ) : (
        activeTeamSummary && (
          <>
            <Card title={teamMap[activeTab]} subtitle={t("psychologist.teamPanelSubtitle")}>
              <InsightCard
                title={t("insights.orgTitle")}
                insight={activeTeamSummary.insight}
                footer={t("insights.footer")}
              />
            </Card>

            <div className="stats-row stats-row--compact">
              <StatCard
                label={t("psychologist.athletesMonitored")}
                value={activeTeamSummary.athletes.length}
              />
              <StatCard
                label={t("coach.checkedInThisWeek")}
                value={activeTeamSummary.summary.checkedInThisWeek}
              />
              <StatCard
                label={t("psychologist.orgAvgMood")}
                value={activeTeamSummary.summary.teamAvg.mood || "—"}
              />
              <StatCard
                label={t("psychologist.highEmotionalRisk")}
                value={activeTeamSummary.summary.riskBreakdown.high}
                accent="var(--danger)"
              />
            </div>

            <div className="psych-layout">
              <Card
                title={t("psychologist.allAthletes")}
                subtitle={t("psychologist.allAthletesSubtitle")}
              >
                {tabAthletes.length === 0 ? (
                  <p className="empty-state">{t("psychologist.noAthletesInCategory")}</p>
                ) : (
                  <ul className="athlete-picker">
                    {tabAthletes.map((a) => {
                      const latest = tabCheckIns.find((c) => c.athlete_id === a.id)
                      const risk = calculateRiskLevel(latest)
                      return (
                        <li key={a.id}>
                          <button
                            type="button"
                            className={
                              selectedId === a.id
                                ? "athlete-picker__btn active"
                                : "athlete-picker__btn"
                            }
                            onClick={() => setSelectedId(a.id)}
                          >
                            <span>
                              {a.name}
                              <small className="athlete-picker__cat">
                                {t(`consent.${consentStatus(a)}`)}
                              </small>
                            </span>
                            {latest && <Badge variant={risk}>{t(`risk.${risk}`)}</Badge>}
                            {!a.initial_assessment_completed_at && (
                              <Badge variant="default">
                                {t("psychologist.assessmentMissing")}
                              </Badge>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>

              <div className="psych-detail">
                {selected ? (
                  <PsychologistAthleteDetail
                    athlete={selected}
                    teamName={teamMap[activeTab]}
                    checkIns={athleteCheckIns}
                    assessment={selectedAssessment}
                    insight={athleteInsight}
                    insightLoading={athleteInsightLoading}
                    insightSource={athleteInsightSource}
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

    return {
      team,
      athletes: teamAthletes,
      checkIns: teamCheckIns,
      latestByAthlete,
      insight,
      summary,
      highRiskCount,
    }
  })
}
