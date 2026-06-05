import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { buildCheckInsExport, downloadCsv } from "../lib/export"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { CheckInChart } from "../components/CheckInChart"
import { InsightCard } from "../components/InsightCard"
import { averageMetrics, calculateRiskLevel, countByRisk } from "../lib/risk"
import { buildAthleteInsight, buildTeamInsight } from "../lib/insights"
import { PsychologistCoachAdmin } from "../components/PsychologistCoachAdmin"
import { consentStatus, isAdultInSpain } from "../lib/age"
import { CoachDashboard } from "./CoachDashboard"

export function PsychologistDashboard({ profile }) {
  const { t } = useTranslation()
  const [athletes, setAthletes] = useState([])
  const [teams, setTeams] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [assessments, setAssessments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [coachPreviewTeamId, setCoachPreviewTeamId] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const [{ data: roster, error: rosterError }, { data: teamList }, { data: ins }, assessmentRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("role", "athlete").order("name"),
        supabase.from("teams").select("id, name").order("name"),
        supabase
          .from("check_ins")
          .select("*")
          .order("check_in_date", { ascending: false })
          .limit(500),
        supabase.from("athlete_initial_assessments").select("*"),
      ])

    const initialAssessments = assessmentRes.error ? [] : assessmentRes.data || []

    if (rosterError) {
      console.error("Athletes load error:", rosterError.message)
    }

    setAthletes(roster || [])
    setTeams(teamList || [])
    setCheckIns(ins || [])
    setAssessments(initialAssessments || [])
    setSelectedId((prev) => {
      const list = roster || []
      if (prev && list.some((a) => a.id === prev)) return prev
      return list[0]?.id ?? null
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((tm) => [tm.id, tm.name])),
    [teams]
  )

  const filteredAthletes = useMemo(() => {
    if (!categoryFilter) return athletes
    return athletes.filter((a) => a.team_id === categoryFilter)
  }, [athletes, categoryFilter])

  const filteredCheckIns = useMemo(() => {
    const ids = new Set(filteredAthletes.map((a) => a.id))
    return checkIns.filter((c) => ids.has(c.athlete_id))
  }, [checkIns, filteredAthletes])

  const exportCsv = () => {
    const rows = buildCheckInsExport({
      checkIns: filteredCheckIns,
      athletes: filteredAthletes,
      teams,
      t,
    })
    const suffix = categoryFilter ? teamMap[categoryFilter] : "todos"
    downloadCsv(`elite-mind-checkins-${suffix}.csv`, rows)
  }

  const latestByAthlete = useMemo(
    () =>
      filteredAthletes.map((a) => {
        const latest = filteredCheckIns.find((c) => c.athlete_id === a.id)
        return { athlete: a, latest, risk: calculateRiskLevel(latest) }
      }),
    [filteredAthletes, filteredCheckIns]
  )

  const selected = useMemo(
    () => filteredAthletes.find((a) => a.id === selectedId) ?? null,
    [filteredAthletes, selectedId]
  )

  const athleteCheckIns = useMemo(
    () => filteredCheckIns.filter((c) => c.athlete_id === selectedId),
    [filteredCheckIns, selectedId]
  )

  const orgInsight = useMemo(
    () =>
      buildTeamInsight(
        { athletes: filteredAthletes, checkIns: filteredCheckIns, latestByAthlete },
        t
      ),
    [filteredAthletes, filteredCheckIns, latestByAthlete, t]
  )

  const athleteInsight = useMemo(() => {
    if (!selected) return null
    return buildAthleteInsight({ athlete: selected, checkIns: athleteCheckIns }, t)
  }, [selected, athleteCheckIns, t])

  if (loading) return <LoadingSpinner label={t("psychologist.loading")} />

  const selectedAssessment = assessments.find((item) => item.athlete_id === selectedId)

  const emotionalRisk = athleteCheckIns.filter(
    (c) => calculateRiskLevel(c) === "high" || (c.personal_notes && c.personal_notes.length > 20)
  )

  const orgAvg = averageMetrics(filteredCheckIns.slice(0, 80))
  const riskCounts = countByRisk(filteredCheckIns)
  const consentCounts = filteredAthletes.reduce(
    (acc, athlete) => {
      acc[consentStatus(athlete)] += 1
      return acc
    },
    { adult: 0, guardianSigned: 0, guardianPending: 0, missingBirthDate: 0 }
  )

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

      <PsychologistCoachAdmin
        psychologistId={profile.id}
        onPreviewCoachTeam={setCoachPreviewTeamId}
      />

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

      <Card title={t("psychologist.filterTitle")} subtitle={t("psychologist.filterSubtitle")}>
        <label className="team-selector__label">
          <span>{t("psychologist.filterLabel")}</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">{t("psychologist.filterAll")}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <Card>
        <InsightCard
          title={categoryFilter ? t("insights.orgTitle") : t("insights.teamTitle")}
          insight={orgInsight}
          footer={t("insights.footer")}
        />
      </Card>

      <div className="stats-row">
        <StatCard label={t("psychologist.athletesMonitored")} value={filteredAthletes.length} />
        <StatCard label={t("psychologist.orgAvgMood")} value={orgAvg.mood || "—"} />
        <StatCard
          label={t("psychologist.highEmotionalRisk")}
          value={riskCounts.high}
          accent="var(--danger)"
        />
        <StatCard
          label={t("psychologist.entriesWithNotes")}
          value={filteredCheckIns.filter((c) => c.personal_notes).length}
        />
        <StatCard
          label={t("psychologist.guardianConsents")}
          value={consentCounts.guardianSigned}
          hint={t("psychologist.pendingConsents", {
            count: consentCounts.guardianPending + consentCounts.missingBirthDate,
          })}
        />
      </div>

      <div className="psych-layout">
        <Card title={t("psychologist.allAthletes")} subtitle={t("psychologist.allAthletesSubtitle")}>
          {filteredAthletes.length === 0 ? (
            <p className="empty-state">{t("psychologist.noAthletesInCategory")}</p>
          ) : (
            <ul className="athlete-picker">
              {filteredAthletes.map((a) => {
                const latest = filteredCheckIns.find((c) => c.athlete_id === a.id)
                const risk = calculateRiskLevel(latest)
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={
                        selectedId === a.id ? "athlete-picker__btn active" : "athlete-picker__btn"
                      }
                      onClick={() => setSelectedId(a.id)}
                    >
                      <span>
                        {a.name}
                        {a.team_id && (
                          <small className="athlete-picker__cat"> · {teamMap[a.team_id]}</small>
                        )}
                        <small className="athlete-picker__cat">
                          {t(`consent.${consentStatus(a)}`)}
                        </small>
                      </span>
                      {latest && <Badge variant={risk}>{t(`risk.${risk}`)}</Badge>}
                      {!a.initial_assessment_completed_at && (
                        <Badge variant="default">{t("psychologist.assessmentMissing")}</Badge>
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
            <>
              <Card title={selected.name} subtitle={t("psychologist.historySubtitle")}>
                {selected.team_id && (
                  <p className="card__subtitle" style={{ marginBottom: 12 }}>
                    {teamMap[selected.team_id]}
                  </p>
                )}
                <div className="insight-card-wrap">
                  <InsightCard
                    title={t("insights.athleteTitle")}
                    insight={athleteInsight}
                    footer={t("insights.footer")}
                  />
                </div>
                <CheckInChart checkIns={athleteCheckIns.slice(0, 14)} />
              </Card>

              <Card
                title={t("psychologist.consentTitle")}
                subtitle={t("psychologist.consentSubtitle")}
              >
                <div className="consent-detail">
                  <p>
                    <strong>{t("psychologist.birthDate")}:</strong>{" "}
                    {selected.date_of_birth || t("risk.noData")}
                  </p>
                  <p>
                    <strong>{t("psychologist.consentStatus")}:</strong>{" "}
                    {t(`consent.${consentStatus(selected)}`)}
                  </p>
                  {selected.date_of_birth && !isAdultInSpain(selected.date_of_birth) && (
                    <>
                      <p>
                        <strong>{t("psychologist.guardianName")}:</strong>{" "}
                        {selected.guardian_full_name || t("risk.noData")}
                      </p>
                      <p>
                        <strong>{t("psychologist.guardianRelationship")}:</strong>{" "}
                        {selected.guardian_relationship || t("risk.noData")}
                      </p>
                      <p>
                        <strong>{t("psychologist.guardianContact")}:</strong>{" "}
                        {[selected.guardian_email, selected.guardian_phone]
                          .filter(Boolean)
                          .join(" · ") || t("risk.noData")}
                      </p>
                      <p>
                        <strong>{t("psychologist.guardianSignature")}:</strong>{" "}
                        {selected.guardian_signature || t("risk.noData")}
                      </p>
                      <p>
                        <strong>{t("psychologist.consentSignedAt")}:</strong>{" "}
                        {selected.guardian_consent_signed_at
                          ? new Date(selected.guardian_consent_signed_at).toLocaleString()
                          : t("risk.noData")}
                      </p>
                      <p>
                        <strong>{t("psychologist.consentVersion")}:</strong>{" "}
                        {selected.guardian_consent_text_version || t("risk.noData")}
                      </p>
                    </>
                  )}
                </div>
              </Card>

              <Card
                title={t("psychologist.initialAssessment")}
                subtitle={t("psychologist.initialAssessmentSubtitle")}
              >
                {selectedAssessment ? (
                  <div className="assessment-review">
                    <AssessmentSection
                      title={t("initialAssessment.personal")}
                      data={selectedAssessment.personal_info}
                      t={t}
                    />
                    <AssessmentSection
                      title={t("initialAssessment.sleep")}
                      data={selectedAssessment.sleep_habits}
                      t={t}
                    />
                    <AssessmentSection
                      title={t("initialAssessment.nutrition")}
                      data={selectedAssessment.nutrition_habits}
                      t={t}
                    />
                    <AssessmentSection
                      title={t("initialAssessment.sports")}
                      data={selectedAssessment.sports_background}
                      t={t}
                    />
                    <AssessmentSection
                      title={t("initialAssessment.support")}
                      data={selectedAssessment.family_social_support}
                      t={t}
                    />
                  </div>
                ) : (
                  <p className="empty-state">{t("psychologist.noInitialAssessment")}</p>
                )}
              </Card>

              {emotionalRisk.length > 0 && (
                <Card
                  title={t("psychologist.emotionalRisk")}
                  subtitle={t("psychologist.emotionalRiskSubtitle")}
                >
                  <ul className="notes-list">
                    {emotionalRisk.slice(0, 8).map((c) => {
                      const r = calculateRiskLevel(c)
                      return (
                        <li key={c.id}>
                          <div className="notes-list__meta">
                            <span>{c.check_in_date}</span>
                            <Badge variant={r}>{t(`risk.${r}`)}</Badge>
                          </div>
                          <p className="notes-list__metrics">
                            {t("psychologist.moodStress", {
                              mood: c.mood,
                              stress: c.stress,
                            })}{" "}
                            · {t("checkIn.metricSleep")} {c.sleep_quality} · {t("checkIn.metricEnergy")}{" "}
                            {c.energy}
                          </p>
                          {c.personal_notes && <blockquote>{c.personal_notes}</blockquote>}
                        </li>
                      )
                    })}
                  </ul>
                </Card>
              )}

              <Card
                title={t("psychologist.checkInLog")}
                subtitle={t("psychologist.checkInLogSubtitle")}
              >
                <ul className="notes-list">
                  {athleteCheckIns.length === 0 ? (
                    <p className="empty-state">{t("psychologist.noCheckIns")}</p>
                  ) : (
                    athleteCheckIns.map((c) => {
                      const r = calculateRiskLevel(c)
                      return (
                        <li key={c.id}>
                          <div className="notes-list__meta">
                            <span>{c.check_in_date}</span>
                            <Badge variant={r}>{t(`risk.${r}`)}</Badge>
                          </div>
                          <p className="notes-list__metrics">
                            {t("checkIn.metricMood")} {c.mood} · {t("checkIn.metricStress")}{" "}
                            {c.stress} · {t("checkIn.metricSleep")} {c.sleep_quality} ·{" "}
                            {t("checkIn.metricEnergy")} {c.energy} · {t("checkIn.metricFocus")}{" "}
                            {c.focus}
                          </p>
                          {c.personal_notes ? (
                            <blockquote>{c.personal_notes}</blockquote>
                          ) : (
                            <p className="notes-list__empty">{t("psychologist.noNotes")}</p>
                          )}
                          {hasExtendedCheckIn(c) && (
                            <div className="extended-review">
                              <p>
                                <strong>{t("checkIn.performanceRating")}:</strong>{" "}
                                {c.performance_rating ?? "—"}/10
                              </p>
                              <p>
                                <strong>{t("checkIn.involvementRating")}:</strong>{" "}
                                {c.involvement_rating ?? "—"}/10
                              </p>
                              {c.general_mood_words && (
                                <p>
                                  <strong>{t("checkIn.generalMoodWords")}:</strong>{" "}
                                  {c.general_mood_words}
                                </p>
                              )}
                              {c.mood_change_event && (
                                <p>
                                  <strong>{t("checkIn.moodChangeEvent")}:</strong>{" "}
                                  {c.mood_change_event}
                                </p>
                              )}
                              {c.next_goal && (
                                <p>
                                  <strong>{t("checkIn.nextGoal")}:</strong> {c.next_goal}
                                </p>
                              )}
                            </div>
                          )}
                        </li>
                      )
                    })
                  )}
                </ul>
              </Card>
            </>
          ) : (
            <Card title={t("psychologist.noAthletes")}>
              <p className="empty-state">{t("psychologist.noAthletesText")}</p>
            </Card>
          )}
        </div>
      </div>

      <Card title={t("psychologist.heatmap")} subtitle={t("psychologist.heatmapSubtitle")}>
        <ul className="roster-list">
          {latestByAthlete.map(({ athlete, latest, risk }) => (
            <li key={athlete.id}>
              <div>
                <strong>{athlete.name}</strong>
                <span>
                  {athlete.team_id ? teamMap[athlete.team_id] + " · " : ""}
                  {latest
                    ? t("psychologist.moodStress", {
                        mood: latest.mood,
                        stress: latest.stress,
                      })
                    : t("risk.noData")}
                  {latest?.personal_notes ? t("psychologist.hasNotes") : ""}
                </span>
              </div>
              <Badge variant={latest ? risk : "default"}>
                {latest ? t(`risk.${risk}`) : t("risk.noData")}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function hasExtendedCheckIn(checkIn) {
  return Boolean(
    checkIn.performance_rating !== null ||
      checkIn.involvement_rating !== null ||
      checkIn.general_mood_words ||
      checkIn.mood_change_event ||
      checkIn.next_goal
  )
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
