import { Card } from "../ui/Card"

export function CoachTeamStatusCard({ status, t }) {
  if (!status) return null

  const recommendationLine =
    status.params.recommendations > 0
      ? t(
          status.params.recommendations === 1
            ? "coach.teamStatus.recommendationShared"
            : "coach.teamStatus.recommendationsShared",
          status.params
        )
      : t("coach.teamStatus.noRecommendations")

  return (
    <Card className="coach-team-status">
      <div className={`coach-team-status__badge coach-team-status__badge--${status.status}`}>
        <span className="coach-team-status__icon" aria-hidden="true">
          {status.icon}
        </span>
        <h2 className="coach-team-status__title">{t(status.titleKey)}</h2>
      </div>
      <div className="coach-team-status__body">
        <p>{t(status.line1Key, status.params)}</p>
        <p>{t(status.line2Key, status.params)}</p>
        <p className="coach-team-status__recommendation">{recommendationLine}</p>
      </div>
    </Card>
  )
}
