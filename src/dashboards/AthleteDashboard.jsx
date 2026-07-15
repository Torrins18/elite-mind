import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { CheckInForm } from "../components/CheckInForm"
import { WeeklyReflectionScreen } from "../components/WeeklyReflectionScreen"
import { AthletePsychologistContact } from "../components/AthletePsychologistContact"
import { EntrenamentMentalCard } from "../components/EntrenamentMentalCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { todayISO } from "../lib/dates"
import {
  getWeeklyCheckInForEdit,
  hasWeeklyReflectionThisWeek,
} from "../lib/checkInSchedule"
import { shouldShowWeeklyReflection } from "../lib/weeklyReflectionRotation"
import { getWeeklyMentalTraining } from "../lib/entrenamentMental"
import {
  abandonWeeklyReviewTracking,
  completeWeeklyReviewTracking,
  startWeeklyReviewTracking,
  trackFeatureUsed,
} from "../lib/productAnalytics"

function AthleteCompletionScreen({ mentalTraining, onAppointment, onMessage, onHome }) {
  const { t } = useTranslation()

  return (
    <div className="dashboard-grid dashboard-grid--athlete athlete-home athlete-home--completion">
      <div className="athlete-home__panel">
        <p className="athlete-home__completion-icon" aria-hidden="true">
          ✔
        </p>
        <h1>{t("athlete.completionTitle")}</h1>
        <p className="athlete-home__lead">{t("athlete.completionThanks")}</p>
        <p className="athlete-home__body">{t("athlete.completionBody")}</p>
        <p className="athlete-home__honesty">{t("athlete.completionHonesty")}</p>

        <EntrenamentMentalCard content={mentalTraining} />

        <div className="athlete-home__secondary">
          <button type="button" className="athlete-home__secondary-btn" onClick={onAppointment}>
            <span aria-hidden="true">📅</span> {t("athlete.actionAppointment")}
          </button>
          <button type="button" className="athlete-home__secondary-btn" onClick={onMessage}>
            <span aria-hidden="true">💬</span> {t("athlete.actionMessage")}
          </button>
        </div>

        <p className="athlete-home__confidentiality">{t("athlete.confidentiality")}</p>

        {onHome && (
          <button type="button" className="athlete-home__home-link" onClick={onHome}>
            {t("athlete.backHome")}
          </button>
        )}
      </div>
    </div>
  )
}

export function AthleteDashboard({ profile, team }) {
  const { t, lang } = useTranslation()
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState("home")
  const [helpIntent, setHelpIntent] = useState(null)

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

  const weeklyDoneThisWeek = useMemo(
    () => hasWeeklyReflectionThisWeek(checkIns, today),
    [checkIns, today]
  )

  const weeklyCheckIn = useMemo(
    () => getWeeklyCheckInForEdit(checkIns, today),
    [checkIns, today]
  )

  const mentalTraining = useMemo(() => {
    if (!weeklyDoneThisWeek && screen !== "completion") return null
    return getWeeklyMentalTraining(today, lang, t, team)
  }, [weeklyDoneThisWeek, screen, today, lang, t, team])

  const firstName = profile.name?.split(" ")[0] || profile.name

  const openWeeklyReview = () => {
    startWeeklyReviewTracking()
    if (shouldShowWeeklyReflection(profile.id, today, weeklyDoneThisWeek)) {
      setScreen("reflection")
    } else {
      setScreen("form")
    }
  }

  const handleWeeklySaved = async () => {
    await load()
    completeWeeklyReviewTracking()
    setScreen("completion")
  }

  const openHelp = (intent) => {
    trackFeatureUsed(intent === "appointment" ? "appointment_request" : "message_compose", {
      role: "athlete",
    })
    setHelpIntent(intent)
    setScreen("help")
  }

  const closeHelp = () => {
    setHelpIntent(null)
    setScreen(weeklyDoneThisWeek ? "completion" : "home")
  }

  if (loading) return <LoadingSpinner variant="athlete" />

  if (screen === "reflection") {
    return (
      <WeeklyReflectionScreen
        athleteId={profile.id}
        onContinue={() => setScreen("form")}
      />
    )
  }

  if (screen === "form") {
    return (
      <div className="dashboard-grid dashboard-grid--athlete">
        <CheckInForm
          athleteId={profile.id}
          existing={weeklyCheckIn}
          onSaved={handleWeeklySaved}
          onCancel={() => {
            abandonWeeklyReviewTracking("form")
            setScreen("home")
          }}
        />
      </div>
    )
  }

  if (screen === "help") {
    return (
      <div className="dashboard-grid dashboard-grid--athlete">
        <AthletePsychologistContact
          userId={profile.id}
          onClose={closeHelp}
          standalone
          defaultForm={helpIntent}
        />
      </div>
    )
  }

  if (screen === "completion") {
    return (
      <AthleteCompletionScreen
        mentalTraining={mentalTraining}
        onAppointment={() => openHelp("appointment")}
        onMessage={() => openHelp("message")}
        onHome={() => setScreen("home")}
      />
    )
  }

  if (weeklyDoneThisWeek) {
    return (
      <div className="dashboard-grid dashboard-grid--athlete athlete-home athlete-home--completed">
        <div className="athlete-home__panel">
          <h1>{t("athlete.weekCompletedTitle")}</h1>
          <p className="athlete-home__lead">{t("athlete.weekCompletedBody")}</p>
          <p className="athlete-home__body">{t("athlete.weekCompletedSupport")}</p>
          <EntrenamentMentalCard content={mentalTraining} />
          <p className="athlete-home__week-status">
            {t("athlete.weekStatusLabel")} · {t("athlete.weekStatusCompleted")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-grid dashboard-grid--athlete athlete-home athlete-home--pending">
      <div className="athlete-home__panel">
        <h1>{t("athlete.homeGreeting", { name: firstName })}</h1>
        <p className="athlete-home__lead">{t("athlete.homeWelcome")}</p>
        <p className="athlete-home__duration">{t("athlete.homeDuration")}</p>

        <button type="button" className="athlete-home__cta" onClick={openWeeklyReview}>
          {t("athlete.startReview")}
        </button>

        <p className="athlete-home__week-status">
          {t("athlete.weekStatusLabel")} · {t("athlete.weekStatusPending")}
        </p>
      </div>
    </div>
  )
}
