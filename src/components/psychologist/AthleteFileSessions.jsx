import { useState } from "react"
import { supabase } from "../../supabase"
import { Button } from "../ui/Button"
import { todayISO } from "../../lib/dates"

const EMPTY_FORM = {
  session_date: todayISO(),
  topic: "",
  actions: "",
  duration_minutes: 30,
  next_session: "",
}

export function AthleteFileSessions({ athleteId, psychologistId, sessions, onChange, t }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError("")
  }

  const startEdit = (session) => {
    setEditingId(session.id)
    setForm({
      session_date: session.session_date,
      topic: session.topic || "",
      actions: session.actions || "",
      duration_minutes: session.duration_minutes || 30,
      next_session: session.next_session || "",
    })
  }

  const save = async (event) => {
    event.preventDefault()
    if (!form.topic.trim()) {
      setError(t("athleteFile.sessions.topicRequired"))
      return
    }

    setSaving(true)
    setError("")
    const now = new Date().toISOString()
    const payload = {
      athlete_id: athleteId,
      psychologist_id: psychologistId,
      session_date: form.session_date,
      topic: form.topic.trim(),
      actions: form.actions.trim(),
      duration_minutes: Number(form.duration_minutes) || 30,
      next_session: form.next_session.trim(),
      updated_at: now,
    }

    const query = editingId
      ? supabase.from("psychologist_sessions").update(payload).eq("id", editingId)
      : supabase.from("psychologist_sessions").insert([payload])

    const { error: err } = await query
    setSaving(false)

    if (err) {
      setError(err.message)
      return
    }

    resetForm()
    onChange?.()
  }

  const remove = async (sessionId) => {
    if (!confirm(t("athleteFile.sessions.deleteConfirm"))) return
    const { error: err } = await supabase.from("psychologist_sessions").delete().eq("id", sessionId)
    if (err) setError(err.message)
    else {
      if (editingId === sessionId) resetForm()
      onChange?.()
    }
  }

  return (
    <div className="athlete-file-notes">
      <form className="athlete-file-notes__form" onSubmit={save}>
        <h3>{editingId ? t("athleteFile.sessions.editTitle") : t("athleteFile.sessions.newTitle")}</h3>

        <label className="field">
          <span>{t("athleteFile.sessions.date")}</span>
          <input
            type="date"
            value={form.session_date}
            onChange={(e) => setForm((p) => ({ ...p, session_date: e.target.value }))}
            required
          />
        </label>

        <label className="field">
          <span>{t("athleteFile.sessions.duration")}</span>
          <select
            value={form.duration_minutes}
            onChange={(e) => setForm((p) => ({ ...p, duration_minutes: Number(e.target.value) }))}
          >
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
          </select>
        </label>

        <label className="field">
          <span>{t("athleteFile.sessions.topic")}</span>
          <input
            value={form.topic}
            onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
            placeholder={t("athleteFile.sessions.topicPlaceholder")}
            required
          />
        </label>

        <label className="field">
          <span>{t("athleteFile.sessions.actions")}</span>
          <textarea
            rows={3}
            value={form.actions}
            onChange={(e) => setForm((p) => ({ ...p, actions: e.target.value }))}
            placeholder={t("athleteFile.sessions.actionsPlaceholder")}
          />
        </label>

        <label className="field">
          <span>{t("athleteFile.sessions.nextSession")}</span>
          <textarea
            rows={2}
            value={form.next_session}
            onChange={(e) => setForm((p) => ({ ...p, next_session: e.target.value }))}
            placeholder={t("athleteFile.sessions.nextSessionPlaceholder")}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="athlete-file-notes__actions">
          <Button type="submit" disabled={saving}>
            {saving
              ? t("athleteFile.saving")
              : editingId
                ? t("athleteFile.save")
                : t("athleteFile.sessions.add")}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </form>

      {sessions.length === 0 ? (
        <p className="empty-state">{t("athleteFile.sessions.empty")}</p>
      ) : (
        <ul className="athlete-file-notes__list">
          {sessions.map((session) => (
            <li key={session.id} className="athlete-file-notes__item">
              <header>
                <strong>{session.topic}</strong>
                <time dateTime={session.session_date}>
                  {new Date(session.session_date + "T12:00:00").toLocaleDateString()} ·{" "}
                  {session.duration_minutes} min
                </time>
              </header>
              {session.actions && (
                <p>
                  <em>{t("athleteFile.sessions.actions")}:</em> {session.actions}
                </p>
              )}
              {session.next_session && (
                <p>
                  <em>{t("athleteFile.sessions.nextSession")}:</em> {session.next_session}
                </p>
              )}
              <div className="athlete-file-notes__item-actions">
                <Button variant="ghost" onClick={() => startEdit(session)}>
                  {t("athleteFile.edit")}
                </Button>
                <Button variant="ghost" className="btn--danger-text" onClick={() => remove(session.id)}>
                  {t("athleteFile.delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
