import { useRef, useState } from "react"
import { supabase } from "../../supabase"
import { Button } from "../ui/Button"

const BUCKET = "athlete-documents"
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

function sanitizeFileName(name) {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120)
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AthleteFileDocuments({ athleteId, psychologistId, documents, onChange, t }) {
  const inputRef = useRef(null)
  const [title, setTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const upload = async (event) => {
    event.preventDefault()
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setError(t("athleteFile.documents.fileRequired"))
      return
    }
    if (!title.trim()) {
      setError(t("athleteFile.documents.titleRequired"))
      return
    }
    if (file.size > MAX_BYTES) {
      setError(t("athleteFile.documents.tooLarge"))
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("athleteFile.documents.invalidType"))
      return
    }

    setUploading(true)
    setError("")

    const safeName = sanitizeFileName(file.name)
    const storagePath = `${athleteId}/${crypto.randomUUID()}-${safeName}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
      upsert: false,
      contentType: file.type,
    })

    if (uploadError) {
      setUploading(false)
      setError(uploadError.message)
      return
    }

    const { error: dbError } = await supabase.from("athlete_documents").insert([
      {
        athlete_id: athleteId,
        psychologist_id: psychologistId,
        title: title.trim(),
        file_name: safeName,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
      },
    ])

    setUploading(false)

    if (dbError) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      setError(dbError.message)
      return
    }

    setTitle("")
    if (inputRef.current) inputRef.current.value = ""
    onChange?.()
  }

  const openDocument = async (doc) => {
    const { data, error: urlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, 120)

    if (urlError) {
      setError(urlError.message)
      return
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer")
  }

  const remove = async (doc) => {
    if (!confirm(t("athleteFile.documents.deleteConfirm"))) return

    await supabase.storage.from(BUCKET).remove([doc.storage_path])
    const { error: dbError } = await supabase.from("athlete_documents").delete().eq("id", doc.id)

    if (dbError) setError(dbError.message)
    else onChange?.()
  }

  return (
    <div className="athlete-file-documents">
      <form className="athlete-file-notes__form" onSubmit={upload}>
        <h3>{t("athleteFile.documents.uploadTitle")}</h3>

        <label className="field">
          <span>{t("athleteFile.documents.title")}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("athleteFile.documents.titlePlaceholder")}
            required
          />
        </label>

        <label className="field">
          <span>{t("athleteFile.documents.file")}</span>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" />
        </label>

        <p className="auth-form__hint">{t("athleteFile.documents.hint")}</p>

        {error && <p className="form-error">{error}</p>}

        <Button type="submit" disabled={uploading}>
          {uploading ? t("athleteFile.documents.uploading") : t("athleteFile.documents.upload")}
        </Button>
      </form>

      {documents.length === 0 ? (
        <p className="empty-state">{t("athleteFile.documents.empty")}</p>
      ) : (
        <ul className="athlete-file-documents__list">
          {documents.map((doc) => (
            <li key={doc.id} className="athlete-file-documents__item">
              <div>
                <strong>{doc.title}</strong>
                <span>
                  {doc.file_name} · {formatSize(doc.file_size)} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="athlete-file-notes__item-actions">
                <Button variant="ghost" onClick={() => openDocument(doc)}>
                  {t("athleteFile.documents.open")}
                </Button>
                <Button variant="ghost" className="btn--danger-text" onClick={() => remove(doc)}>
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
