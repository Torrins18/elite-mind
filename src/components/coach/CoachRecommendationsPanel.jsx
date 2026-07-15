import { Card } from "../ui/Card"
import { EmptyState } from "../ui/EmptyState"

export function CoachRecommendationsPanel({ recommendations, t }) {
  return (
    <Card
      title={t("coach.recommendationsTitle")}
      subtitle={t("coach.recommendationsSubtitle")}
      className="coach-recommendations"
    >
      {!recommendations.length ? (
        <EmptyState
          icon="clipboard"
          title={t("ux.emptyCoachRecommendationsTitle")}
          description={t("ux.emptyCoachRecommendationsBody")}
        />
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
