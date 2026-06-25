import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { CheckInForm } from "../components/CheckInForm"
import { AthletePsychologistContact } from "../components/AthletePsychologistContact"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { todayISO } from "../lib/dates"
import {
  isDailyCheckInDone,
  isWeeklyReflectionDue,
  hasWeeklyReflectionThisWeek,
} from "../lib/checkInSchedule"

export function AthleteDashboard({ profile, teamName }) {
  const { t } = useTranslation()
  const [checkIns, setCheckIns] = useState([])
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeForm, setActiveForm] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

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
      setTodayCheckIn(data.find((c) => c.check_in_date === today) || null)
    }

    setLoading(false)
  }, [profile.id, today])

  useEffect(() => {
    load()
  }, [load])

  const dailyDoneToday = useMemo(
    () => isDailyCheckInDone(todayCheckIn),
    [todayCheckIn]
  )

  const weeklyDue = useMemo(
    () => isWeeklyReflectionDue(checkIns, today),
    [checkIns, today]
  )

  const weeklyDoneThisWeek = useMemo(
    () => hasWeeklyReflectionThisWeek(checkIns, today),
    [checkIns, today]
  )

  const handleSaved = async (kind) => {
    await load()
    setActiveForm(null)
    setConfirmation(
      kind === "weekly" ? t("athlete.confirmWeekly") : t("athlete.confirmDaily")
    )
  }

  if (loading) return <LoadingSpinner label={t("athlete.loading")} />

  if (activeForm === "daily" || activeForm === "weekly") {
    return (
      <div className="dashboard-grid dashboard-grid--athlete">
        <CheckInForm
          athleteId={profile.id}
          existing={todayCheckIn}
          checkIns={checkIns}
          mode={activeForm}
          onSaved={() => handleSaved(activeForm)}
          onCancel={() => setActiveForm(null)}
        />
      </div>
    )
  }

  if (activeForm === "help") {
    return (
      <div className="dashboard-grid dashboard-grid--athlete">
        <AthletePsychologistContact
          userId={profile.id}
          onClose={() => setActiveForm(null)}
          standalone
        />
      </div>
    )
  }

  const firstName = profile.name?.split(" ")[0] || profile.name

  return (
    <div className="dashboard-grid dashboard-grid--athlete athlete-home">
      <header className="athlete-home__hero">
        <h1>{t("athlete.homeGreeting", { name: firstName })}</h1>
        {teamName && <p className="athlete-home__team">{teamName}</p>}
      </header>

      {confirmation && (
        <div className="athlete-home__confirmation" role="status">
          <p>{confirmation}</p>
          <button type="button" onClick={() => setConfirmation(null)}>
            {t("common.close")}
          </button>
        </div>
      )}

      <section className="athlete-home__section">
        <h2>{t("athlete.homeAvailable")}</h2>
        <div className="athlete-home__actions">
          <button
            type="button"
            className={`athlete-home__action${!dailyDoneToday ? " athlete-home__action--primary" : ""}`}
            onClick={() => setActiveForm("daily")}
          >
            <span className="athlete-home__action-label">{t("athlete.actionDaily")}</span>
            <span className="athlete-home__action-hint">
              {dailyDoneToday ? t("athlete.actionDailyDone") : t("athlete.actionDailyHint")}
            </span>
          </button>

          {(weeklyDue || weeklyDoneThisWeek) && (
            <button
              type="button"
              className={`athlete-home__action${weeklyDue && !weeklyDoneThisWeek ? " athlete-home__action--weekly" : ""}`}
              onClick={() => setActiveForm("weekly")}
            >
              <span className="athlete-home__action-label">{t("athlete.actionWeekly")}</span>
              <span className="athlete-home__action-hint">
                {weeklyDoneThisWeek && !weeklyDue
                  ? t("athlete.actionWeeklyDone")
                  : t("athlete.actionWeeklyHint")}
              </span>
            </button>
          )}
        </div>
      </section>

      <section className="athlete-home__section athlete-home__section--help">
        <h2>{t("athlete.homeNeedHelp")}</h2>
        <div className="athlete-home__help-actions">
          <button
            type="button"
            className="athlete-home__help-btn"
            onClick={() => setActiveForm("help")}
          >
            {t("athlete.actionAppointment")}
          </button>
          <button
            type="button"
            className="athlete-home__help-btn athlete-home__help-btn--ghost"
            onClick={() => setActiveForm("help")}
          >
            {t("athlete.actionMessage")}
          </button>
        </div>
      </section>
    </div>
  )
}
