import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import { useTranslation } from "./i18n/LanguageContext"
import { fetchOrCreateProfile } from "./lib/profile"
import { Layout } from "./components/Layout"
import { TeamSelector } from "./components/TeamSelector"
import { LoginPage } from "./pages/LoginPage"
import { PendingCoachPage } from "./pages/PendingCoachPage"
import { RejectedCoachPage } from "./pages/RejectedCoachPage"
import { LoadingSpinner } from "./components/ui/LoadingSpinner"
import { Button } from "./components/ui/Button"
import { AthleteDashboard } from "./dashboards/AthleteDashboard"
import { CoachDashboard } from "./dashboards/CoachDashboard"
import { PsychologistDashboard } from "./dashboards/PsychologistDashboard"

function App() {
  const { t } = useTranslation()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [teamName, setTeamName] = useState("")
  const [profileError, setProfileError] = useState("")
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        loadProfile(data.session)
      } else {
        setBooting(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        loadProfile(nextSession)
      } else {
        setProfile(null)
        setTeamName("")
        setProfileError("")
        setBooting(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadTeamName = async (teamId) => {
    if (!teamId) {
      setTeamName("")
      return
    }
    const { data } = await supabase.from("teams").select("name").eq("id", teamId).single()
    setTeamName(data?.name || "")
  }

  const loadProfile = async (activeSession) => {
    setBooting(true)
    setProfileError("")

    const { profile: loaded, error } = await fetchOrCreateProfile(activeSession)

    if (loaded) {
      setProfile(loaded)
      await loadTeamName(loaded.team_id)
    } else {
      setProfile(null)
      setTeamName("")
      setProfileError(error)
    }

    setBooting(false)
  }

  const refreshProfile = async () => {
    if (session) await loadProfile(session)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setTeamName("")
    setProfileError("")
  }

  if (booting) {
    return (
      <div className="auth-page">
        <LoadingSpinner label={t("loadingSession")} />
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  if (profile?.role === "coach" && profile.is_rejected) {
    return (
      <RejectedCoachPage profile={profile} session={session} onLogout={logout} />
    )
  }

  if (profile?.role === "coach" && profile.approved === false) {
    return (
      <PendingCoachPage
        profile={profile}
        session={session}
        onLogout={logout}
        onRefresh={refreshProfile}
      />
    )
  }

  const needsCategory =
    profile?.approved !== false &&
    profile &&
    (profile.role === "athlete" || profile.role === "coach")

  return (
    <Layout profile={profile} session={session} teamName={teamName} onLogout={logout}>
      {!profile && (
        <div className="empty-state setup-hint">
          <p>{t("noProfile")}</p>
          {profileError && (
            <p className="form-error">
              {t("errorLabel")}: {profileError}
            </p>
          )}
          <p>{t("noProfileHint")}</p>
          <Button variant="ghost" onClick={() => loadProfile(session)}>
            {t("retry")}
          </Button>
        </div>
      )}

      {needsCategory && <TeamSelector profile={profile} onUpdated={refreshProfile} />}

      {profile?.role === "athlete" && profile.team_id && (
        <AthleteDashboard profile={profile} teamName={teamName} />
      )}

      {profile?.role === "coach" && profile.approved && profile.team_id && (
        <CoachDashboard profile={profile} teamName={teamName} />
      )}

      {profile?.role === "psychologist" && (
        <PsychologistDashboard profile={profile} />
      )}
    </Layout>
  )
}

export default App
