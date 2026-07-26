import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../../supabase"
import { Card } from "../ui/Card"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { InsightCard } from "../InsightCard"
import { WeeklyEorChart } from "../WeeklyEorTeamChart"
import { WeeklyEorPanel } from "../WeeklyEorPanel"
import { AthleteFileNotes } from "./AthleteFileNotes"
import { AthleteFileSessions } from "./AthleteFileSessions"
import { AthleteFileDocuments } from "./AthleteFileDocuments"
import { AthleteFileMessages } from "./AthleteFileMessages"
import { AthleteFilePlan } from "./AthleteFilePlan"
import { aggregateWeeklyEorTrend } from "../../lib/coachTeamAnalytics"
import { getLatestWeeklyReflection, hasWeeklyReflection } from "../../lib/weeklyEor"
import { calculateRiskLevel } from "../../lib/risk"
import { consentStatus } from "../../lib/age"
import {
  normalizeAlertRecord,
  updatePsychologistAlertStatus,
} from "../../lib/alertPersistence"
import {
  buildAthleteFollowUpSummary,
  formatAlertCriterion,
  formatMonthYear,
  formatRelativeDaysAgo,
} from "../../lib/athleteFollowUpSummary"
import { useTranslation } from "../../i18n/LanguageContext"
import { AthleteFileBaseline } from "./AthleteFileBaseline"
import {
  buildAthleteReportSections,
  downloadPrintReport,
} from "../../lib/pdfReports"

const TABS = [
  "profile",
  "baseline",
  "reviews",
  "charts",
  "notes",
  "sessions",
  "documents",
  "plan",
  "appointments",
  "messages",
  "alerts",
]

const ALERT_FILTERS = ["all", "active", "monitoring", "resolved", "dismissed"]

