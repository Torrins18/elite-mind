import { useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { todayISO } from "../lib/dates"
import { Button } from "./ui/Button"
import { Card } from "./ui/Card"
import { SliderField } from "./ui/SliderField"

const DEFAULT = {
  mood: 7,
  stress: 4,
  sleep_quality: 7,
  energy: 7,
  focus: 7,
  personal_notes: "",
}

export function CheckInForm({ athleteId, existing, onSaved }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(existing ? { ...existing } : { ...DEFAULT })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const payload = {
      athlete_id: athleteId,
      check_in_date: todayISO(),
      mood: form.mood,
      stress: form.stress,
      sleep_quality: form.sleep_quality,
      energy: form.energy,
      focus: form.focus,
      personal_notes: form.personal_notes?.trim() || null,
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

    setMessage(existing ? t("checkIn.updated") : t("checkIn.saved"))
    onSaved?.()
  }

  return (
    <Card title={t("checkIn.title")} subtitle={t("checkIn.subtitle")}>
      <form className="check-in-form" onSubmit={submit}>
        <SliderField
          label={t("checkIn.mood")}
          value={form.mood}
          onChange={(v) => update("mood", v)}
          lowLabel={t("checkIn.low")}
          highLabel={t("checkIn.high")}
        />
        <SliderField
          label={t("checkIn.stress")}
          value={form.stress}
          onChange={(v) => update("stress", v)}
          lowLabel={t("checkIn.calm")}
          highLabel={t("checkIn.overwhelmed")}
        />
        <SliderField
          label={t("checkIn.sleep")}
          value={form.sleep_quality}
          onChange={(v) => update("sleep_quality", v)}
          lowLabel={t("checkIn.poor")}
          highLabel={t("checkIn.restorative")}
        />
        <SliderField
          label={t("checkIn.energy")}
          value={form.energy}
          onChange={(v) => update("energy", v)}
          lowLabel={t("checkIn.depleted")}
          highLabel={t("checkIn.peak")}
        />
        <SliderField
          label={t("checkIn.focus")}
          value={form.focus}
          onChange={(v) => update("focus", v)}
          lowLabel={t("checkIn.scattered")}
          highLabel={t("checkIn.lockedIn")}
        />

        <label className="notes-field">
          <span>{t("checkIn.notes")}</span>
          <textarea
            rows={4}
            placeholder={t("checkIn.notesPlaceholder")}
            value={form.personal_notes || ""}
            onChange={(e) => update("personal_notes", e.target.value)}
          />
        </label>

        {message && <p className="form-message">{message}</p>}

        <Button type="submit" disabled={saving}>
          {saving
            ? t("checkIn.saving")
            : existing
              ? t("checkIn.updateBtn")
              : t("checkIn.submitBtn")}
        </Button>
      </form>
    </Card>
  )
}
