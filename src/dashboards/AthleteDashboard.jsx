import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { CheckInForm } from "../components/CheckInForm"
import { WeeklyReflectionScreen } from "../components/WeeklyReflectionScreen"
import { AthletePsychologistContact } from "../components/AthletePsychologistContact"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { todayISO } from "../lib/dates"
import {
  getWeeklyCheckInForEdit,
  hasWeeklyReflectionThisWeek,
  isWeeklyReflectionDue,
} from "../lib/checkInSchedule"
import { shouldShowWeeklyReflection } from "../lib/weeklyReflectionRotation"

export function AthleteDashboard({ profile, teamName }) {
  const { t } = useTranslation()
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeForm, setActiveForm] = useState(null)
  const [weeklyStep, setWeeklyStep] = useState(null)
  const [helpIntent, setHelpIntent] = useState(null)
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
    }

    setLoading(false)
  }, [profile.id])

  useEffect(() => {
    load()
  }, [load])

  const weeklyDue = useMemo(
    () => isWeeklyReflectionDue(checkIns, today),
    [checkIns, today]
  )

  const weeklyDoneThisWeek = useMemo(
    () => hasWeeklyReflectionThisWeek(checkIns, today),
    [checkIns, today]
  )

  const weeklyCheckIn = useMemo(
    () => getWeeklyCheckInForEdit(checkIns, today),
    [checkIns, today]
  )

  const handleWeeklySaved = async () => {
    await load()
    setActiveForm(null)
    setWeeklyStep(null)
    setConfirmation(t("athlete.confirmWeekly"))
  }

  const openWeeklyReview = () => {
    if (weeklyDoneThisWeek) {
      setWeeklyStep("form")
    } else if (shouldShowWeeklyReflection(profile.id, today, false)) {
      setWeeklyStep("reflection")
    } else {
      setWeeklyStep("form")
    }
    setActiveForm("weekly")
  }

  const closeWeeklyReview = () => {
    setActiveForm(null)
    setWeeklyStep(null)
  }

  if (loading) return <LoadingSpinner label={t("athlete.loading")} />

  if (activeForm === "weekly" && weeklyStep === "reflection") {
    return (
      <WeeklyReflectionScreen
        athleteId={profile.id}
        onContinue={() => setWeeklyStep("form")}
      />
    )
  }

  if (activeForm === "weekly") {
    return (
      <div className="dashboard-grid dashboard-grid--athlete">
        <CheckInForm
          athleteId={profile.id}
          existing={weeklyCheckIn}
          onSaved={handleWeeklySaved}
          onCancel={closeWeeklyReview}
        />
      </div>
    )
  }

  if (activeForm === "help") {
    return (
      <div className="dashboard-grid dashboard-grid--athlete">
        <AthletePsychologistContact
          userId={profile.id}
          onClose={() => {
            setActiveForm(null)
            setHelpIntent(null)
          }}
          standalone
          defaultForm={helpIntent}
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
        <p className="athlete-home__tagline">{t("athlete.homeTagline")}</p>
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
            className={`athlete-home__action${weeklyDue && !weeklyDoneThisWeek ? " athlete-home__action--primary" : ""}`}
            onClick={openWeeklyReview}
          >
            <span className="athlete-home__action-label">{t("athlete.actionWeekly")}</span>
            <span className="athlete-home__action-hint">
              {weeklyDoneThisWeek
                ? t("athlete.actionWeeklyDone")
                : weeklyDue
                  ? t("athlete.actionWeeklyDue")
                  : t("athlete.actionWeeklyHint")}
            </span>
          </button>
        </div>
      </section>

      <section className="athlete-home__section athlete-home__section--help">
        <h2>{t("athlete.homeNeedHelp")}</h2>
        <div className="athlete-home__help-actions">
          <button
            type="button"
            className="athlete-home__help-btn"
            onClick={() => {
              setHelpIntent("appointment")
              setActiveForm("help")
            }}
          >
            {t("athlete.actionAppointment")}
          </button>
          <button
            type="button"
            className="athlete-home__help-btn athlete-home__help-btn--ghost"
            onClick={() => {
              setHelpIntent("message")
              setActiveForm("help")
            }}
          >
            {t("athlete.actionMessage")}
          </button>
        </div>
      </section>
    </div>
  )
}
