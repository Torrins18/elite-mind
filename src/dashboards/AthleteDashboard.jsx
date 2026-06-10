import { useCallback, useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { CheckInForm } from "../components/CheckInForm"
import { AthletePsychologistContact } from "../components/AthletePsychologistContact"
import { Card } from "../components/ui/Card"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { todayISO } from "../lib/dates"

export function AthleteDashboard({ profile, teamName }) {
  const { t } = useTranslation()
  const [checkIns, setCheckIns] = useState([])
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .eq("athlete_id", profile.id)
      .order("check_in_date", { ascending: false })
      .limit(14)

    if (!error && data) {
      setCheckIns(data)
      setTodayCheckIn(data.find((c) => c.check_in_date === todayISO()) || null)
    }

    setLoading(false)
  }, [profile.id])

  useEffect(() => {
    load()
  }, [load])

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
        <p className={`today-status ${todayCheckIn ? "today-status--done" : "today-status--pending"}`}>
          {todayCheckIn ? t("athlete.todayDone") : t("athlete.todayPending")}
        </p>
      </Card>

      <CheckInForm
        athleteId={profile.id}
        existing={todayCheckIn}
        checkIns={checkIns}
        onSaved={load}
      />

      <AthletePsychologistContact userId={profile.id} />
    </div>
  )
}
