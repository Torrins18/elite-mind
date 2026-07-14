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
import { consentStatus, isAdultInSpain } from "../../lib/age"
import { dismissPsychologistAlert } from "../../lib/alertPersistence"
import {
  buildAthleteReportSections,
  downloadPrintReport,
} from "../../lib/pdfReports"

const TABS = [
  "profile",
  "onboarding",
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
  t,
}) {
  const [activeTab, setActiveTab] = useState("profile")
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
        .order("updated_at", { ascending: false }),
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
    setActiveTab("profile")
    setExpandedReviewId(null)
    loadRecord()
  }, [athlete?.id, loadRecord])

  const updateAppointmentStatus = async (id, status, extra = {}) => {
    const { error } = await supabase
      .from("appointment_requests")
      .update({ status, ...extra })
      .eq("id", id)
    if (!error) await loadRecord()
  }

  const dismissAlert = async (alertId) => {
    try {
      await dismissPsychologistAlert(supabase, alertId, psychologistId)
      await loadRecord()
      onAlertsChange?.()
    } catch (error) {
      console.error("Dismiss alert failed:", error.message)
    }
  }

  const visibleAlerts = athleteAlerts.length ? athleteAlerts : alertHistory.filter((a) => a.status !== "dismissed")

  const exportAthleteReport = () => {
    downloadPrintReport({
      title: `${athlete.name} — ${t("reports.athleteReport")}`,
      subtitle: t("reports.individualSubtitle"),
      rows: buildAthleteReportSections({
        athlete,
        teamName,
        risk,
        latestWeekly,
        t,
      }),
      filename: `esportista-${athlete.name}`,
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
            {tab === "alerts" && visibleAlerts.filter((a) => a.status === "active").length > 0 && (
              <span className="athlete-file-tabs__badge">
                {visibleAlerts.filter((a) => a.status === "active").length}
              </span>
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
            t={t}
            onExportReport={exportAthleteReport}
          />
        )}

        {activeTab === "onboarding" && (
          <OnboardingTab athlete={athlete} assessment={assessment} t={t} />
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
            alerts={alertHistory.length ? alertHistory : athleteAlerts}
            loading={recordLoading}
            onDismiss={dismissAlert}
            t={t}
          />
        )}
      </div>
    </Card>
  )
}

function ProfileTab({ athlete, teamName, risk, t, onExportReport }) {
  return (
    <>
      <div className="athlete-file-profile__actions">
        <Button variant="ghost" onClick={onExportReport}>
          {t("reports.exportPdf")}
        </Button>
      </div>
      <dl className="athlete-file-profile">
      <div>
        <dt>{t("athleteFile.profileTeam")}</dt>
        <dd>{teamName || t("risk.noData")}</dd>
      </div>
      <div>
        <dt>{t("psychologist.birthDate")}</dt>
        <dd>{athlete.date_of_birth || t("risk.noData")}</dd>
      </div>
      <div>
        <dt>{t("psychologist.consentStatus")}</dt>
        <dd>{t(`consent.${consentStatus(athlete)}`)}</dd>
      </div>
      <div>
        <dt>{t("athleteFile.profileRisk")}</dt>
        <dd>
          <Badge variant={risk === "noData" ? "default" : risk}>
            {t(`psychologist.riskBadge.${risk}`)}
          </Badge>
        </dd>
      </div>
      <div>
        <dt>{t("psychologist.initialAssessment")}</dt>
        <dd>
          {athlete.initial_assessment_completed_at
            ? new Date(athlete.initial_assessment_completed_at).toLocaleDateString()
            : t("psychologist.assessmentMissing")}
        </dd>
      </div>
      <div>
        <dt>{t("athleteFile.profileRegistered")}</dt>
        <dd>{new Date(athlete.created_at).toLocaleDateString()}</dd>
      </div>
      </dl>
    </>
  )
}

function OnboardingTab({ athlete, assessment, t }) {
  return (
    <>
      <section className="athlete-file-section">
        <h3>{t("psychologist.consentTitle")}</h3>
        <div className="consent-detail">
          <p>
            <strong>{t("psychologist.birthDate")}:</strong>{" "}
            {athlete.date_of_birth || t("risk.noData")}
          </p>
          <p>
            <strong>{t("psychologist.consentStatus")}:</strong>{" "}
            {t(`consent.${consentStatus(athlete)}`)}
          </p>
          {athlete.date_of_birth && !isAdultInSpain(athlete.date_of_birth) && (
            <>
              <p>
                <strong>{t("psychologist.guardianName")}:</strong>{" "}
                {athlete.guardian_full_name || t("risk.noData")}
              </p>
              <p>
                <strong>{t("psychologist.guardianRelationship")}:</strong>{" "}
                {athlete.guardian_relationship || t("risk.noData")}
              </p>
              <p>
                <strong>{t("psychologist.guardianContact")}:</strong>{" "}
                {[athlete.guardian_email, athlete.guardian_phone].filter(Boolean).join(" · ") ||
                  t("risk.noData")}
              </p>
              <p>
                <strong>{t("psychologist.consentSignedAt")}:</strong>{" "}
                {athlete.guardian_consent_signed_at
                  ? new Date(athlete.guardian_consent_signed_at).toLocaleString()
                  : t("risk.noData")}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="athlete-file-section">
        <h3>{t("psychologist.initialAssessment")}</h3>
        {assessment ? (
          <div className="assessment-review">
            <AssessmentSection
              title={t("initialAssessment.personal")}
              data={assessment.personal_info}
              t={t}
            />
            <AssessmentSection
              title={t("initialAssessment.sleep")}
              data={assessment.sleep_habits}
              t={t}
            />
            <AssessmentSection
              title={t("initialAssessment.nutrition")}
              data={assessment.nutrition_habits}
              t={t}
            />
            <AssessmentSection
              title={t("initialAssessment.sports")}
              data={assessment.sports_background}
              t={t}
            />
            <AssessmentSection
              title={t("initialAssessment.support")}
              data={assessment.family_social_support}
              t={t}
            />
          </div>
        ) : (
          <p className="empty-state">{t("psychologist.noInitialAssessment")}</p>
        )}
      </section>
    </>
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

function AlertsTab({ alerts, loading, onDismiss, t }) {
  if (loading) return <p className="empty-state">{t("athleteFile.loading")}</p>
  if (!alerts.length) return <p className="empty-state">{t("psychologist.noActiveAlerts")}</p>

  return (
    <ul className="athlete-file-timeline">
      {alerts.map((alert) => (
        <li key={alert.id || alert.dbId} className="athlete-file-timeline__item">
          <header>
            <Badge variant={alert.severity === "high" ? "high" : alert.severity === "medium" ? "medium" : "low"}>
              {t(`athleteFile.alertStatus.${alert.status}`)}
            </Badge>
            <time>
              {alert.updated_at || alert.dismissedAt || alert.reviewedAt
                ? new Date(alert.updated_at || alert.dismissedAt || alert.reviewedAt).toLocaleString()
                : "—"}
            </time>
          </header>
          <p>{t(`psychologist.alert.${alert.alert_type || alert.id}`, {
            value: alert.context?.value ?? alert.value,
            days: alert.context?.days ?? alert.days,
          })}</p>
          {alert.status === "active" && (alert.id || alert.dbId) && (
            <Button variant="ghost" className="btn--danger-text" onClick={() => onDismiss(alert.id || alert.dbId)}>
              {t("psychologist.dismissAlert")}
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}

function appointmentVariant(status) {
  if (status === "pending") return "medium"
  if (status === "scheduled") return "low"
  if (status === "completed") return "default"
  return "high"
}

function AssessmentSection({ title, data = {}, t }) {
  return (
    <section className="assessment-review__section">
      <h3>{title}</h3>
      <dl>
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <dt>{t(`initialAssessment.fields.${key}`)}</dt>
            <dd>{formatAssessmentValue(value, t)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function formatAssessmentValue(value, t) {
  if (!value) return "—"
  const translated = t(`initialAssessment.options.${value}`)
  return translated === `initialAssessment.options.${value}` ? value : translated
}
