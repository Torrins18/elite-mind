import { useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { notifyCoachRegistration } from "../lib/coachNotifications"
import {
  getPendingCoachInvite,
  clearPendingCoachInvite,
  validateCoachInvite,
} from "../lib/invites"
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
  const pendingInvite = useMemo(() => getPendingCoachInvite(), [])
  const coachBlocked = role === "coach" && !pendingInvite

  const save = async (event) => {
    event.preventDefault()
    setError("")
    setSaving(true)

    const displayName =
      session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User"
    const isCoach = role === "coach"

    if (isCoach) {
      const valid = pendingInvite ? await validateCoachInvite(pendingInvite) : false
      if (!valid) {
        setSaving(false)
        setError(t("login.coachInviteRequired"))
        return
      }
    }

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

    if (profileError) {
      setSaving(false)
      setError(profileError.message)
      return
    }

    if (isCoach) {
      if (pendingInvite) {
        const { error: inviteError } = await supabase.rpc("consume_coach_invite", {
          invite_token: pendingInvite,
        })
        if (inviteError) {
          setSaving(false)
          setError(inviteError.message)
          return
        }
        clearPendingCoachInvite()
      }

      await notifyCoachRegistration({
        coachEmail: session.user.email,
        coachName: displayName,
        coachId: session.user.id,
      })
    }

    setSaving(false)
    onComplete?.()
  }

  return (
    <Card title={t("login.roleTitle")} subtitle={t("login.hintChooseRole")}>
      <form className="onboarding-form" onSubmit={save}>
        <RolePicker value={role} onChange={setRole} showCoachHint={role === "coach"} />
        {coachBlocked && <p className="form-error">{t("login.coachInviteRequired")}</p>}
        {error && <p className="form-error">{error}</p>}
        <Button type="submit" disabled={saving || coachBlocked}>
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
