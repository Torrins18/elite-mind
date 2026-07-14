import { useCallback, useEffect, useState } from "react"
import { supabase } from "../../supabase"
import { useTranslation } from "../../i18n/LanguageContext"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"

const RESOURCE_TYPES = ["breathing", "visualization", "audio", "pdf", "video", "routine"]

const EMPTY_RESOURCE = {
  title: "",
  description: "",
  resource_type: "routine",
  url: "",
}

export function PsychologistResourceLibrary({ psychologistId }) {
  const { t } = useTranslation()
  const [resources, setResources] = useState([])
  const [form, setForm] = useState(EMPTY_RESOURCE)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("psychologist_resources")
      .select("*")
      .eq("psychologist_id", psychologistId)
      .order("created_at", { ascending: false })

    if (error) setMessage(error.message)
    else setResources(data || [])
    setLoading(false)
  }, [psychologistId])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setForm(EMPTY_RESOURCE)
    setEditingId(null)
  }

  const save = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return

    setSaving(true)
    setMessage("")
    const now = new Date().toISOString()
    const payload = {
      psychologist_id: psychologistId,
      title: form.title.trim(),
      description: form.description.trim(),
      resource_type: form.resource_type,
      url: form.url.trim(),
      updated_at: now,
    }

    const query = editingId
      ? supabase.from("psychologist_resources").update(payload).eq("id", editingId)
      : supabase.from("psychologist_resources").insert([payload])

    const { error } = await query
    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage(t("resources.saved"))
    resetForm()
    await load()
  }

  const startEdit = (resource) => {
    setEditingId(resource.id)
    setForm({
      title: resource.title,
      description: resource.description || "",
      resource_type: resource.resource_type,
      url: resource.url || "",
    })
  }

  const remove = async (id) => {
    if (!confirm(t("resources.deleteConfirm"))) return
    const { error } = await supabase.from("psychologist_resources").delete().eq("id", id)
    if (error) setMessage(error.message)
    else await load()
  }

  if (loading) return null

  return (
    <Card title={t("resources.title")} subtitle={t("resources.subtitle")}>
      <form className="resource-library__form" onSubmit={save}>
        <label className="field">
          <span>{t("resources.fieldTitle")}</span>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder={t("resources.titlePlaceholder")}
            required
          />
        </label>
        <label className="field">
          <span>{t("resources.fieldType")}</span>
          <select
            value={form.resource_type}
            onChange={(e) => setForm((p) => ({ ...p, resource_type: e.target.value }))}
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`resources.type.${type}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("resources.fieldDescription")}</span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </label>
        <label className="field">
          <span>{t("resources.fieldUrl")}</span>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            placeholder="https://"
          />
        </label>
        <div className="resource-library__actions">
          <Button type="submit" disabled={saving}>
            {saving ? t("resources.saving") : editingId ? t("resources.save") : t("resources.add")}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </form>

      {resources.length === 0 ? (
        <p className="empty-state">{t("resources.empty")}</p>
      ) : (
        <ul className="resource-library__list">
          {resources.map((resource) => (
            <li key={resource.id} className="resource-library__item">
              <div>
                <strong>{resource.title}</strong>
                <Badge variant="default">{t(`resources.type.${resource.resource_type}`)}</Badge>
              </div>
              {resource.description && <p>{resource.description}</p>}
              {resource.url && (
                <a href={resource.url} target="_blank" rel="noreferrer">
                  {resource.url}
                </a>
              )}
              <div className="resource-library__item-actions">
                <Button variant="ghost" onClick={() => startEdit(resource)}>
                  {t("resources.edit")}
                </Button>
                <Button variant="ghost" className="btn--danger-text" onClick={() => remove(resource.id)}>
                  {t("resources.delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {message && <p className="form-message">{message}</p>}
    </Card>
  )
}