export function AthleteClinicalFile({
  athlete,
  teamName,
  checkIns,
  assessment,
  insight,
  insightLoading,
  insightSource,
  psychologistId,
  athleteAlerts = [],
  onAlertsChange,
  onAssessmentUpdated,
  initialTab,
  focusAlertId = null,
  onFocusAlertHandled,
  t,
}) {
  const { lang } = useTranslation()
  const [activeTab, setActiveTab] = useState(initialTab || "profile")
  const [notes, setNotes] = useState([])
  const [sessions, setSessions] = useState([])
  const [documents, setDocuments] = useState([])
  const [goals, setGoals] = useState([])
  const [resources, setResources] = useState([])
  const [appointments, setAppointments] = useState([])
  const [messages, setMessages] = useState([])
  const [alertHistory, setAlertHistory] = useState([])
  const [expandedReviewId, setExpandedReviewId] = useState(null)
  const [recordLoading, setRecordLoading] = useState(true)
  const [bannerAlertId, setBannerAlertId] = useState(focusAlertId)

  const weeklyReviews = useMemo(
    () => (checkIns || []).filter(hasWeeklyReflection),
    [checkIns]
  )
  const latestWeekly = useMemo(() => getLatestWeeklyReflection(checkIns), [checkIns])
  const weeklyTrend = useMemo(() => aggregateWeeklyEorTrend(checkIns), [checkIns])
  const risk = latestWeekly ? calculateRiskLevel(latestWeekly) : "noData"

  const loadRecord = useCallback(async () => {
    if (!athlete?.id) return
    setRecordLoading(true)

    const [notesRes, sessionsRes, documentsRes, goalsRes, resourcesRes, appointmentsRes, messagesRes, alertsRes] =
      await Promise.all([
      supabase
        .from("psychologist_notes")
        .select("*")
        .eq("athlete_id", athlete.id)
        .order("note_date", { ascending: false }),
      supabase
        .from("psychologist_sessions")
        .select("*")
        .eq("athlete_id", athlete.id)
        .order("session_date", { ascending: false }),
      supabase
        .from("athlete_documents")
        .select("*")
        .eq("athlete_id", athlete.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("athlete_goals")
        .select(
          "*, athlete_goal_steps(*, psychologist_resources(id, title, resource_type, url))"
        )
        .eq("athlete_id", athlete.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("psychologist_resources")
        .select("id, title, resource_type")
        .eq("psychologist_id", psychologistId)
        .order("title"),
      supabase
        .from("appointment_requests")
        .select("*")
        .eq("user_id", athlete.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("psychologist_messages")
        .select("*")
        .eq("user_id", athlete.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("psychologist_alerts")
        .select("*")
        .eq("athlete_id", athlete.id)
        .order("created_at", { ascending: false }),
    ])

    setNotes(notesRes.error ? [] : notesRes.data || [])
    setSessions(sessionsRes.error ? [] : sessionsRes.data || [])
    setDocuments(documentsRes.error ? [] : documentsRes.data || [])
    setGoals(goalsRes.error ? [] : goalsRes.data || [])
    setResources(resourcesRes.error ? [] : resourcesRes.data || [])
    setAppointments(appointmentsRes.error ? [] : appointmentsRes.data || [])
    setMessages(messagesRes.error ? [] : messagesRes.data || [])
    setAlertHistory(alertsRes.error ? [] : alertsRes.data || [])
    setRecordLoading(false)
  }, [athlete?.id, psychologistId])

  useEffect(() => {
    setActiveTab(initialTab || "profile")
    setExpandedReviewId(null)
    loadRecord()
  }, [athlete?.id, initialTab, loadRecord])

  useEffect(() => {
    setBannerAlertId(focusAlertId)
  }, [focusAlertId, athlete?.id])

  const normalizedHistory = useMemo(
    () => (alertHistory || []).map(normalizeAlertRecord).filter(Boolean),
    [alertHistory]
  )

  const followUp = useMemo(
    () =>
      buildAthleteFollowUpSummary({
        athlete,
        checkIns,
        sessions,
        goals,
        alerts: normalizedHistory,
      }),
    [athlete, checkIns, sessions, goals, normalizedHistory]
  )

  const focusedAlert = useMemo(() => {
    if (!bannerAlertId) return null
    const fromHistory = normalizedHistory.find((a) => a.dbId === bannerAlertId)
    if (fromHistory) return fromHistory
    return (
      (athleteAlerts || [])
        .map(normalizeAlertRecord)
        .find((a) => a.dbId === bannerAlertId) || null
    )
  }, [bannerAlertId, normalizedHistory, athleteAlerts])

  const updateAppointmentStatus = async (id, status, extra = {}) => {
    const { error } = await supabase
      .from("appointment_requests")
      .update({ status, ...extra })
      .eq("id", id)
    if (!error) await loadRecord()
  }

  const handleAlertUpdate = async (alertId, opts) => {
    try {
      await updatePsychologistAlertStatus(supabase, alertId, {
        ...opts,
        psychologistId,
      })
      await loadRecord()
      onAlertsChange?.()
      if (bannerAlertId === alertId && opts.status !== "monitoring") {
        setBannerAlertId(null)
        onFocusAlertHandled?.()
      }
    } catch (error) {
      console.error("Alert update failed:", error.message)
    }
  }

  const pendingAlertCount = normalizedHistory.filter(
    (a) => a.status === "active" || a.status === "monitoring"
  ).length

  const exportAthleteReport = () => {
    downloadPrintReport({
      title: `${athlete.name} — ${t("reports.athleteReport")}`,
      subtitle: t("reports.individualSubtitle"),
      rows: buildAthleteReportSections({
        athlete,
        teamName,
        risk,
        latestWeekly,
        insight,
        weeklyTrend,
        assessment,
        t,
        lang,
      }),
      filename: `esportista-${athlete.name}`,
      source: insightSource,
    })
  }

  return (
    <Card
      title={athlete.name}
      subtitle={t("athleteFile.subtitle")}
      className="athlete-clinical-file"
    >
      {teamName && <p className="athlete-clinical-file__team">{teamName}</p>}

      <nav className="athlete-file-tabs" aria-label={t("athleteFile.tabsLabel")}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "athlete-file-tabs__btn active" : "athlete-file-tabs__btn"}
            onClick={() => setActiveTab(tab)}
          >
            {t(`athleteFile.tab.${tab}`)}
            {tab === "plan" && goals.filter((g) => g.status === "active").length > 0 && (
              <span className="athlete-file-tabs__badge">
                {goals.filter((g) => g.status === "active").length}
              </span>
            )}
            {tab === "alerts" && pendingAlertCount > 0 && (
              <span className="athlete-file-tabs__badge">{pendingAlertCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="athlete-file-panel">
        {activeTab === "profile" && (
          <ProfileTab
            athlete={athlete}
            teamName={teamName}
            risk={risk}
            followUp={followUp}
            focusedAlert={focusedAlert}
            lang={lang}
            t={t}
            onExportReport={exportAthleteReport}
            onViewEvolution={() => setActiveTab("charts")}
            onMarkReviewed={() =>
              focusedAlert?.dbId &&
              handleAlertUpdate(focusedAlert.dbId, { status: "reviewed" })
            }
            onDismiss={() =>
              focusedAlert?.dbId &&
              handleAlertUpdate(focusedAlert.dbId, { status: "dismissed" })
            }
            onSaveAction={(payload) =>
              focusedAlert?.dbId && handleAlertUpdate(focusedAlert.dbId, payload)
            }
            onDismissBanner={() => {
              setBannerAlertId(null)
              onFocusAlertHandled?.()
            }}
          />
        )}

        {activeTab === "baseline" && (
          <AthleteFileBaseline
            athlete={athlete}
            assessment={assessment}
            latestWeekly={latestWeekly}
            teamName={teamName}
            lang={lang}
            t={t}
            onAssessmentUpdated={onAssessmentUpdated}
          />
        )}

        {activeTab === "reviews" && (
          <ReviewsTab
            weeklyReviews={weeklyReviews}
            expandedReviewId={expandedReviewId}
            onToggle={(id) => setExpandedReviewId((prev) => (prev === id ? null : id))}
            t={t}
          />
        )}

        {activeTab === "charts" && (
          <ChartsTab
            insight={insight}
            insightLoading={insightLoading}
            insightSource={insightSource}
            weeklyTrend={weeklyTrend}
            t={t}
          />
        )}

        {activeTab === "notes" && (
          recordLoading ? (
            <p className="empty-state">{t("athleteFile.loading")}</p>
          ) : (
            <AthleteFileNotes
              athleteId={athlete.id}
              psychologistId={psychologistId}
              notes={notes}
              onNotesChange={loadRecord}
              t={t}
            />
          )
        )}

        {activeTab === "sessions" && (
          recordLoading ? (
            <p className="empty-state">{t("athleteFile.loading")}</p>
          ) : (
            <AthleteFileSessions
              athleteId={athlete.id}
              psychologistId={psychologistId}
              sessions={sessions}
              onChange={loadRecord}
              t={t}
            />
          )
        )}

        {activeTab === "documents" && (
          recordLoading ? (
            <p className="empty-state">{t("athleteFile.loading")}</p>
          ) : (
            <AthleteFileDocuments
              athleteId={athlete.id}
              psychologistId={psychologistId}
              documents={documents}
              onChange={loadRecord}
              t={t}
            />
          )
        )}

        {activeTab === "plan" && (
          recordLoading ? (
            <p className="empty-state">{t("athleteFile.loading")}</p>
          ) : (
            <AthleteFilePlan
              athleteId={athlete.id}
              psychologistId={psychologistId}
              goals={goals}
              resources={resources}
              onChange={loadRecord}
              t={t}
            />
          )
        )}

        {activeTab === "appointments" && (
          <AppointmentsTab
            appointments={appointments}
            loading={recordLoading}
            onUpdateStatus={updateAppointmentStatus}
            t={t}
          />
        )}

        {activeTab === "messages" && (
          recordLoading ? (
            <p className="empty-state">{t("athleteFile.loading")}</p>
          ) : (
            <AthleteFileMessages
              athleteId={athlete.id}
              psychologistId={psychologistId}
              messages={messages}
              onChange={loadRecord}
              t={t}
            />
          )
        )}

        {activeTab === "alerts" && (
          <AlertsTab
            alerts={normalizedHistory}
            loading={recordLoading}
            onUpdate={handleAlertUpdate}
            t={t}
            lang={lang}
          />
        )}
      </div>
    </Card>
  )
}

function ProfileTab({
  athlete,
  teamName,
  risk,
  followUp,
  focusedAlert,
  lang,
  t,
  onExportReport,
  onViewEvolution,
  onMarkReviewed,
  onDismiss,
  onSaveAction,
  onDismissBanner,
}) {
  const [showActionForm, setShowActionForm] = useState(false)
  const [actionTaken, setActionTaken] = useState("")
  const [professionalNote, setProfessionalNote] = useState("")
  const [actionStatus, setActionStatus] = useState("monitoring")

  useEffect(() => {
    setShowActionForm(false)
    setActionTaken(focusedAlert?.actionTaken || "")
    setProfessionalNote(focusedAlert?.professionalNote || "")
    setActionStatus("monitoring")
  }, [focusedAlert?.dbId])

  const submitAction = (event) => {
    event.preventDefault()
    onSaveAction({
      status: actionStatus,
      actionTaken: actionTaken.trim(),
      professionalNote: professionalNote.trim(),
    })
    setShowActionForm(false)
  }

  return (
    <div className="athlete-file-summary">
      {focusedAlert && (focusedAlert.status === "active" || focusedAlert.status === "monitoring") && (
        <aside className="athlete-file-alert-banner" role="status">
          <div className="athlete-file-alert-banner__body">
            <p className="athlete-file-alert-banner__eyebrow">{t("athleteFile.banner.title")}</p>
            <p className="athlete-file-alert-banner__reason">
              {t(`psychologist.alert.${focusedAlert.alertType}`, {
                value: focusedAlert.value,
                days: focusedAlert.days,
                baseline: focusedAlert.baseline,
              })}
            </p>
            <p className="athlete-file-alert-banner__criterion">
              {formatAlertCriterion(focusedAlert, t)}
            </p>
          </div>
          <div className="athlete-file-alert-banner__actions">
            <Button variant="ghost" onClick={onViewEvolution}>
              {t("athleteFile.banner.viewEvolution")}
            </Button>
            <Button variant="ghost" onClick={onMarkReviewed}>
              {t("athleteFile.banner.markReviewed")}
            </Button>
            <Button variant="ghost" onClick={() => setShowActionForm((v) => !v)}>
              {t("athleteFile.banner.addAction")}
            </Button>
            <Button variant="ghost" className="btn--danger-text" onClick={onDismiss}>
              {t("athleteFile.banner.dismiss")}
            </Button>
            <button
              type="button"
              className="athlete-file-alert-banner__close"
              onClick={onDismissBanner}
            >
              {t("athleteFile.banner.dismissBanner")}
            </button>
          </div>
          {showActionForm && (
            <form className="athlete-file-alert-action-form" onSubmit={submitAction}>
              <label>
                <span>{t("athleteFile.history.actionTaken")}</span>
                <input
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder={t("athleteFile.history.actionPlaceholder")}
                  required
                />
              </label>
              <label>
                <span>{t("athleteFile.history.professionalNote")}</span>
                <textarea
                  value={professionalNote}
                  onChange={(e) => setProfessionalNote(e.target.value)}
                  placeholder={t("athleteFile.history.notePlaceholder")}
                  rows={3}
                />
              </label>
              <label>
                <span>{t("athleteFile.history.newStatus")}</span>
                <select value={actionStatus} onChange={(e) => setActionStatus(e.target.value)}>
                  <option value="monitoring">{t("athleteFile.alertStatus.monitoring")}</option>
                  <option value="resolved">{t("athleteFile.alertStatus.resolved")}</option>
                  <option value="reviewed">{t("athleteFile.alertStatus.reviewed")}</option>
                </select>
              </label>
              <div className="athlete-file-alert-action-form__actions">
                <Button type="submit">{t("athleteFile.history.saveAction")}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowActionForm(false)}>
                  {t("athleteFile.cancel")}
                </Button>
              </div>
            </form>
          )}
        </aside>
      )}

      <div className="athlete-file-profile__actions">
        <Button variant="ghost" onClick={onExportReport}>
          {t("reports.exportPdf")}
        </Button>
      </div>

      <dl className="athlete-file-profile athlete-file-profile--summary">
        <div>
          <dt>{t("athleteFile.profileTeam")}</dt>
          <dd>{teamName || t("risk.noData")}</dd>
        </div>
        <div>
          <dt>{t("psychologist.birthDate")}</dt>
          <dd>
            {athlete.date_of_birth
              ? `${athlete.date_of_birth}${followUp.age != null ? ` (${followUp.age})` : ""}`
              : t("risk.noData")}
          </dd>
        </div>
        {followUp.isMinor && (
          <div>
            <dt>{t("psychologist.consentStatus")}</dt>
            <dd>{t(`consent.${consentStatus(athlete)}`)}</dd>
          </div>
        )}
        <div>
          <dt>{t("athleteFile.profileRisk")}</dt>
          <dd>
            <Badge variant={risk === "noData" ? "default" : risk}>
              {t(`psychologist.riskBadge.${risk}`)}
            </Badge>
          </dd>
        </div>
      </dl>

      <section className="athlete-file-section athlete-file-follow-up">
        <h3>{t("athleteFile.summary.title")}</h3>
        <ul className="athlete-file-follow-up__list">
          <li>
            {followUp.followUpStart
              ? t("athleteFile.summary.followUpStarted", {
                  date: formatMonthYear(followUp.followUpStart, lang),
                })
              : t("athleteFile.summary.noFollowUpStart")}
          </li>
          <li>
            {followUp.hasReviews
              ? t("athleteFile.summary.lastReview", {
                  when: formatRelativeDaysAgo(followUp.lastReviewDaysAgo, t),
                })
              : t("athleteFile.summary.noReviews")}
          </li>
          {followUp.hasReviews && (
            <li>
              {t("athleteFile.summary.completedReviews", { count: followUp.completedReviews })}
            </li>
          )}
          {followUp.adherencePct != null && followUp.hasReviews && (
            <li>{t("athleteFile.summary.adherence", { pct: followUp.adherencePct })}</li>
          )}
          <li>
            {followUp.hasSessions
              ? t("athleteFile.summary.sessions", { count: followUp.sessionCount })
              : t("athleteFile.summary.noSessions")}
          </li>
          <li>
            {followUp.hasActivePlans
              ? t("athleteFile.summary.activePlans", { count: followUp.activePlans })
              : t("athleteFile.summary.noActivePlans")}
          </li>
          <li>
            {followUp.pendingAlerts > 0
              ? t("athleteFile.summary.pendingAlerts", { count: followUp.pendingAlerts })
              : t("athleteFile.summary.noPendingAlerts")}
          </li>
        </ul>
      </section>
    </div>
  )
}

function ReviewsTab({ weeklyReviews, expandedReviewId, onToggle, t }) {
  if (!weeklyReviews.length) {
    return <p className="empty-state">{t("psychologist.noWeeklyEor")}</p>
  }

  return (
    <ul className="athlete-file-reviews">
      {weeklyReviews.map((checkIn) => (
        <li key={checkIn.id} className="athlete-file-reviews__item">
          <button
            type="button"
            className="athlete-file-reviews__toggle"
            onClick={() => onToggle(checkIn.id)}
          >
            <span>{checkIn.check_in_date}</span>
            <span>{expandedReviewId === checkIn.id ? "−" : "+"}</span>
          </button>
          {expandedReviewId === checkIn.id && (
            <div className="athlete-file-reviews__detail">
              <WeeklyEorPanel checkIn={checkIn} t={t} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function ChartsTab({ insight, insightLoading, insightSource, weeklyTrend, t }) {
  return (
    <>
      <div className="insight-card-wrap">
        <InsightCard
          title={t("insights.athleteTitle")}
          insight={insight}
          loading={insightLoading}
          source={insightSource}
        />
      </div>
      <WeeklyEorChart
        weeklyTrend={weeklyTrend}
        variant="psychologist"
        title={t("chart.eorAthleteTitle")}
        subtitle={t("chart.eorAthleteSubtitle")}
      />
    </>
  )
}

function AppointmentsTab({ appointments, loading, onUpdateStatus, t }) {
  const [schedulingId, setSchedulingId] = useState(null)
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_at: "",
    duration_minutes: 30,
    psychologist_reply: "",
  })

  const openSchedule = (item) => {
    setSchedulingId(item.id)
    setScheduleForm({
      scheduled_at: item.scheduled_at
        ? new Date(item.scheduled_at).toISOString().slice(0, 16)
        : "",
      duration_minutes: item.duration_minutes || 30,
      psychologist_reply: item.psychologist_reply || "",
    })
  }

  const confirmSchedule = async (event) => {
    event.preventDefault()
    if (!scheduleForm.scheduled_at) return
    await onUpdateStatus(schedulingId, "scheduled", {
      scheduled_at: new Date(scheduleForm.scheduled_at).toISOString(),
      duration_minutes: Number(scheduleForm.duration_minutes) || 30,
      psychologist_reply: scheduleForm.psychologist_reply.trim(),
    })
    setSchedulingId(null)
  }

  if (loading) return <p className="empty-state">{t("athleteFile.loading")}</p>
  if (!appointments.length) return <p className="empty-state">{t("athleteFile.noAppointments")}</p>

  return (
    <ul className="athlete-file-timeline">
      {appointments.map((item) => (
        <li key={item.id} className="athlete-file-timeline__item">
          <header>
            <time>{new Date(item.created_at).toLocaleString()}</time>
            <Badge variant={appointmentVariant(item.status)}>{t(`athleteFile.appointmentStatus.${item.status}`)}</Badge>
          </header>
          <p>{item.message || t("psychologist.appointmentNoMessage")}</p>
          {item.scheduled_at && (
            <p>
              <em>{t("athleteFile.appointments.scheduledFor")}:</em>{" "}
              {new Date(item.scheduled_at).toLocaleString()} · {item.duration_minutes || 30} min
            </p>
          )}
          {item.psychologist_reply && (
            <p>
              <em>{t("athleteFile.appointments.reply")}:</em> {item.psychologist_reply}
            </p>
          )}

          {schedulingId === item.id ? (
            <form className="athlete-file-notes__form" onSubmit={confirmSchedule}>
              <label className="field">
                <span>{t("athleteFile.appointments.scheduleDate")}</span>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduled_at}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>{t("athleteFile.appointments.duration")}</span>
                <select
                  value={scheduleForm.duration_minutes}
                  onChange={(e) =>
                    setScheduleForm((p) => ({ ...p, duration_minutes: Number(e.target.value) }))
                  }
                >
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </label>
              <label className="field">
                <span>{t("athleteFile.appointments.reply")}</span>
                <textarea
                  rows={2}
                  value={scheduleForm.psychologist_reply}
                  onChange={(e) =>
                    setScheduleForm((p) => ({ ...p, psychologist_reply: e.target.value }))
                  }
                  placeholder={t("athleteFile.appointments.replyPlaceholder")}
                />
              </label>
              <div className="athlete-file-notes__actions">
                <Button type="submit">{t("athleteFile.appointments.confirmSchedule")}</Button>
                <Button type="button" variant="ghost" onClick={() => setSchedulingId(null)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <>
              {item.status === "pending" && (
                <div className="athlete-file-timeline__actions">
                  <Button variant="ghost" onClick={() => openSchedule(item)}>
                    {t("athleteFile.appointments.schedule")}
                  </Button>
                  <Button variant="ghost" onClick={() => onUpdateStatus(item.id, "completed")}>
                    {t("athleteFile.markCompleted")}
                  </Button>
                  <Button variant="ghost" className="btn--danger-text" onClick={() => onUpdateStatus(item.id, "cancelled")}>
                    {t("athleteFile.markCancelled")}
                  </Button>
                </div>
              )}
              {item.status === "scheduled" && (
                <div className="athlete-file-timeline__actions">
                  <Button variant="ghost" onClick={() => openSchedule(item)}>
                    {t("athleteFile.appointments.reschedule")}
                  </Button>
                  <Button variant="ghost" onClick={() => onUpdateStatus(item.id, "completed")}>
                    {t("athleteFile.markCompleted")}
                  </Button>
                </div>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

function AlertsTab({ alerts, loading, onUpdate, t, lang }) {
  const [filter, setFilter] = useState("all")
  const [actionAlertId, setActionAlertId] = useState(null)
  const [actionTaken, setActionTaken] = useState("")
  const [professionalNote, setProfessionalNote] = useState("")
  const [actionStatus, setActionStatus] = useState("monitoring")

  const filtered = useMemo(() => {
    const rows = [...(alerts || [])].sort((a, b) => {
      const da = new Date(a.createdAt || a.updatedAt || 0).getTime()
      const db = new Date(b.createdAt || b.updatedAt || 0).getTime()
      return db - da
    })
    if (filter === "all") return rows
    if (filter === "active") return rows.filter((a) => a.status === "active")
    return rows.filter((a) => a.status === filter)
  }, [alerts, filter])

  if (loading) return <p className="empty-state">{t("athleteFile.loading")}</p>

  return (
    <div className="athlete-file-alert-history">
      <div
        className="athlete-file-alert-filters"
        role="group"
        aria-label={t("athleteFile.history.filtersLabel")}
      >
        {ALERT_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            className={
              filter === key
                ? "athlete-file-alert-filters__btn active"
                : "athlete-file-alert-filters__btn"
            }
            onClick={() => setFilter(key)}
          >
            {t(`athleteFile.history.filter.${key}`)}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <p className="empty-state">{t("athleteFile.history.empty")}</p>
      ) : (
        <ul className="athlete-file-timeline athlete-file-timeline--alerts">
          {filtered.map((alert) => {
            const canAct = alert.status === "active" || alert.status === "monitoring"
            const reviewedAt = alert.reviewedAt || alert.resolvedAt || alert.dismissedAt
            return (
              <li
                key={alert.dbId || `${alert.alertType}-${alert.createdAt}`}
                className="athlete-file-timeline__item"
              >
                <header>
                  <Badge
                    variant={
                      alert.severity === "high"
                        ? "high"
                        : alert.severity === "medium"
                          ? "medium"
                          : "low"
                    }
                  >
                    {t(`athleteFile.alertStatus.${alert.status}`)}
                  </Badge>
                  <time>
                    {alert.createdAt
                      ? new Date(alert.createdAt).toLocaleDateString(
                          lang === "ca" ? "ca-ES" : "es-ES"
                        )
                      : "—"}
                  </time>
                </header>
                <dl className="athlete-file-alert-detail">
                  <div>
                    <dt>{t("athleteFile.history.reason")}</dt>
                    <dd>
                      {t(`psychologist.alert.${alert.alertType}`, {
                        value: alert.value,
                        days: alert.days,
                        baseline: alert.baseline,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("athleteFile.history.criterion")}</dt>
                    <dd>{formatAlertCriterion(alert, t)}</dd>
                  </div>
                  {reviewedAt && (
                    <div>
                      <dt>{t("athleteFile.history.reviewedAt")}</dt>
                      <dd>
                        {new Date(reviewedAt).toLocaleDateString(
                          lang === "ca" ? "ca-ES" : "es-ES"
                        )}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>{t("athleteFile.history.actionTaken")}</dt>
                    <dd>{alert.actionTaken || t("athleteFile.history.noAction")}</dd>
                  </div>
                  {alert.professionalNote && (
                    <div>
                      <dt>{t("athleteFile.history.professionalNote")}</dt>
                      <dd>{alert.professionalNote}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t("athleteFile.history.reviewedBy")}</dt>
                    <dd>
                      {alert.reviewedBy ? t("athleteFile.history.reviewedByPsych") : "—"}
                    </dd>
                  </div>
                </dl>

                {canAct && alert.dbId && (
                  <div className="athlete-file-timeline__actions">
                    <Button
                      variant="ghost"
                      onClick={() => onUpdate(alert.dbId, { status: "reviewed" })}
                    >
                      {t("athleteFile.banner.markReviewed")}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setActionAlertId(alert.dbId)
                        setActionTaken(alert.actionTaken || "")
                        setProfessionalNote(alert.professionalNote || "")
                        setActionStatus("monitoring")
                      }}
                    >
                      {t("athleteFile.banner.addAction")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="btn--danger-text"
                      onClick={() => onUpdate(alert.dbId, { status: "dismissed" })}
                    >
                      {t("athleteFile.banner.dismiss")}
                    </Button>
                  </div>
                )}

                {actionAlertId === alert.dbId && (
                  <form
                    className="athlete-file-alert-action-form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      onUpdate(alert.dbId, {
                        status: actionStatus,
                        actionTaken: actionTaken.trim(),
                        professionalNote: professionalNote.trim(),
                      })
                      setActionAlertId(null)
                    }}
                  >
                    <label>
                      <span>{t("athleteFile.history.actionTaken")}</span>
                      <input
                        value={actionTaken}
                        onChange={(e) => setActionTaken(e.target.value)}
                        placeholder={t("athleteFile.history.actionPlaceholder")}
                        required
                      />
                    </label>
                    <label>
                      <span>{t("athleteFile.history.professionalNote")}</span>
                      <textarea
                        value={professionalNote}
                        onChange={(e) => setProfessionalNote(e.target.value)}
                        placeholder={t("athleteFile.history.notePlaceholder")}
                        rows={3}
                      />
                    </label>
                    <label>
                      <span>{t("athleteFile.history.newStatus")}</span>
                      <select
                        value={actionStatus}
                        onChange={(e) => setActionStatus(e.target.value)}
                      >
                        <option value="monitoring">
                          {t("athleteFile.alertStatus.monitoring")}
                        </option>
                        <option value="resolved">{t("athleteFile.alertStatus.resolved")}</option>
                        <option value="reviewed">{t("athleteFile.alertStatus.reviewed")}</option>
                      </select>
                    </label>
                    <div className="athlete-file-alert-action-form__actions">
                      <Button type="submit">{t("athleteFile.history.saveAction")}</Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setActionAlertId(null)}
                      >
                        {t("athleteFile.cancel")}
                      </Button>
                    </div>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function appointmentVariant(status) {
  if (status === "pending") return "medium"
  if (status === "scheduled") return "low"
  if (status === "completed") return "default"
  return "high"
}
