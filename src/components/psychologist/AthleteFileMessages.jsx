import { useState } from "react"
import { supabase } from "../../supabase"
import { Button } from "../ui/Button"

export function AthleteFileMessages({ athleteId, psychologistId, messages, onChange, t }) {
  const [reply, setReply] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const sendReply = async (event) => {
    event.preventDefault()
    const trimmed = reply.trim()
    if (!trimmed) return

    setSaving(true)
    setError("")

    const { error: err } = await supabase.from("psychologist_messages").insert([
      {
        user_id: athleteId,
        message: trimmed,
        sender_role: "psychologist",
        status: "unread",
      },
    ])

    setSaving(false)

    if (err) {
      setError(err.message)
      return
    }

    setReply("")
    onChange?.()
  }

  const markRead = async (messageId) => {
    const { error: err } = await supabase
      .from("psychologist_messages")
      .update({ status: "read" })
      .eq("id", messageId)
    if (!err) onChange?.()
  }

  return (
    <div className="message-thread-panel">
      {messages.length === 0 ? (
        <p className="empty-state">{t("athleteFile.noMessages")}</p>
      ) : (
        <ul className="message-thread" aria-label={t("athleteFile.messages.threadLabel")}>
          {messages.map((item) => {
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
                    {fromPsych ? t("athleteFile.messages.fromPsychologist") : t("athleteFile.messages.fromAthlete")}
                  </strong>
                  <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                  {!fromPsych && item.status === "unread" && (
                    <span className="message-thread__unread">{t("athleteFile.messageStatus.unread")}</span>
                  )}
                </header>
                <p>{item.message}</p>
                {!fromPsych && item.status === "unread" && (
                  <Button variant="ghost" onClick={() => markRead(item.id)}>
                    {t("psychologist.markMessageRead")}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <form className="message-thread__reply" onSubmit={sendReply}>
        <h3>{t("athleteFile.messages.replyTitle")}</h3>
        <label className="field">
          <span>{t("athleteFile.messages.replyLabel")}</span>
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t("athleteFile.messages.replyPlaceholder")}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <Button type="submit" disabled={saving || !reply.trim()}>
          {saving ? t("athleteFile.saving") : t("athleteFile.messages.sendReply")}
        </Button>
      </form>
    </div>
  )
}
