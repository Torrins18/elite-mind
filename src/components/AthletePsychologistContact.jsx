import { useCallback, useEffect, useState } from "react"
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
  const [thread, setThread] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loadingThread, setLoadingThread] = useState(false)

  const loadThread = useCallback(async () => {
    setLoadingThread(true)
    const [messagesRes, appointmentsRes] = await Promise.all([
      supabase
        .from("psychologist_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("appointment_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    const messages = messagesRes.error ? [] : messagesRes.data || []
    setThread(messages)
    setAppointments(appointmentsRes.error ? [] : appointmentsRes.data || [])

    const unreadFromPsych = messages.filter(
      (row) => row.sender_role === "psychologist" && row.status === "unread"
    )
    if (unreadFromPsych.length) {
      await Promise.all(
        unreadFromPsych.map((row) =>
          supabase.from("psychologist_messages").update({ status: "read" }).eq("id", row.id)
        )
      )
    }

    setLoadingThread(false)
  }, [userId])

  useEffect(() => {
    if (defaultForm) setActiveForm(defaultForm)
  }, [defaultForm])

  useEffect(() => {
    loadThread()
  }, [loadThread])

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
    loadThread()
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
        sender_role: "athlete",
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
    loadThread()
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

      {appointments.length > 0 && (
        <section className="athlete-contact__history">
          <h3>{t("athleteContact.appointmentsTitle")}</h3>
          <ul className="athlete-contact__list">
            {appointments.map((item) => (
              <li key={item.id}>
                <strong>{t(`athleteFile.appointmentStatus.${item.status}`)}</strong>
                <span>
                  {new Date(item.created_at).toLocaleDateString()}
                  {item.scheduled_at &&
                    ` · ${t("athleteContact.scheduledFor")} ${new Date(item.scheduled_at).toLocaleString()}`}
                </span>
                {item.psychologist_reply && <p>{item.psychologist_reply}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="athlete-contact__history">
        <h3>{t("athleteContact.messagesTitle")}</h3>
        {loadingThread ? (
          <p className="empty-state">{t("athleteContact.loadingThread")}</p>
        ) : thread.length === 0 ? (
          <p className="empty-state">{t("athleteContact.noMessagesYet")}</p>
        ) : (
          <ul className="message-thread message-thread--athlete" aria-label={t("athleteContact.messagesTitle")}>
            {thread.map((item) => {
              const fromPsych = item.sender_role === "psychologist"
              return (
                <li
                  key={item.id}
                  className={
                    fromPsych
                      ? "message-thread__item message-thread__item--psychologist"
                      : "message-thread__item message-thread__item--athlete"
                  }
                >
                  <header>
                    <strong>
                      {fromPsych ? t("athleteContact.fromPsychologist") : t("athleteContact.fromYou")}
                    </strong>
                    <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                  </header>
                  <p>{item.message}</p>
                </li>
              )
            })}
          </ul>
        )}
      </section>

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
