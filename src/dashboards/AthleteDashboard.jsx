import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { CheckInForm } from "../components/CheckInForm"
import { AthletePsychologistContact } from "../components/AthletePsychologistContact"
import { WeeklyEorChart } from "../components/WeeklyEorTeamChart"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { todayISO } from "../lib/dates"
import {
  isTodayCheckInComplete,
  isWeeklyReflectionDue,
} from "../lib/checkInSchedule"
import { aggregateWeeklyEorTrend } from "../lib/coachTeamAnalytics"
import { computeWeeklyIndexes, getLatestWeeklyReflection } from "../lib/weeklyEor"
import { EorIndexSummary } from "../components/EorIndexSummary"

export function AthleteDashboard({ profile, teamName }) {
  const { t } = useTranslation()
  const [checkIns, setCheckIns] = useState([])
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const today = todayISO()

  const load = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .eq("athlete_id", profile.id)
      .order("check_in_date", { ascending: false })
      .limit(100)

    if (!error && data) {
      setCheckIns(data)
      const todayRow = data.find((c) => c.check_in_date === today) || null
      setTodayCheckIn(todayRow)

      if (todayRow && isTodayCheckInComplete(todayRow, data, today)) {
        setEditing(false)
      }
    }

    setLoading(false)
  }, [profile.id, today])

  useEffect(() => {
    load()
  }, [load])

  const todayComplete = useMemo(
    () => isTodayCheckInComplete(todayCheckIn, checkIns, today),
    [todayCheckIn, checkIns, today]
  )

  const weeklyPending = useMemo(
    () => Boolean(todayCheckIn) && isWeeklyReflectionDue(checkIns, today) && !todayComplete,
    [todayCheckIn, checkIns, today, todayComplete]
  )

  const weeklyTrend = useMemo(() => aggregateWeeklyEorTrend(checkIns), [checkIns])
  const latestWeekly = useMemo(() => getLatestWeeklyReflection(checkIns), [checkIns])
  const latestWeeklyIndexes = useMemo(
    () => computeWeeklyIndexes(latestWeekly),
    [latestWeekly]
  )

  const showForm = !todayComplete || editing

  const handleSaved = async () => {
    await load()
    setEditing(false)
  }

  if (loading) return <LoadingSpinner label={t("athlete.loading")} />

  return (
    <div className="dashboard-grid dashboard-grid--athlete">
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
      </section>

      <Card title={t("athlete.todayTitle")} subtitle={t("athlete.todaySubtitle")}>
        <p
          className={`today-status ${
            todayComplete ? "today-status--done" : "today-status--pending"
          }`}
        >
          {todayComplete
            ? t("athlete.todayDone")
            : weeklyPending
              ? t("athlete.weeklyPending")
              : t("athlete.todayPending")}
        </p>
        {todayComplete && !showForm && (
          <div className="today-status__actions">
            <Button variant="ghost" onClick={() => setEditing(true)}>
              {t("athlete.updateResponses")}
            </Button>
          </div>
        )}
      </Card>

      {showForm && (
        <CheckInForm
          athleteId={profile.id}
          existing={todayCheckIn}
          checkIns={checkIns}
          onSaved={handleSaved}
          onCancel={todayComplete ? () => setEditing(false) : undefined}
          hideDailySection={weeklyPending && !editing}
        />
      )}

      {latestWeeklyIndexes && (
        <Card title={t("athlete.weeklyEorTitle")} subtitle={t("athlete.weeklyEorSubtitle")}>
          <EorIndexSummary indexes={latestWeeklyIndexes} variant="psychologist" t={t} />
        </Card>
      )}

      <WeeklyEorChart
        weeklyTrend={weeklyTrend}
        variant="psychologist"
        title={t("chart.eorAthleteTitle")}
        subtitle={t("chart.eorAthleteSubtitle")}
      />

      <AthletePsychologistContact userId={profile.id} />
    </div>
  )
}
