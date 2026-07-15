import { Card } from "../ui/Card"

export function CoachRecommendationsPanel({ recommendations, t }) {
  return (
    <Card
      title={t("coach.recommendationsTitle")}
      subtitle={t("coach.recommendationsSubtitle")}
      className="coach-recommendations"
    >
      {!recommendations.length ? (
        <p className="empty-state">{t("coach.recommendationsEmpty")}</p>
      ) : (
        <ul className="coach-recommendations__list">
          {recommendations.map((row) => (
            <li key={row.id} className="coach-recommendations__item">
              <blockquote>{row.message}</blockquote>
              <footer>
                {t("coach.recommendationsSharedAt", {
                  date: new Date(row.shared_at).toLocaleDateString(),
                })}
              </footer>
            </li>
          ))}
        </ul>
      )}
      <p className="coach-recommendations__privacy">{t("coach.recommendationsPrivacy")}</p>
    </Card>
  )
}
