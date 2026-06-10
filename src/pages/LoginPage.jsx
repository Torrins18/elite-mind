import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import {
  getInviteFromUrl,
  savePendingInvite,
  validateCoachInvite,
  clearPendingInvite,
} from "../lib/invites"
import { notifyCoachRegistration } from "../lib/coachNotifications"
import { mapAuthError } from "../lib/authErrors"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import { RolePicker } from "../components/RolePicker"
import { Button } from "../components/ui/Button"

export function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState("login")
  const [signupRole, setSignupRole] = useState("athlete")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [coachInviteValid, setCoachInviteValid] = useState(false)
  const [inviteToken, setInviteToken] = useState(null)
  const [checkingInvite, setCheckingInvite] = useState(() => Boolean(getInviteFromUrl()))

  useEffect(() => {
    const token = getInviteFromUrl()
    if (!token) return

    let cancelled = false

    validateCoachInvite(token)
      .then((valid) => {
        if (cancelled) return
        setCoachInviteValid(valid)
        setInviteToken(valid ? token : null)
        if (valid) {
          savePendingInvite(token)
          setSignupRole("coach")
          setMode("signup")
        } else {
          setMessage(t("login.inviteInvalid"))
        }
      })
      .catch(() => {
        if (!cancelled) setMessage(t("login.inviteInvalid"))
      })
      .finally(() => {
        if (!cancelled) setCheckingInvite(false)
      })

    return () => {
      cancelled = true
    }
  }, [t])

  const login = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(mapAuthError(err.message, t))
  }

  const signUp = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    const isCoachSignup =
      Boolean(coachInviteValid && inviteToken) || signupRole === "coach"
    const displayName = email.split("@")[0]
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
        clearPendingInvite()
      }
    }

    if (data.session && data.user) {
      if (isCoachSignup) {
        await finishCoachRegistration(data.user.id)
        await notifyPsychologist()
      } else {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            name: displayName,
            role,
            approved: role !== "coach",
          },
        ])
        if (profileError) setError(profileError.message)
      }
      return
    }

    if (data.user && !data.session) {
      await notifyPsychologist()
      if (coachInviteValid && inviteToken) savePendingInvite(inviteToken)
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

  return (
    <div className="auth-page">
      <div className="auth-lang">
        <LanguageSwitcher />
      </div>
      <div className="auth-panel">
        <div className="auth-panel__hero">
          <span className="auth-panel__badge">{t("login.badge")}</span>
          <h1>
            {t("login.heroTitle")}
            <br />
            {t("login.heroTitle2")}
          </h1>
          <p>{t("login.heroText")}</p>
        </div>

        <form
          className="auth-form"
          onSubmit={isForgotMode ? requestPasswordReset : mode === "login" ? login : signUp}
        >
          <h2>
            {isForgotMode
              ? t("passwordReset.title")
              : mode === "login"
                ? t("login.welcome")
                : coachInviteValid
                ? t("login.registerCoach")
                : signupRole === "coach"
                  ? t("login.registerCoach")
                  : t("login.register")}
          </h2>
          {!isSignupMode || coachInviteValid ? (
            <p className="auth-form__hint">
              {isForgotMode
                ? t("passwordReset.subtitle")
                : mode === "login"
                  ? t("login.hintLogin")
                  : t("login.hintRegisterCoach")}
            </p>
          ) : null}

          {checkingInvite && <p className="auth-form__hint">{t("login.checkingInvite")}</p>}

          {isSignupMode && coachInviteValid && (
            <p className="invite-banner">{t("login.inviteValid")}</p>
          )}

          {isSignupMode && !coachInviteValid && (
            <>
              <RolePicker value={signupRole} onChange={setSignupRole} />
              <p className="auth-form__hint auth-form__hint--role">
                {t("login.hintRegister")}
              </p>
            </>
          )}

          <input
            type="email"
            placeholder={t("login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!isForgotMode && (
            <input
              type="password"
              placeholder={t("login.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          )}

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-message">{message}</p>}

          <Button type="submit" disabled={checkingInvite}>
            {isForgotMode
              ? t("passwordReset.send")
              : mode === "login"
                ? t("login.signIn")
                : coachInviteValid || signupRole === "coach"
                  ? t("login.createCoachAccount")
                  : signupRole === "athlete"
                    ? t("login.createAthleteAccount")
                    : t("login.createAccount")}
          </Button>

          <div className="auth-links">
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setMode(isForgotMode || mode === "signup" ? "login" : "signup")
                setSignupRole("athlete")
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
                className="link-btn"
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
    </div>
  )
}
