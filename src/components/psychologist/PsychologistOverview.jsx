import { Card } from "../ui/Card"
import { StatCard } from "../ui/StatCard"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { InsightCard } from "../InsightCard"
import { countByRisk } from "../../lib/risk"
import { consentStatus } from "../../lib/age"
import {
  aggregateWeeklyEorTrend,
  getLatestWeeklyTeamSnapshot,
} from "../../lib/coachTeamAnalytics"

export function PsychologistOverview({
  athletes,
  checkIns,
  teamSummaries,
  orgInsight,
  consentCounts,
  t,
  onOpenTeam,
  compact = false,
}) {
  const orgEorSnapshot = getLatestWeeklyTeamSnapshot(aggregateWeeklyEorTrend(checkIns))
  const riskCounts = countByRisk(checkIns)

  return (
    <>
      {!compact && (
        <Card>
          <InsightCard
            title={t("psychologist.overviewInsightTitle")}
            insight={orgInsight}
            footer={t("insights.footer")}
          />
        </Card>
      )}

      {!compact && (
        <div className="stats-row stats-row--compact">
        <StatCard label={t("psychologist.athletesMonitored")} value={athletes.length} />
        <StatCard
          label={t("psychologist.orgAvgMental")}
          value={orgEorSnapshot?.mental ?? "—"}
        />
        <StatCard
          label={t("psychologist.highEmotionalRisk")}
          value={riskCounts.high}
          accent="var(--danger)"
        />
        <StatCard
          label={t("psychologist.guardianConsents")}
          value={consentCounts.guardianSigned}
          hint={t("psychologist.pendingConsents", {
            count: consentCounts.guardianPending + consentCounts.missingBirthDate,
          })}
        />
      </div>
      )}

      <Card title={t("psychologist.teamCardsTitle")} subtitle={t("psychologist.teamCardsSubtitle")}>
        {teamSummaries.length === 0 ? (
          <p className="empty-state">{t("psychologist.noTeams")}</p>
        ) : (
          <ul className="team-overview-grid">
            {teamSummaries.map(({ team, athletes: teamAthletes, summary, insight, highRiskCount, eorSnapshot }) => (
              <li key={team.id} className="team-overview-card">
                <div className="team-overview-card__header">
                  <h3>{team.name}</h3>
                  {highRiskCount > 0 && <Badge variant="high">{highRiskCount}</Badge>}
                </div>
                <p className="team-overview-card__insight">{insight.text}</p>
                <dl className="team-overview-card__stats">
                  <div>
                    <dt>{t("psychologist.athletesMonitored")}</dt>
                    <dd>{teamAthletes.length}</dd>
                  </div>
                  <div>
                    <dt>{t("coach.checkedInThisWeek")}</dt>
                    <dd>{summary.checkedInThisWeek}</dd>
                  </div>
                  <div>
                    <dt>{t("psychologist.orgAvgMental")}</dt>
                    <dd>{eorSnapshot?.mental ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("psychologist.highEmotionalRisk")}</dt>
                    <dd>{summary.riskBreakdown.high}</dd>
                  </div>
                </dl>
                <Button variant="ghost" onClick={() => onOpenTeam(team.id)}>
                  {t("psychologist.openTeam")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

export function buildConsentCounts(athletes) {
  return athletes.reduce(
    (acc, athlete) => {
      acc[consentStatus(athlete)] += 1
      return acc
    },
    { adult: 0, guardianSigned: 0, guardianPending: 0, missingBirthDate: 0 }
  )
}
