import { Card } from "../ui/Card"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { CheckInChart } from "../CheckInChart"
import { InsightCard } from "../InsightCard"
import { calculateRiskLevel } from "../../lib/risk"
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
  const emotionalRisk = checkIns.filter(
    (c) => calculateRiskLevel(c) === "high" || (c.personal_notes && c.personal_notes.length > 20)
  )

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
            footer={t("insights.footer")}
            loading={insightLoading}
            source={insightSource}
          />
        </div>
        <CheckInChart checkIns={checkIns.slice(0, 14)} />
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

      {emotionalRisk.length > 0 && (
        <Card
          title={t("psychologist.emotionalRisk")}
          subtitle={t("psychologist.emotionalRiskSubtitle")}
        >
          <ul className="notes-list">
            {emotionalRisk.slice(0, 8).map((c) => {
              const r = calculateRiskLevel(c)
              return (
                <li key={c.id}>
                  <div className="notes-list__meta">
                    <span>{c.check_in_date}</span>
                    <Badge variant={r}>{t(`risk.${r}`)}</Badge>
                  </div>
                  <p className="notes-list__metrics">
                    {t("psychologist.moodStress", {
                      mood: c.mood,
                      stress: c.stress,
                    })}{" "}
                    · {t("checkIn.metricSleep")} {c.sleep_quality} · {t("checkIn.metricEnergy")}{" "}
                    {c.energy}
                  </p>
                  {c.personal_notes && <blockquote>{c.personal_notes}</blockquote>}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Card title={t("psychologist.checkInLog")} subtitle={t("psychologist.checkInLogSubtitle")}>
        <ul className="notes-list">
          {checkIns.length === 0 ? (
            <p className="empty-state">{t("psychologist.noCheckIns")}</p>
          ) : (
            checkIns.map((c) => {
              const r = calculateRiskLevel(c)
              return (
                <li key={c.id}>
                  <div className="notes-list__meta">
                    <span>{c.check_in_date}</span>
                    <Badge variant={r}>{t(`risk.${r}`)}</Badge>
                  </div>
                  <p className="notes-list__metrics">
                    {t("checkIn.metricMood")} {c.mood} · {t("checkIn.metricStress")} {c.stress} ·{" "}
                    {t("checkIn.metricSleep")} {c.sleep_quality} · {t("checkIn.metricEnergy")}{" "}
                    {c.energy} · {t("checkIn.metricFocus")} {c.focus}
                  </p>
                  {c.personal_notes ? (
                    <blockquote>{c.personal_notes}</blockquote>
                  ) : (
                    <p className="notes-list__empty">{t("psychologist.noNotes")}</p>
                  )}
                  {hasExtendedCheckIn(c) && (
                    <div className="extended-review">
                      <p>
                        <strong>{t("checkIn.performanceRating")}:</strong>{" "}
                        {c.performance_rating ?? "—"}/10
                      </p>
                      <p>
                        <strong>{t("checkIn.involvementRating")}:</strong>{" "}
                        {c.involvement_rating ?? "—"}/10
                      </p>
                      {c.general_mood_words && (
                        <p>
                          <strong>{t("checkIn.generalMoodWords")}:</strong> {c.general_mood_words}
                        </p>
                      )}
                      {c.mood_change_event && (
                        <p>
                          <strong>{t("checkIn.moodChangeEvent")}:</strong> {c.mood_change_event}
                        </p>
                      )}
                      {c.next_goal && (
                        <p>
                          <strong>{t("checkIn.nextGoal")}:</strong> {c.next_goal}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })
          )}
        </ul>
      </Card>
    </>
  )
}

function hasExtendedCheckIn(checkIn) {
  return Boolean(
    checkIn.performance_rating !== null ||
      checkIn.involvement_rating !== null ||
      checkIn.general_mood_words ||
      checkIn.mood_change_event ||
      checkIn.next_goal
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
