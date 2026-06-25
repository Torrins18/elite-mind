import { useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { todayISO } from "../lib/dates"
import { hasWeeklyReflection, isWeeklyReflectionDue } from "../lib/checkInSchedule"
import { WEEKLY_EOR_DEFAULTS, buildWeeklyEorPayload } from "../lib/weeklyEor"
import { WeeklyEorForm } from "./WeeklyEorForm"
import { Button } from "./ui/Button"
import { Card } from "./ui/Card"
import { SliderField } from "./ui/SliderField"

const DAILY_DEFAULT = {
  mood: 7,
  stress: 4,
  sleep_quality: 7,
  energy: 7,
  focus: 7,
  personal_notes: "",
}

export function CheckInForm({
  athleteId,
  existing,
  checkIns = [],
  mode = "both",
  onSaved,
  onCancel,
  hideDailySection = false,
}) {
  const { t } = useTranslation()
  const today = todayISO()
  const [form, setForm] = useState(
    existing
      ? { ...DAILY_DEFAULT, ...WEEKLY_EOR_DEFAULTS, ...existing }
      : { ...DAILY_DEFAULT, ...WEEKLY_EOR_DEFAULTS }
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const resolvedMode = hideDailySection ? "weekly" : mode
  const showDaily = resolvedMode === "daily" || resolvedMode === "both"
  const showWeekly =
    resolvedMode === "weekly" ||
    (resolvedMode === "both" &&
      (isWeeklyReflectionDue(checkIns, today) || hasWeeklyReflection(existing)))

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const payload = {
      athlete_id: athleteId,
      check_in_date: today,
    }

    if (showDaily) {
      Object.assign(payload, {
        mood: form.mood,
        stress: form.stress,
        sleep_quality: form.sleep_quality,
        energy: form.energy,
        focus: form.focus ?? 7,
        personal_notes: null,
      })
    }

    if (showWeekly) {
      Object.assign(payload, buildWeeklyEorPayload(form))
    }

    // Weekly-only on a new day: do not send daily fields (they stay null until
    // "Estat d'avui" is completed). Requires check-ins-nullable-daily.sql on Supabase.

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

  const title =
    resolvedMode === "weekly"
      ? t("checkIn.titleWeeklyOnly")
      : resolvedMode === "daily"
        ? t("checkIn.titleDaily")
        : showWeekly
          ? t("checkIn.titleWeekly")
          : t("checkIn.titleDaily")

  const subtitle =
    resolvedMode === "weekly"
      ? t("checkIn.subtitleWeeklyOnly")
      : resolvedMode === "daily"
        ? t("checkIn.subtitleDailyShort")
        : showWeekly
          ? t("checkIn.subtitleWeekly")
          : t("checkIn.subtitleDailyShort")

  return (
    <Card title={title} subtitle={subtitle}>
      <form className="check-in-form" onSubmit={submit}>
        {showDaily && (
          <section className="check-in-block">
            <header className="check-in-block__header">
              <span className="check-in-block__badge">{t("checkIn.dailyBadge")}</span>
              <h3>{t("checkIn.dailyTitle")}</h3>
              <p>{t("checkIn.dailyIntroShort")}</p>
            </header>

            <SliderField
              label={t("checkIn.mood")}
              hint={t("checkIn.moodHint")}
              value={form.mood}
              onChange={(value) => update("mood", value)}
              lowLabel={t("checkIn.low")}
              highLabel={t("checkIn.high")}
            />
            <SliderField
              label={t("checkIn.stress")}
              hint={t("checkIn.stressHint")}
              value={form.stress}
              onChange={(value) => update("stress", value)}
              lowLabel={t("checkIn.calm")}
              highLabel={t("checkIn.overwhelmed")}
            />
            <SliderField
              label={t("checkIn.energy")}
              hint={t("checkIn.energyHint")}
              value={form.energy}
              onChange={(value) => update("energy", value)}
              lowLabel={t("checkIn.depleted")}
              highLabel={t("checkIn.peak")}
            />
            <SliderField
              label={t("checkIn.sleep")}
              hint={t("checkIn.sleepHint")}
              value={form.sleep_quality}
              onChange={(value) => update("sleep_quality", value)}
              lowLabel={t("checkIn.poor")}
              highLabel={t("checkIn.restorative")}
            />
          </section>
        )}

        {showWeekly && (
          <section className="weekly-eor-wrap">
            {resolvedMode !== "weekly" && (
              <header className="check-in-block__header weekly-eor-wrap__intro">
                <span className="check-in-block__badge check-in-block__badge--weekly">
                  {t("checkIn.weeklyBadge")}
                </span>
                <h3>{t("checkIn.weeklyTitle")}</h3>
                <p>{t("checkIn.weeklyIntro")}</p>
              </header>
            )}
            <WeeklyEorForm form={form} onChange={update} />
          </section>
        )}

        {resolvedMode === "daily" && !showWeekly && (
          <p className="check-in-weekly-next">{t("checkIn.weeklyNextHint")}</p>
        )}

        {message && <p className="form-message form-message--error">{message}</p>}

        <div className="check-in-form__actions">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
              {t("common.back")}
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            {saving
              ? t("checkIn.saving")
              : showWeekly && resolvedMode === "weekly"
                ? t("checkIn.submitWeeklyBtn")
                : t("checkIn.submitDailyBtn")}
          </Button>
        </div>
      </form>
    </Card>
  )
}
