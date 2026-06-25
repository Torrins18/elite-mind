import { useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"

export function AthletePsychologistContact({ userId, onClose, standalone = false, defaultForm = null }) {
  const { t } = useTranslation()
  const [activeForm, setActiveForm] = useState(defaultForm)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState("")

  const reset = () => {
    setActiveForm(null)
    setMessage("")
    setFeedback("")
  }

  const submitAppointment = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFeedback("")

    const { error } = await supabase.from("appointment_requests").insert([
      {
        user_id: userId,
        message: message.trim() || null,
      },
    ])

    setSaving(false)

    if (error) {
      setFeedback(error.message)
      return
    }

    setFeedback(t("athleteContact.appointmentSent"))
    setMessage("")
    setActiveForm(null)
  }

  const submitMessage = async (e) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setSaving(true)
    setFeedback("")

    const { error } = await supabase.from("psychologist_messages").insert([
      {
        user_id: userId,
        message: trimmed,
      },
    ])

    setSaving(false)

    if (error) {
      setFeedback(error.message)
      return
    }

    setFeedback(t("athleteContact.messageSent"))
    setMessage("")
    setActiveForm(null)
  }

  const content = (
    <div className="athlete-contact">
      <div className="athlete-contact__actions">
        <Button
          variant={activeForm === "appointment" ? "primary" : "ghost"}
          onClick={() => {
            setActiveForm(activeForm === "appointment" ? null : "appointment")
            setMessage("")
            setFeedback("")
          }}
        >
          {t("athleteContact.requestAppointment")}
        </Button>
        <Button
          variant={activeForm === "message" ? "primary" : "ghost"}
          onClick={() => {
            setActiveForm(activeForm === "message" ? null : "message")
            setMessage("")
            setFeedback("")
          }}
        >
          {t("athleteContact.sendMessage")}
        </Button>
      </div>

      {activeForm === "appointment" && (
        <form className="athlete-contact__form" onSubmit={submitAppointment}>
          <p className="athlete-contact__hint">{t("athleteContact.appointmentHint")}</p>
          <label className="notes-field notes-field--optional">
            <span>{t("athleteContact.optionalNote")}</span>
            <textarea
              rows={3}
              placeholder={t("athleteContact.appointmentPlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <div className="athlete-contact__form-actions">
            <Button type="button" variant="ghost" onClick={reset}>
              {t("common.close")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("athleteContact.sending") : t("athleteContact.confirmAppointment")}
            </Button>
          </div>
        </form>
      )}

      {activeForm === "message" && (
        <form className="athlete-contact__form" onSubmit={submitMessage}>
          <p className="athlete-contact__hint">{t("athleteContact.messageHint")}</p>
          <label className="notes-field">
            <span>{t("athleteContact.messageLabel")}</span>
            <textarea
              rows={4}
              required
              placeholder={t("athleteContact.messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <div className="athlete-contact__form-actions">
            <Button type="button" variant="ghost" onClick={reset}>
              {t("common.close")}
            </Button>
            <Button type="submit" disabled={saving || !message.trim()}>
              {saving ? t("athleteContact.sending") : t("athleteContact.confirmMessage")}
            </Button>
          </div>
        </form>
      )}

      {feedback && <p className="form-message">{feedback}</p>}

      {standalone && onClose && (
        <div className="athlete-contact__form-actions" style={{ marginTop: 16 }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.back")}
          </Button>
        </div>
      )}
    </div>
  )

  if (standalone) {
    return (
      <Card title={t("athlete.homeNeedHelp")} subtitle={t("athleteContact.subtitle")}>
        {content}
      </Card>
    )
  }

  return (
    <Card title={t("athleteContact.title")} subtitle={t("athleteContact.subtitle")}>
      {content}
    </Card>
  )
}
