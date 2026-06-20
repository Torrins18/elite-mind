import { Card } from "./ui/Card"
import { EorIndexSummary } from "./EorIndexSummary"

export function CoachWeeklySnapshot({ snapshot, t }) {
  if (!snapshot) {
    return (
      <Card title={t("coach.weeklyResultsTitle")} subtitle={t("coach.weeklyResultsSubtitle")}>
        <p className="empty-state">{t("coach.weeklyResultsEmpty")}</p>
      </Card>
    )
  }

  return (
    <Card title={t("coach.weeklyResultsTitle")} subtitle={t("coach.weeklyResultsSubtitle")}>
      <p className="coach-weekly-meta">
        {t("coach.weeklyResultsMeta", {
          date: snapshot.weekDate,
          count: snapshot.responses,
        })}
      </p>
      <EorIndexSummary indexes={snapshot} variant="coach" t={t} />
      <p className="team-summary-note">{t("coach.weeklyResultsPrivacy")}</p>
    </Card>
  )
}
