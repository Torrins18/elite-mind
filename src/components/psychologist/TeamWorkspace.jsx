import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../../supabase"
import { Card } from "../ui/Card"
import { StatCard } from "../ui/StatCard"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { InsightCard } from "../InsightCard"
import { EorIndexSummary } from "../EorIndexSummary"
import { WeeklyEorChart } from "../WeeklyEorTeamChart"
import { ComplianceTrendChart } from "../ComplianceTrendChart"
import { AthleteClinicalFile } from "./AthleteClinicalFile"
import { CoachShareRecommendation } from "./CoachShareRecommendation"
import { TeamEntrenamentMentalPanel } from "../EntrenamentMentalCard"
import { EmptyState } from "../ui/EmptyState"
import { getTeamMentalTrainingStatus } from "../../lib/entrenamentMental"
import { todayISO } from "../../lib/dates"
import { calculateRiskLevel } from "../../lib/risk"
import { getLatestWeeklyReflection } from "../../lib/weeklyEor"

const WORKSPACE_TABS = [
  "summary",
  "athletes",
  "alerts",
  "participation",
  "eor",
  "reports",
  "notes",
]

function TeamAlertsPanel({ alerts, t, onDismissAlert, onOpenAthlete }) {
  const active = alerts.filter(
    (row) => row.status === "active" || row.status === "monitoring"
  )

  if (!active.length) {
    return <p className="empty-state">{t("psychologist.noActiveAlerts")}</p>
  }

  return (
    <ul className="team-workspace-alerts">
      {active.map((alert) => (
        <li key={alert.dbId || `${alert.athleteId}-${alert.id}`} className="team-workspace-alerts__item">
          <div>
            <strong>{alert.athleteName}</strong>
            <span>{t(`psychologist.alert.${alert.id}`, alert)}</span>
          </div>
          <div className="team-workspace-alerts__actions">
            {alert.dbId ? (
              <Button variant="ghost" className="btn--danger-text" onClick={() => onDismissAlert(alert.dbId)}>
                {t("psychologist.dismissAlert")}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              onClick={() =>
                onOpenAthlete(alert.athleteId, {
                  athleteTab: "profile",
                  focusAlertId: alert.dbId || null,
                })
              }
            >              {t("psychologist.viewAthlete")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function TeamNotesPanel({ athleteIds, athleteMap, t, onOpenAthlete }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!athleteIds.length) {
      setNotes([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from("psychologist_notes")
      .select("*")
      .in("athlete_id", athleteIds)
      .order("note_date", { ascending: false })
      .limit(40)

    setNotes(data || [])
    setLoading(false)
  }, [athleteIds])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <p className="empty-state">{t("psychologist.loading")}</p>
  if (!notes.length) return <p className="empty-state">{t("workspace.noTeamNotes")}</p>

  return (
    <ul className="team-workspace-notes">
      {notes.map((note) => {
        const athlete = athleteMap[note.athlete_id]
        return (
          <li key={note.id} className="team-workspace-notes__item">
            <header>
              <button type="button" className="team-workspace-notes__athlete" onClick={() => onOpenAthlete(note.athlete_id)}>
                {athlete?.name || t("psychologist.unknownAthlete")}
              </button>
              <time>{note.note_date}</time>
            </header>
            {note.topic ? <p className="team-workspace-notes__topic">{note.topic}</p> : null}
            {note.actions ? <p>{note.actions}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}

export function TeamWorkspace({
  teamId,
  teamName,
  teamRecord,
  teamSummary,
  athletes,
  checkIns,
  teamAlerts,
  teamWeeklyTrend,
  teamComplianceTrend,
  teamComplianceNow,
  teamWeeklySnapshot,
  teamEvolutionInsight,
  teamEvolutionLoading,
  teamEvolutionSource,
  selectedId,
  onSelectAthlete,
  selectedAthlete,
  athleteCheckIns,
  selectedAssessment,
  athleteInsight,
  athleteInsightLoading,
  athleteInsightSource,
  selectedAthleteAlerts,
  psychologistId,
  athleteMap,
  onBackToOverview,
  onExportTeamPdf,
  onExportCsv,
  onDismissAlert,
  onOpenAthlete,
  onAlertsChange,
  onAssessmentUpdated,
  initialTeamTab,
  initialAthleteTab,
  focusAlertId = null,
  onFocusAlertHandled,
  lang,
  t,
}) {
  const [activeTab, setActiveTab] = useState(initialTeamTab || "athletes")

  useEffect(() => {
    setActiveTab(initialTeamTab || "athletes")
  }, [teamId, initialTeamTab])

  const alertCount = useMemo(
    () =>
      teamAlerts.filter(
        (row) => row.status === "active" || row.status === "monitoring"
      ).length,
    [teamAlerts]
  )

  const athleteIds = useMemo(() => athletes.map((row) => row.id), [athletes])

  const mentalTrainingStatus = useMemo(
    () => getTeamMentalTrainingStatus(todayISO(), lang, t, teamRecord),
    [teamRecord, lang, t]
  )

  const tabLabel = (tab) => {
    if (tab === "alerts" && alertCount > 0) {
      return `${t(`workspace.tab.${tab}`)} (${alertCount})`
    }
    return t(`workspace.tab.${tab}`)
  }

  return (
    <section className="team-workspace">
      <header className="team-workspace__header">
        <div className="team-workspace__header-main">
          <button type="button" className="team-workspace__back" onClick={onBackToOverview}>
            ← {t("workspace.backToDashboard")}
          </button>
          <h2 className="team-workspace__title">{teamName}</h2>
          <p className="team-workspace__subtitle">{t("brand.systemName")}</p>
          <p className="team-workspace__subtitle team-workspace__subtitle--muted">{t("brand.decisionSupport")}</p>
        </div>
      </header>

      <nav className="team-workspace-tabs" aria-label={t("workspace.tabsLabel")}>
        {WORKSPACE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "team-workspace-tabs__btn active" : "team-workspace-tabs__btn"}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </nav>

      <div className="team-workspace__panel">
        {activeTab === "summary" && teamSummary ? (
          <>
            <div className="stats-row stats-row--compact">
              <StatCard label={t("psychologist.athletesMonitored")} value={athletes.length} />
              <StatCard
                label={t("coach.checkedInThisWeek")}
                value={t("psychologist.complianceRatio", {
                  done: teamComplianceNow.done,
                  total: teamComplianceNow.total,
                  pct: teamComplianceNow.pct,
                })}
              />
              <StatCard
                label={t("psychologist.highEmotionalRisk")}
                value={teamSummary.highRiskCount}
              />
            </div>
            {teamWeeklySnapshot ? (
              <Card title={t("psychologist.teamEorTitle")} subtitle={t("workspace.summaryEorHint")}>
                <EorIndexSummary indexes={teamWeeklySnapshot} variant="psychologist" t={t} />
              </Card>
            ) : (
              <EmptyState
                icon="chart"
                title={t("ux.emptyTeamReviewsTitle")}
                description={t("ux.emptyTeamReviewsBody")}
              />
            )}
            <CoachShareRecommendation
              teamId={teamId}
              psychologistId={psychologistId}
              t={t}
            />
            <Card title={t("entrenamentMental.psychologistPanelTitle")}>
              <TeamEntrenamentMentalPanel status={mentalTrainingStatus} />
            </Card>
          </>
        ) : null}

        {activeTab === "athletes" ? (
          <div className="psych-layout">
            <Card
              className="psych-sidebar"
              title={t("psychologist.allAthletes")}
              subtitle={t("psychologist.allAthletesSubtitle")}
            >
              {athletes.length === 0 ? (
                <p className="empty-state">{t("psychologist.noAthletesInCategory")}</p>
              ) : (
                <ul className="athlete-picker">
                  {athletes.map((athlete) => {
                    const athleteRows = checkIns.filter((row) => row.athlete_id === athlete.id)
                    const latestWeekly = getLatestWeeklyReflection(athleteRows)
                    const risk = latestWeekly ? calculateRiskLevel(latestWeekly) : "noData"

                    return (
                      <li key={athlete.id}>
                        <button
                          type="button"
                          className={
                            selectedId === athlete.id ? "athlete-picker__btn active" : "athlete-picker__btn"
                          }
                          onClick={() => onSelectAthlete(athlete.id)}
                        >
                          <span className="athlete-picker__main">
                            <strong>{athlete.name}</strong>
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
              {selectedAthlete ? (
                <AthleteClinicalFile
                  athlete={selectedAthlete}
                  teamName={teamName}
                  checkIns={athleteCheckIns}
                  assessment={selectedAssessment}
                  insight={athleteInsight}
                  insightLoading={athleteInsightLoading}
                  insightSource={athleteInsightSource}
                  psychologistId={psychologistId}
                  athleteAlerts={selectedAthleteAlerts}
                  onAlertsChange={onAlertsChange}
                  onAssessmentUpdated={onAssessmentUpdated}
                  initialTab={initialAthleteTab}
                  focusAlertId={focusAlertId}
                  onFocusAlertHandled={onFocusAlertHandled}
                  t={t}
                />
              ) : (
                <Card title={t("psychologist.selectAthleteTitle")}>
                  <p className="empty-state">{t("psychologist.selectAthleteText")}</p>
                </Card>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "alerts" ? (
          <Card title={t("psychologist.actionAlerts")} subtitle={t("psychologist.actionAlertsSubtitle")}>
            <TeamAlertsPanel
              alerts={teamAlerts}
              t={t}
              onDismissAlert={onDismissAlert}
              onOpenAthlete={(athleteId, opts = {}) => {
                onOpenAthlete(athleteId, opts)
                setActiveTab("athletes")
              }}
            />
          </Card>
        ) : null}

        {activeTab === "participation" ? (
          <>
            <div className="stats-row stats-row--compact">
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
          </>
        ) : null}

        {activeTab === "eor" ? (
          <>
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
          </>
        ) : null}

        {activeTab === "reports" ? (
          <Card title={t("workspace.reportsTitle")} subtitle={t("workspace.reportsSubtitle")}>
            <div className="team-workspace-reports">
              <Button onClick={onExportTeamPdf}>{t("reports.exportPdf")}</Button>
              <Button variant="ghost" onClick={onExportCsv}>
                {t("export.button")}
              </Button>
            </div>
          </Card>
        ) : null}

        {activeTab === "notes" ? (
          <Card title={t("workspace.notesTitle")} subtitle={t("workspace.notesSubtitle")}>
            <TeamNotesPanel
              athleteIds={athleteIds}
              athleteMap={athleteMap}
              t={t}
              onOpenAthlete={(athleteId) => {
                onOpenAthlete(athleteId)
                setActiveTab("athletes")
              }}
            />
          </Card>
        ) : null}
      </div>
    </section>
  )
}
