import { useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { todayISO } from "../lib/dates"
import {
  hasWeeklyReflection,
  isWeeklyReflectionDue,
} from "../lib/checkInSchedule"
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
  performance_rating: 5,
  involvement_rating: 5,
  general_mood_words: "",
  mood_change_event: "",
  next_goal: "",
}

export function CheckInForm({
  athleteId,
  existing,
  checkIns = [],
  onSaved,
  onCancel,
  hideDailySection = false,
}) {
  const { t } = useTranslation()
  const today = todayISO()
  const [form, setForm] = useState(existing ? { ...DEFAULT, ...existing } : { ...DEFAULT })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const showWeekly = useMemo(
    () => isWeeklyReflectionDue(checkIns, today) || hasWeeklyReflection(existing),
    [checkIns, today, existing]
  )

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const payload = {
      athlete_id: athleteId,
      check_in_date: today,
      mood: form.mood,
      stress: form.stress,
      sleep_quality: form.sleep_quality,
      energy: form.energy,
      focus: form.focus,
      personal_notes: form.personal_notes?.trim() || null,
    }

    if (showWeekly) {
      payload.performance_rating = form.performance_rating
      payload.involvement_rating = form.involvement_rating
      payload.general_mood_words = form.general_mood_words?.trim() || null
      payload.mood_change_event = form.mood_change_event?.trim() || null
      payload.next_goal = form.next_goal?.trim() || null
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

  const title = hideDailySection
    ? t("checkIn.titleWeeklyOnly")
    : showWeekly
      ? t("checkIn.titleWeekly")
      : t("checkIn.titleDaily")
  const subtitle = hideDailySection
    ? t("checkIn.subtitleWeeklyOnly")
    : showWeekly
      ? t("checkIn.subtitleWeekly")
      : t("checkIn.subtitleDaily")

  return (
    <Card title={title} subtitle={subtitle}>
      <form className="check-in-form" onSubmit={submit}>
        {!hideDailySection && (
        <section className="check-in-block">
          <header className="check-in-block__header">
            <span className="check-in-block__badge">{t("checkIn.dailyBadge")}</span>
            <h3>{t("checkIn.dailyTitle")}</h3>
            <p>{t("checkIn.dailyIntro")}</p>
          </header>

          <SliderField
            label={t("checkIn.mood")}
            hint={t("checkIn.moodHint")}
            value={form.mood}
            onChange={(v) => update("mood", v)}
            lowLabel={t("checkIn.low")}
            highLabel={t("checkIn.high")}
          />
          <SliderField
            label={t("checkIn.stress")}
            hint={t("checkIn.stressHint")}
            value={form.stress}
            onChange={(v) => update("stress", v)}
            lowLabel={t("checkIn.calm")}
            highLabel={t("checkIn.overwhelmed")}
          />
          <SliderField
            label={t("checkIn.sleep")}
            hint={t("checkIn.sleepHint")}
            value={form.sleep_quality}
            onChange={(v) => update("sleep_quality", v)}
            lowLabel={t("checkIn.poor")}
            highLabel={t("checkIn.restorative")}
          />
          <SliderField
            label={t("checkIn.energy")}
            hint={t("checkIn.energyHint")}
            value={form.energy}
            onChange={(v) => update("energy", v)}
            lowLabel={t("checkIn.depleted")}
            highLabel={t("checkIn.peak")}
          />
          <SliderField
            label={t("checkIn.focus")}
            hint={t("checkIn.focusHint")}
            value={form.focus}
            onChange={(v) => update("focus", v)}
            lowLabel={t("checkIn.scattered")}
            highLabel={t("checkIn.lockedIn")}
          />

          <label className="notes-field notes-field--optional">
            <span>{t("checkIn.notes")}</span>
            <p className="notes-field__hint">{t("checkIn.notesHint")}</p>
            <textarea
              rows={3}
              placeholder={t("checkIn.notesPlaceholder")}
              value={form.personal_notes || ""}
              onChange={(e) => update("personal_notes", e.target.value)}
            />
          </label>
        </section>
        )}

        {showWeekly ? (
          <section className="check-in-block check-in-block--weekly">
            <header className="check-in-block__header">
              <span className="check-in-block__badge check-in-block__badge--weekly">
                {t("checkIn.weeklyBadge")}
              </span>
              <h3>{t("checkIn.weeklyTitle")}</h3>
              <p>{t("checkIn.weeklyIntro")}</p>
            </header>

            <SliderField
              label={t("checkIn.performanceRating")}
              hint={t("checkIn.performanceHint")}
              value={form.performance_rating ?? 5}
              onChange={(v) => update("performance_rating", v)}
              min={0}
              lowLabel={t("checkIn.ratingLow")}
              highLabel={t("checkIn.ratingHigh")}
            />
            <SliderField
              label={t("checkIn.involvementRating")}
              hint={t("checkIn.involvementHint")}
              value={form.involvement_rating ?? 5}
              onChange={(v) => update("involvement_rating", v)}
              min={0}
              lowLabel={t("checkIn.involvementLow")}
              highLabel={t("checkIn.involvementHigh")}
            />

            <label className="notes-field">
              <span>{t("checkIn.generalMoodWords")}</span>
              <p className="notes-field__hint">{t("checkIn.generalMoodWordsHint")}</p>
              <input
                placeholder={t("checkIn.generalMoodWordsPlaceholder")}
                value={form.general_mood_words || ""}
                onChange={(e) => update("general_mood_words", e.target.value)}
              />
            </label>
            <label className="notes-field">
              <span>{t("checkIn.moodChangeEvent")}</span>
              <p className="notes-field__hint">{t("checkIn.moodChangeEventHint")}</p>
              <textarea
                rows={3}
                placeholder={t("checkIn.moodChangeEventPlaceholder")}
                value={form.mood_change_event || ""}
                onChange={(e) => update("mood_change_event", e.target.value)}
              />
            </label>
            <label className="notes-field">
              <span>{t("checkIn.nextGoal")}</span>
              <p className="notes-field__hint">{t("checkIn.nextGoalHint")}</p>
              <textarea
                rows={3}
                placeholder={t("checkIn.nextGoalPlaceholder")}
                value={form.next_goal || ""}
                onChange={(e) => update("next_goal", e.target.value)}
              />
            </label>
          </section>
        ) : (
          <p className="check-in-weekly-next">{t("checkIn.weeklyNextHint")}</p>
        )}

        {message && <p className="form-message">{message}</p>}

        <div className="check-in-form__actions">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
              {t("common.close")}
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            {saving
              ? t("checkIn.saving")
              : existing
                ? t("checkIn.updateBtn")
                : showWeekly
                  ? t("checkIn.submitWeeklyBtn")
                  : t("checkIn.submitDailyBtn")}
          </Button>
        </div>
      </form>
    </Card>
  )
}
