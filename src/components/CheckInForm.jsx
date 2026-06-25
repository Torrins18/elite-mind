import { useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { todayISO } from "../lib/dates"
import { buildWeeklyEorPayload, WEEKLY_EOR_DEFAULTS } from "../lib/weeklyEor"
import { WeeklyEorForm } from "./WeeklyEorForm"
import { Button } from "./ui/Button"
import { Card } from "./ui/Card"

export function CheckInForm({ athleteId, existing, onSaved, onCancel }) {
  const { t } = useTranslation()
  const today = todayISO()
  const [form, setForm] = useState(
    existing ? { ...WEEKLY_EOR_DEFAULTS, ...existing } : { ...WEEKLY_EOR_DEFAULTS }
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const payload = {
      athlete_id: athleteId,
      check_in_date: today,
      ...buildWeeklyEorPayload(form),
    }

    const query = existing
      ? supabase.from("check_ins").update(payload).eq("id", existing.id)
      : supabase.from("check_ins").insert([payload])

    const { error } = await query

    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    onSaved?.()
  }

  return (
    <Card title={t("checkIn.titleWeeklyOnly")} subtitle={t("checkIn.subtitleWeeklyOnly")}>
      <form className="check-in-form" onSubmit={submit}>
        <WeeklyEorForm form={form} onChange={update} />

        {message && <p className="form-message form-message--error">{message}</p>}

        <div className="check-in-form__actions">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
              {t("common.back")}
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? t("checkIn.saving") : t("checkIn.submitWeeklyBtn")}
          </Button>
        </div>
      </form>
    </Card>
  )
}
