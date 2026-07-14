import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import {
  getCoachInviteFromUrl,
  getAthleteJoinFromUrl,
  savePendingCoachInvite,
  savePendingAthleteJoin,
  validateCoachInvite,
  validateAthleteJoin,
  clearPendingCoachInvite,
  clearPendingAthleteJoin,
} from "../lib/invites"
import { notifyCoachRegistration } from "../lib/coachNotifications"
import { mapAuthError } from "../lib/authErrors"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import { RolePicker } from "../components/RolePicker"
import { Button } from "../components/ui/Button"
import { AuthHeroContent, AuthLandingSections, scrollToId } from "../components/auth/AuthLandingSections"
import { AuthHeroMedia } from "../components/auth/AuthHeroMedia"

export function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState("login")
  const [signupRole, setSignupRole] = useState("coach")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [coachInviteValid, setCoachInviteValid] = useState(false)
  const [athleteJoinValid, setAthleteJoinValid] = useState(false)
  const [athleteJoinInfo, setAthleteJoinInfo] = useState(null)
  const [inviteToken, setInviteToken] = useState(null)
  const [joinToken, setJoinToken] = useState(null)
  const [checkingInvite, setCheckingInvite] = useState(
    () => Boolean(getCoachInviteFromUrl() || getAthleteJoinFromUrl())
  )

  useEffect(() => {
    const coachToken = getCoachInviteFromUrl()
    const athleteToken = getAthleteJoinFromUrl()
    if (!coachToken && !athleteToken) return

    let cancelled = false

    const validate = async () => {
      if (athleteToken) {
        const info = await validateAthleteJoin(athleteToken)
        if (cancelled) return

        if (info) {
          setAthleteJoinValid(true)
          setAthleteJoinInfo(info)
          setJoinToken(athleteToken)
          savePendingAthleteJoin(athleteToken)
          setSignupRole("athlete")
          setMode("signup")
        } else {
          setMessage(t("login.athleteJoinInvalid"))
        }
        setCheckingInvite(false)
        return
      }

      const valid = await validateCoachInvite(coachToken)
      if (cancelled) return

      setCoachInviteValid(valid)
      setInviteToken(valid ? coachToken : null)
      if (valid) {
        savePendingCoachInvite(coachToken)
        setSignupRole("coach")
        setMode("signup")
      } else {
        setMessage(t("login.inviteInvalid"))
      }
      setCheckingInvite(false)
    }

    validate().catch(() => {
      if (!cancelled) setMessage(t("login.inviteInvalid"))
      if (!cancelled) setCheckingInvite(false)
    })

    return () => {
      cancelled = true
    }
  }, [t])

  useEffect(() => {
    if (mode === "signup" || checkingInvite) {
      scrollToId("auth-form")
    }
  }, [mode, checkingInvite])

  const login = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(mapAuthError(err.message, t))
  }

  const finishAthleteActivation = async () => {
    if (!athleteJoinValid || !joinToken) return

    const { error: inviteError } = await supabase.rpc("consume_athlete_invite", {
      invite_token: joinToken,
    })

    if (inviteError) {
      setError(inviteError.message)
      return false
    }

    clearPendingAthleteJoin()
    return true
  }

  const signUp = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    const isCoachSignup = Boolean(coachInviteValid && inviteToken) || signupRole === "coach"
    const isAthleteSignup = Boolean(athleteJoinValid && joinToken)

    if (!isCoachSignup && !isAthleteSignup) {
      setError(t("login.athleteInviteRequired"))
      return
    }

    const displayName =
      isAthleteSignup && athleteJoinInfo?.full_name
        ? athleteJoinInfo.full_name
        : email.split("@")[0]
    const role = isCoachSignup ? "coach" : "athlete"

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name: displayName,
        },
      },
    })

    if (err) {
      setError(mapAuthError(err.message, t))
      return
    }

    const notifyPsychologist = async () => {
      if (!isCoachSignup || !data.user) return

      const { error: notificationError } = await notifyCoachRegistration({
        coachEmail: email,
        coachName: displayName,
        coachId: data.user.id,
      })

      if (notificationError) {
        console.warn("Coach registration notification failed:", notificationError.message)
      }
    }

    const finishCoachRegistration = async (userId) => {
      if (!isCoachSignup) return

      await supabase.from("profiles").upsert({
        id: userId,
        name: displayName,
        role: "coach",
        approved: false,
      })

      if (inviteToken) {
        await supabase.rpc("consume_coach_invite", { invite_token: inviteToken })
        clearPendingCoachInvite()
      }
    }

    if (data.session && data.user) {
      if (isCoachSignup) {
        await finishCoachRegistration(data.user.id)
        await notifyPsychologist()
      } else if (isAthleteSignup) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            name: displayName,
            role: "athlete",
            approved: true,
          },
        ])
        if (profileError) {
          setError(profileError.message)
          return
        }
        const ok = await finishAthleteActivation()
        if (!ok) return
      }
      return
    }

    if (data.user && !data.session) {
      await notifyPsychologist()
      if (coachInviteValid && inviteToken) savePendingCoachInvite(inviteToken)
      if (athleteJoinValid && joinToken) savePendingAthleteJoin(joinToken)
      setMessage(t("login.confirmEmail"))
      setMode("login")
    }
  }

  const requestPasswordReset = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!email.trim()) {
      setError(t("passwordReset.missingEmail"))
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/`,
    })

    if (resetError) {
      setError(mapAuthError(resetError.message, t))
      return
    }

    setMessage(t("passwordReset.sent"))
    setMode("login")
  }

  const isForgotMode = mode === "forgot"
  const isSignupMode = mode === "signup"
  const hasValidInvite = coachInviteValid || athleteJoinValid
  const isMinimalLogin = mode === "login" && !checkingInvite

  const formTitle = isForgotMode
    ? t("passwordReset.title")
    : mode === "login"
      ? t("login.welcome")
      : athleteJoinValid
        ? t("login.activateAthlete")
        : coachInviteValid
          ? t("login.registerCoach")
          : signupRole === "coach"
            ? t("login.registerCoach")
            : t("login.register")

  return (
    <div className="auth-landing">
      <header className="auth-landing__topbar">
        <LanguageSwitcher />
      </header>

      <section className="auth-landing__intro" id="auth-top">
        <div className="auth-landing__visual">
          <AuthHeroMedia />
          <div className="auth-landing__overlay" aria-hidden />
          <AuthHeroContent />
        </div>

        <aside className="auth-landing__panel" id="auth-form">
          <div className="auth-landing__card">
            <form
              className={`auth-landing__form${isMinimalLogin ? " auth-landing__form--minimal" : ""}`}
              onSubmit={isForgotMode ? requestPasswordReset : mode === "login" ? login : signUp}
            >
              {!isMinimalLogin && <h2 className="auth-landing__form-title">{formTitle}</h2>}

              {!isMinimalLogin && (
                <p className="auth-landing__form-hint">
                  {isForgotMode
                    ? t("passwordReset.subtitle")
                    : mode === "login"
                      ? t("login.hintLogin")
                      : athleteJoinValid
                        ? t("login.hintActivateAthlete")
                        : t("login.hintRegisterCoach")}
                </p>
              )}

              {checkingInvite && <p className="auth-landing__form-hint">{t("login.checkingInvite")}</p>}

              {isSignupMode && athleteJoinValid && athleteJoinInfo && (
                <p className="auth-landing__notice">
                  {t("login.athleteJoinValid", { team: athleteJoinInfo.team_name })}
                </p>
              )}

              {isSignupMode && coachInviteValid && (
                <p className="auth-landing__notice">{t("login.inviteValid")}</p>
              )}

              {isSignupMode && !hasValidInvite && (
                <div className="auth-landing__signup-extra">
                  <RolePicker value={signupRole} onChange={setSignupRole} showCoachHint />
                  <p className="auth-landing__form-hint">
                    {signupRole === "coach"
                      ? t("login.hintRegisterCoachOpen")
                      : t("login.athleteInviteRequired")}
                  </p>
                </div>
              )}

              <label className="auth-landing__field">
                <span className="auth-landing__label">{t("login.email")}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>

              {!isForgotMode && (
                <label className="auth-landing__field">
                  <span className="auth-landing__label">{t("login.password")}</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </label>
              )}

              {error && <p className="auth-landing__error">{error}</p>}
              {message && <p className="auth-landing__message">{message}</p>}

              <Button
                type="submit"
                className="auth-landing__submit"
                disabled={checkingInvite || (isSignupMode && !hasValidInvite && signupRole === "athlete")}
              >
                {isForgotMode
                  ? t("passwordReset.send")
                  : mode === "login"
                    ? t("login.signIn")
                    : athleteJoinValid
                      ? t("login.activateAccount")
                      : coachInviteValid || signupRole === "coach"
                        ? t("login.createCoachAccount")
                        : t("login.createAccount")}
              </Button>

              <div className="auth-landing__links">
                <button
                  type="button"
                  className="auth-landing__link"
                  onClick={() => {
                    setMode(isForgotMode || mode === "signup" ? "login" : "signup")
                    setSignupRole("coach")
                    setError("")
                    setMessage("")
                  }}
                >
                  {isForgotMode
                    ? t("passwordReset.backToLogin")
                    : mode === "login"
                      ? t("login.toggleSignup")
                      : t("login.toggleLogin")}
                </button>
                {!isForgotMode && (
                  <button
                    type="button"
                    className="auth-landing__link"
                    onClick={() => {
                      setMode("forgot")
                      setError("")
                      setMessage("")
                    }}
                  >
                    {t("passwordReset.forgotLink")}
                  </button>
                )}
              </div>
            </form>
          </div>
        </aside>
      </section>

      <AuthLandingSections />
    </div>
  )
}
