import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import {
  getInviteFromUrl,
  savePendingInvite,
  validateCoachInvite,
  clearPendingInvite,
} from "../lib/invites"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import { Button } from "../components/ui/Button"

export function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState("login")
  const [error, setError] = useState("")
  const [coachInviteValid, setCoachInviteValid] = useState(false)
  const [inviteToken, setInviteToken] = useState(null)
  const [checkingInvite, setCheckingInvite] = useState(true)

  useEffect(() => {
    const token = getInviteFromUrl()
    if (!token) {
      setCheckingInvite(false)
      return
    }

    validateCoachInvite(token).then((valid) => {
      setCoachInviteValid(valid)
      setInviteToken(valid ? token : null)
      if (valid) {
        savePendingInvite(token)
        setMode("signup")
      }
      setCheckingInvite(false)
    })
  }, [])

  const login = async (e) => {
    e.preventDefault()
    setError("")
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
  }

  const signUp = async (e) => {
    e.preventDefault()
    setError("")

    const isCoachSignup = coachInviteValid && inviteToken
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
      setError(err.message)
      return
    }

    const finishCoachRegistration = async (userId) => {
      if (!isCoachSignup) return

      await supabase.from("profiles").upsert({
        id: userId,
        name: displayName,
        role: "coach",
        approved: false,
      })

      await supabase.rpc("consume_coach_invite", { invite_token: inviteToken })
      clearPendingInvite()
    }

    if (data.session && data.user) {
      if (isCoachSignup) {
        await finishCoachRegistration(data.user.id)
      } else {
        const { error: profileError } = await supabase.from("profiles").insert([
          { id: data.user.id, name: displayName, role: "athlete", approved: true },
        ])
        if (profileError) setError(profileError.message)
      }
      return
    }

    if (data.user && !data.session) {
      if (isCoachSignup) savePendingInvite(inviteToken)
      setError(t("login.confirmEmail"))
      setMode("login")
    }
  }

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

        <form className="auth-form" onSubmit={mode === "login" ? login : signUp}>
          <h2>
            {mode === "login"
              ? t("login.welcome")
              : coachInviteValid
                ? t("login.registerCoach")
                : t("login.register")}
          </h2>
          <p className="auth-form__hint">
            {mode === "login"
              ? t("login.hintLogin")
              : coachInviteValid
                ? t("login.hintRegisterCoach")
                : t("login.hintRegister")}
          </p>

          {checkingInvite && <p className="auth-form__hint">{t("login.checkingInvite")}</p>}

          {mode === "signup" && coachInviteValid && (
            <p className="invite-banner">{t("login.inviteValid")}</p>
          )}

          {mode === "signup" && !coachInviteValid && !checkingInvite && (
            <p className="auth-form__hint role-hint">{t("login.athleteOnly")}</p>
          )}

          <input
            type="email"
            placeholder={t("login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t("login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p className="form-error">{error}</p>}

          <Button type="submit" disabled={checkingInvite}>
            {mode === "login"
              ? t("login.signIn")
              : coachInviteValid
                ? t("login.createCoachAccount")
                : t("login.createAccount")}
          </Button>

          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login")
              setError("")
            }}
          >
            {mode === "login" ? t("login.toggleSignup") : t("login.toggleLogin")}
          </button>
        </form>
      </div>
    </div>
  )
}
