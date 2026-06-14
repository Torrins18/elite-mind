import { useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { BrandLogo } from "../components/BrandLogo"
import { LanguageSwitcher } from "../components/LanguageSwitcher"
import { Button } from "../components/ui/Button"

export function ResetPasswordPage({ onCompleted, onLogout }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [error, setError] = useState("")

  const updatePassword = async (event) => {
    event.preventDefault()
    setError("")

    if (password.length < 6) {
      setError(t("passwordReset.minLength"))
      return
    }

    if (password !== confirmPassword) {
      setError(t("passwordReset.mismatch"))
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setUpdated(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-lang">
        <LanguageSwitcher />
      </div>
      <div className="auth-panel auth-panel--single">
        <form className="auth-form" onSubmit={updatePassword}>
          <div className="auth-form__brand auth-form__brand--always">
            <BrandLogo variant="compact" />
          </div>
          <h2>{t("passwordReset.newTitle")}</h2>
          <p className="auth-form__hint">{t("passwordReset.newSubtitle")}</p>

          {updated ? (
            <>
              <p className="form-message">{t("passwordReset.updated")}</p>
              <Button type="button" onClick={onCompleted}>
                {t("passwordReset.continue")}
              </Button>
            </>
          ) : (
            <>
              <input
                type="password"
                placeholder={t("passwordReset.newPassword")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
              <input
                type="password"
                placeholder={t("passwordReset.confirmPassword")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
              />

              {error && <p className="form-error">{error}</p>}

              <Button type="submit" disabled={saving}>
                {saving ? t("passwordReset.updating") : t("passwordReset.update")}
              </Button>
            </>
          )}

          <button type="button" className="link-btn" onClick={onLogout}>
            {t("passwordReset.backToLogin")}
          </button>
        </form>
      </div>
    </div>
  )
}
