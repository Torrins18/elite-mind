import { useCallback, useEffect, useState } from "react"
import { supabase } from "../../supabase"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"

export function CoachShareRecommendation({ teamId, psychologistId, t }) {
  const [message, setMessage] = useState("")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("coach_recommendations")
      .select("id, message, shared_at, archived_at")
      .eq("team_id", teamId)
      .is("archived_at", null)
      .order("shared_at", { ascending: false })
      .limit(10)

    setItems(data || [])
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    load()
  }, [load])

  const share = async (event) => {
    event.preventDefault()
    const text = message.trim()
    if (text.length < 8) return

    setSubmitting(true)
    setFeedback("")

    const { error } = await supabase.from("coach_recommendations").insert([
      {
        team_id: teamId,
        psychologist_id: psychologistId,
        message: text,
      },
    ])

    setSubmitting(false)

    if (error) {
      setFeedback(error.message)
      return
    }

    setMessage("")
    setFeedback(t("psychologist.coachRecommendationShared"))
    await load()
  }

  const archive = async (id) => {
    const { error } = await supabase
      .from("coach_recommendations")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)

    if (!error) await load()
  }

  return (
    <Card
      title={t("psychologist.coachRecommendationsTitle")}
      subtitle={t("psychologist.coachRecommendationsSubtitle")}
      className="coach-share-recommendation"
    >
      <form className="coach-share-recommendation__form" onSubmit={share}>
        <label className="coach-share-recommendation__label">
          <span>{t("psychologist.coachRecommendationLabel")}</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t("psychologist.coachRecommendationPlaceholder")}
            rows={3}
          />
        </label>
        <p className="auth-form__hint">{t("psychologist.coachRecommendationHint")}</p>
        <Button type="submit" disabled={submitting || message.trim().length < 8}>
          {t("psychologist.coachRecommendationShare")}
        </Button>
        {feedback && <p className="form-success">{feedback}</p>}
      </form>

      {loading ? (
        <p className="empty-state">{t("psychologist.loading")}</p>
      ) : items.length > 0 ? (
        <ul className="coach-share-recommendation__list">
          {items.map((row) => (
            <li key={row.id}>
              <blockquote>{row.message}</blockquote>
              <div className="coach-share-recommendation__meta">
                <span>{new Date(row.shared_at).toLocaleString()}</span>
                <Button variant="ghost" className="btn--danger-text" onClick={() => archive(row.id)}>
                  {t("psychologist.coachRecommendationArchive")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}
