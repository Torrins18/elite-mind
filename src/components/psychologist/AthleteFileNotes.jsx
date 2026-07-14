import { useState } from "react"
import { supabase } from "../../supabase"
import { Button } from "../ui/Button"
import { todayISO } from "../../lib/dates"

const EMPTY_FORM = {
  note_date: todayISO(),
  topic: "",
  actions: "",
  next_session: "",
}

export function AthleteFileNotes({ athleteId, psychologistId, notes, onNotesChange, t }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError("")
  }

  const startEdit = (note) => {
    setEditingId(note.id)
    setForm({
      note_date: note.note_date,
      topic: note.topic || "",
      actions: note.actions || "",
      next_session: note.next_session || "",
    })
    setError("")
  }

  const save = async (event) => {
    event.preventDefault()
    if (!form.topic.trim()) {
      setError(t("athleteFile.notesTopicRequired"))
      return
    }

    setSaving(true)
    setError("")
    const now = new Date().toISOString()
    const payload = {
      athlete_id: athleteId,
      psychologist_id: psychologistId,
      note_date: form.note_date,
      topic: form.topic.trim(),
      actions: form.actions.trim(),
      next_session: form.next_session.trim(),
      updated_at: now,
    }

    const query = editingId
      ? supabase.from("psychologist_notes").update(payload).eq("id", editingId)
      : supabase.from("psychologist_notes").insert([payload])

    const { error: err } = await query
    setSaving(false)

    if (err) {
      setError(err.message)
      return
    }

    resetForm()
    onNotesChange?.()
  }

  const remove = async (noteId) => {
    if (!confirm(t("athleteFile.notesDeleteConfirm"))) return

    const { error: err } = await supabase.from("psychologist_notes").delete().eq("id", noteId)
    if (err) {
      setError(err.message)
      return
    }

    if (editingId === noteId) resetForm()
    onNotesChange?.()
  }

  return (
    <div className="athlete-file-notes">
      <form className="athlete-file-notes__form" onSubmit={save}>
        <h3>{editingId ? t("athleteFile.notesEditTitle") : t("athleteFile.notesNewTitle")}</h3>

        <label className="field">
          <span>{t("athleteFile.notesDate")}</span>
          <input
            type="date"
            value={form.note_date}
            onChange={(e) => setForm((prev) => ({ ...prev, note_date: e.target.value }))}
            required
          />
        </label>

        <label className="field">
          <span>{t("athleteFile.notesTopic")}</span>
          <input
            value={form.topic}
            onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
            placeholder={t("athleteFile.notesTopicPlaceholder")}
            required
          />
        </label>

        <label className="field">
          <span>{t("athleteFile.notesActions")}</span>
          <textarea
            rows={3}
            value={form.actions}
            onChange={(e) => setForm((prev) => ({ ...prev, actions: e.target.value }))}
            placeholder={t("athleteFile.notesActionsPlaceholder")}
          />
        </label>

        <label className="field">
          <span>{t("athleteFile.notesNextSession")}</span>
          <textarea
            rows={2}
            value={form.next_session}
            onChange={(e) => setForm((prev) => ({ ...prev, next_session: e.target.value }))}
            placeholder={t("athleteFile.notesNextSessionPlaceholder")}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="athlete-file-notes__actions">
          <Button type="submit" disabled={saving}>
            {saving ? t("athleteFile.saving") : editingId ? t("athleteFile.save") : t("athleteFile.addNote")}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="empty-state">{t("athleteFile.noNotes")}</p>
      ) : (
        <ul className="athlete-file-notes__list">
          {notes.map((note) => (
            <li key={note.id} className="athlete-file-notes__item">
              <header>
                <strong>{note.topic}</strong>
                <time dateTime={note.note_date}>
                  {new Date(note.note_date + "T12:00:00").toLocaleDateString()}
                </time>
              </header>
              {note.actions && (
                <p>
                  <em>{t("athleteFile.notesActions")}:</em> {note.actions}
                </p>
              )}
              {note.next_session && (
                <p>
                  <em>{t("athleteFile.notesNextSession")}:</em> {note.next_session}
                </p>
              )}
              <div className="athlete-file-notes__item-actions">
                <Button variant="ghost" onClick={() => startEdit(note)}>
                  {t("athleteFile.edit")}
                </Button>
                <Button variant="ghost" className="btn--danger-text" onClick={() => remove(note.id)}>
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
