import { useCallback, useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"

export function PsychologistCoachAdmin({ psychologistId }) {
  const { t } = useTranslation()
  const [pendingCoaches, setPendingCoaches] = useState([])
  const [invites, setInvites] = useState([])
  const [newLink, setNewLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)

    const { data: pending } = await supabase
      .from("profiles")
      .select("id, name, created_at")
      .eq("role", "coach")
      .eq("approved", false)
      .eq("is_rejected", false)
      .order("created_at", { ascending: false })

    const { data: inv } = await supabase
      .from("coach_invites")
      .select("id, token, used_at, expires_at, created_at")
      .eq("created_by", psychologistId)
      .order("created_at", { ascending: false })
      .limit(10)

    setPendingCoaches(pending || [])
    setInvites(inv || [])
    setLoading(false)
  }, [psychologistId])

  useEffect(() => {
    load()
  }, [load])

  const createInvite = async () => {
    setMessage("")

    const { data, error } = await supabase
      .from("coach_invites")
      .insert([{ created_by: psychologistId }])
      .select("token")
      .single()

    if (error) {
      setMessage(error.message)
      return
    }

    const link = `${window.location.origin}/?invite=${data.token}`
    setNewLink(link)
    await load()
  }

  const copyLink = async () => {
    if (!newLink) return
    await navigator.clipboard.writeText(newLink)
    setMessage(t("invites.copied"))
  }

  const approveCoach = async (coachId) => {
    const { error } = await supabase.rpc("approve_coach", { coach_profile_id: coachId })
    if (error) setMessage(error.message)
    else {
      setMessage(t("invites.approved"))
      await load()
    }
  }

  const rejectCoach = async (coachId) => {
    if (!confirm(t("invites.rejectConfirm"))) return

    const { error } = await supabase.rpc("reject_coach", { coach_profile_id: coachId })
    if (error) setMessage(error.message)
    else {
      setMessage(t("invites.rejected"))
      await load()
    }
  }

  if (loading) return null

  return (
    <div className="admin-grid">
      <Card title={t("invites.title")} subtitle={t("invites.subtitle")}>
        <div className="invite-actions">
          <Button onClick={createInvite}>{t("invites.generate")}</Button>
          {newLink && (
            <>
              <input className="invite-link" readOnly value={newLink} />
              <Button variant="ghost" onClick={copyLink}>
                {t("invites.copy")}
              </Button>
            </>
          )}
        </div>
        <p className="auth-form__hint">{t("invites.hint")}</p>

        {invites.length > 0 && (
          <ul className="invite-list">
            {invites.map((inv) => (
              <li key={inv.id}>
                <span>
                  {inv.used_at ? t("invites.used") : t("invites.active")} ·{" "}
                  {new Date(inv.expires_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={t("invites.pendingTitle")} subtitle={t("invites.pendingSubtitle")}>
        {pendingCoaches.length === 0 ? (
          <p className="empty-state">{t("invites.noPending")}</p>
        ) : (
          <ul className="roster-list">
            {pendingCoaches.map((coach) => (
              <li key={coach.id}>
                <div>
                  <strong>{coach.name}</strong>
                  <span>{new Date(coach.created_at).toLocaleDateString()}</span>
                </div>
                <div className="coach-actions">
                  <Button variant="ghost" onClick={() => approveCoach(coach.id)}>
                    {t("invites.approve")}
                  </Button>
                  <Button variant="ghost" className="btn--danger-text" onClick={() => rejectCoach(coach.id)}>
                    {t("invites.reject")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {message && <p className="form-message">{message}</p>}
    </div>
  )
}
