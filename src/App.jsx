import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import AthleteOnboarding from "./AthleteOnboarding"
import { ProfileRoleSetup } from "./components/ProfileRoleSetup"
import { useTranslation } from "./i18n/LanguageContext"
import { fetchOrCreateProfile } from "./lib/profile"
import { Layout } from "./components/Layout"
import { TeamSelector } from "./components/TeamSelector"
import { LoginPage } from "./pages/LoginPage"
import { ResetPasswordPage } from "./pages/ResetPasswordPage"
import { PendingCoachPage } from "./pages/PendingCoachPage"
import { RejectedCoachPage } from "./pages/RejectedCoachPage"
import { LoadingSpinner } from "./components/ui/LoadingSpinner"
import { Button } from "./components/ui/Button"
import { Card } from "./components/ui/Card"
import { hasGuardianConsent, isAdultInSpain } from "./lib/age"
import { InitialAssessment } from "./components/InitialAssessment"
import { AthleteDashboard } from "./dashboards/AthleteDashboard"
import { CoachDashboard } from "./dashboards/CoachDashboard"
import { PsychologistDashboard } from "./dashboards/PsychologistDashboard"

function App() {
  const { t } = useTranslation()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [teamName, setTeamName] = useState("")
  const [profileError, setProfileError] = useState("")
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        if (isPasswordRecoveryUrl()) {
          setPasswordRecovery(true)
          setBooting(false)
        } else {
          loadProfile(data.session)
        }
      } else {
        setBooting(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true)
        setBooting(false)
        return
      }

      if (nextSession) {
        loadProfile(nextSession)
      } else {
        setProfile(null)
        setTeamName("")
        setProfileError("")
        setPasswordRecovery(false)
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
    setPasswordRecovery(false)
  }

  const finishPasswordRecovery = async () => {
    setPasswordRecovery(false)
    window.history.replaceState(null, "", window.location.pathname)
    if (session) await loadProfile(session)
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

  if (passwordRecovery) {
    return <ResetPasswordPage onCompleted={finishPasswordRecovery} onLogout={logout} />
  }

  if (profile?.role === "coach" && profile.is_rejected) {
    return (
      <RejectedCoachPage profile={profile} session={session} onLogout={logout} />
    )
  }

  if (profile?.role === "coach" && profile.approved !== true && !profile.is_rejected) {
    return (
      <PendingCoachPage
        profile={profile}
        session={session}
        onLogout={logout}
        onRefresh={refreshProfile}
      />
    )
  }

  return (
    <Layout profile={profile} session={session} teamName={teamName} onLogout={logout}>
      {!profile && !profileError && (
        <ProfileRoleSetup session={session} onComplete={refreshProfile} />
      )}

      {!profile && profileError && (
        <div className="empty-state setup-hint">
          <p>{t("noProfile")}</p>
          <p className="form-error">
            {t("errorLabel")}: {profileError}
          </p>
          <p>{t("noProfileHint")}</p>
          {profileError?.includes("column") && (
            <p className="form-error">
              Falta ejecutar SQL en Supabase: privacy-onboarding.sql e initial-assessment.sql
              (ver supabase/SETUP.md).
            </p>
          )}
          <Button variant="ghost" onClick={() => loadProfile(session)}>
            {t("retry")}
          </Button>
        </div>
      )}

      {profile?.role === "athlete" && !profile.date_of_birth && (
        <AthleteOnboarding profile={profile} session={session} onUpdated={refreshProfile} />
      )}

      {profile?.role === "athlete" &&
        profile.date_of_birth &&
        !isAdultInSpain(profile.date_of_birth) &&
        !hasGuardianConsent(profile) && (
          <AthleteOnboarding profile={profile} session={session} onUpdated={refreshProfile} />
        )}

      {profile?.role === "athlete" &&
        profile.date_of_birth &&
        (isAdultInSpain(profile.date_of_birth) || hasGuardianConsent(profile)) &&
        !profile.initial_assessment_completed_at && (
          <InitialAssessment profile={profile} onCompleted={refreshProfile} />
        )}

      {profile?.role === "athlete" &&
        profile.date_of_birth &&
        (isAdultInSpain(profile.date_of_birth) || hasGuardianConsent(profile)) &&
        profile.initial_assessment_completed_at &&
        !profile.team_id && (
          <TeamSelector profile={profile} onUpdated={refreshProfile} />
        )}

      {profile?.role === "athlete" &&
        profile.date_of_birth &&
        (isAdultInSpain(profile.date_of_birth) || hasGuardianConsent(profile)) &&
        profile.initial_assessment_completed_at &&
        profile.team_id && <AthleteDashboard profile={profile} teamName={teamName} />}

      {profile?.role === "coach" && profile.approved && profile.team_id && (
        <CoachDashboard profile={profile} teamName={teamName} />
      )}

      {profile?.role === "coach" && profile.approved && !profile.team_id && (
        <Card title={t("coach.noTeamTitle")} subtitle={t("coach.noTeamSubtitle")}>
          <p className="empty-state">{t("coach.noTeamText")}</p>
        </Card>
      )}

      {profile?.role === "psychologist" && (
        <PsychologistDashboard profile={profile} />
      )}
    </Layout>
  )
}

export default App

function isPasswordRecoveryUrl() {
  return (
    window.location.hash.includes("type=recovery") ||
    window.location.search.includes("type=recovery")
  )
}
