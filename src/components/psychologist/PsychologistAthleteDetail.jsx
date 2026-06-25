import { Card } from "../ui/Card"
import { InsightCard } from "../InsightCard"
import { WeeklyEorChart } from "../WeeklyEorTeamChart"
import { WeeklyEorPanel } from "../WeeklyEorPanel"
import { aggregateWeeklyEorTrend } from "../../lib/coachTeamAnalytics"
import { getLatestWeeklyReflection } from "../../lib/weeklyEor"
import { consentStatus, isAdultInSpain } from "../../lib/age"

export function PsychologistAthleteDetail({
  athlete,
  teamName,
  checkIns,
  assessment,
  insight,
  insightLoading,
  insightSource,
  t,
}) {
  const latestWeekly = getLatestWeeklyReflection(checkIns)
  const weeklyTrend = aggregateWeeklyEorTrend(checkIns)

  return (
    <>
      <Card title={athlete.name} subtitle={t("psychologist.historySubtitle")}>
        {teamName && (
          <p className="card__subtitle" style={{ marginBottom: 12 }}>
            {teamName}
          </p>
        )}
        <div className="insight-card-wrap">
          <InsightCard
            title={t("insights.athleteTitle")}
            insight={insight}
            loading={insightLoading}
            source={insightSource}
          />
        </div>
        <WeeklyEorChart
          weeklyTrend={weeklyTrend}
          variant="psychologist"
          title={t("chart.eorAthleteTitle")}
          subtitle={t("chart.eorAthleteSubtitle")}
        />
      </Card>

      <Card title={t("psychologist.weeklyEorTitle")} subtitle={t("psychologist.weeklyEorSubtitle")}>
        <WeeklyEorPanel checkIn={latestWeekly} t={t} />
      </Card>

      <Card title={t("psychologist.consentTitle")} subtitle={t("psychologist.consentSubtitle")}>
        <div className="consent-detail">
          <p>
            <strong>{t("psychologist.birthDate")}:</strong>{" "}
            {athlete.date_of_birth || t("risk.noData")}
          </p>
          <p>
            <strong>{t("psychologist.consentStatus")}:</strong>{" "}
            {t(`consent.${consentStatus(athlete)}`)}
          </p>
          {athlete.date_of_birth && !isAdultInSpain(athlete.date_of_birth) && (
            <>
              <p>
                <strong>{t("psychologist.guardianName")}:</strong>{" "}
                {athlete.guardian_full_name || t("risk.noData")}
              </p>
              <p>
                <strong>{t("psychologist.guardianRelationship")}:</strong>{" "}
                {athlete.guardian_relationship || t("risk.noData")}
              </p>
              <p>
                <strong>{t("psychologist.guardianContact")}:</strong>{" "}
                {[athlete.guardian_email, athlete.guardian_phone].filter(Boolean).join(" · ") ||
                  t("risk.noData")}
              </p>
              <p>
                <strong>{t("psychologist.guardianSignature")}:</strong>{" "}
                {athlete.guardian_signature || t("risk.noData")}
              </p>
              <p>
                <strong>{t("psychologist.consentSignedAt")}:</strong>{" "}
                {athlete.guardian_consent_signed_at
                  ? new Date(athlete.guardian_consent_signed_at).toLocaleString()
                  : t("risk.noData")}
              </p>
              <p>
                <strong>{t("psychologist.consentVersion")}:</strong>{" "}
                {athlete.guardian_consent_text_version || t("risk.noData")}
              </p>
            </>
          )}
        </div>
      </Card>

      <Card
        title={t("psychologist.initialAssessment")}
        subtitle={t("psychologist.initialAssessmentSubtitle")}
      >
        {assessment ? (
          <div className="assessment-review">
            <AssessmentSection
              title={t("initialAssessment.personal")}
              data={assessment.personal_info}
              t={t}
            />
            <AssessmentSection
              title={t("initialAssessment.sleep")}
              data={assessment.sleep_habits}
              t={t}
            />
            <AssessmentSection
              title={t("initialAssessment.nutrition")}
              data={assessment.nutrition_habits}
              t={t}
            />
            <AssessmentSection
              title={t("initialAssessment.sports")}
              data={assessment.sports_background}
              t={t}
            />
            <AssessmentSection
              title={t("initialAssessment.support")}
              data={assessment.family_social_support}
              t={t}
            />
          </div>
        ) : (
          <p className="empty-state">{t("psychologist.noInitialAssessment")}</p>
        )}
      </Card>

      <Card
        title={t("psychologist.checkInLog")}
        subtitle={t("psychologist.checkInLogSubtitleSimple")}
      >
        {checkIns.length === 0 ? (
          <p className="empty-state">{t("psychologist.noCheckIns")}</p>
        ) : (
          <ul className="check-in-register">
            {checkIns.map((c) => (
              <li key={c.id} className="check-in-register__row">
                <span>{c.check_in_date}</span>
                <span className="check-in-register__status">{t("psychologist.checkInResponded")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

function AssessmentSection({ title, data = {}, t }) {
  return (
    <section className="assessment-review__section">
      <h3>{title}</h3>
      <dl>
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <dt>{t(`initialAssessment.fields.${key}`)}</dt>
            <dd>{formatAssessmentValue(value, t)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function formatAssessmentValue(value, t) {
  if (!value) return "—"
  const translated = t(`initialAssessment.options.${value}`)
  return translated === `initialAssessment.options.${value}` ? value : translated
}
