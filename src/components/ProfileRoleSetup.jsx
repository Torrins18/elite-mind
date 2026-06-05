import { useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { notifyCoachRegistration } from "../lib/coachNotifications"
import { RolePicker } from "./RolePicker"
import { Button } from "./ui/Button"
import { Card } from "./ui/Card"

export function ProfileRoleSetup({ session, onComplete }) {
  const { t } = useTranslation()
  const [role, setRole] = useState(
    session.user.user_metadata?.role === "coach" ? "coach" : "athlete"
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const save = async (event) => {
    event.preventDefault()
    setError("")
    setSaving(true)

    const displayName =
      session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User"
    const isCoach = role === "coach"

    const { error: metaError } = await supabase.auth.updateUser({
      data: { role, name: displayName },
    })

    if (metaError) {
      setSaving(false)
      setError(metaError.message)
      return
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: session.user.id,
      name: displayName,
      role,
      approved: !isCoach,
    })

    setSaving(false)

    if (profileError) {
      setError(profileError.message)
      return
    }

    if (isCoach) {
      await notifyCoachRegistration({
        coachEmail: session.user.email,
        coachName: displayName,
        coachId: session.user.id,
      })
    }

    onComplete?.()
  }

  return (
    <Card title={t("login.roleTitle")} subtitle={t("login.hintRegister")}>
      <form className="onboarding-form" onSubmit={save}>
        <RolePicker value={role} onChange={setRole} />
        {error && <p className="form-error">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving
            ? t("onboarding.saving")
            : role === "coach"
              ? t("login.createCoachAccount")
              : t("login.createAccount")}
        </Button>
      </form>
    </Card>
  )
}
