import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../supabase"
import { Button } from "../ui/Button"
import {
  assessmentToForm,
  buildBaselineSummary,
  compareWeeklyToBaseline,
  formToAssessmentPayload,
} from "../../lib/baseline"
import { consentStatus, isAdultInSpain } from "../../lib/age"

export function AthleteFileBaseline({
  athlete,
  assessment,
  latestWeekly,
  lang,
  t,
  onAssessmentUpdated,
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState(() => assessmentToForm(assessment) || {})

  useEffect(() => {
    if (editing && assessment) {
      setForm(assessmentToForm(assessment) || {})
    }
  }, [editing, assessment])

  const comparisons = useMemo(
    () => compareWeeklyToBaseline(assessment, latestWeekly),
    [assessment, latestWeekly]
  )

  const saveEdit = async (event) => {
    event.preventDefault()
    if (!assessment?.id) return
    setSaving(true)
    setError("")

    const payload = formToAssessmentPayload(form, form.calculatedAge)
    const summary = buildBaselineSummary(
      {
        ...assessment,
        ...payload,
      },
      lang
    )

    const { error: updateError } = await supabase
      .from("athlete_initial_assessments")
      .update({ ...payload, baseline_summary: form.baseline_summary || summary })
      .eq("id", assessment.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setEditing(false)
    onAssessmentUpdated?.()
  }

  return (
    <>
      <section className="athlete-file-section">
        <h3>{t("psychologist.consentTitle")}</h3>
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
                <strong>{t("psychologist.consentSignedAt")}:</strong>{" "}
                {athlete.guardian_consent_signed_at
                  ? new Date(athlete.guardian_consent_signed_at).toLocaleString()
                  : t("risk.noData")}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="athlete-file-section">
        <header className="athlete-file-section__header">
          <h3>{t("baseline.title")}</h3>
          {assessment && !editing && (
            <Button variant="ghost" onClick={() => setEditing(true)}>
              {t("baseline.edit")}
            </Button>
          )}
        </header>

        {!assessment ? (
          <p className="empty-state">{t("psychologist.noInitialAssessment")}</p>
        ) : editing ? (
          <form className="assessment-form" onSubmit={saveEdit}>
            <label className="assessment-field assessment-field--wide">
              <span>{t("baseline.summaryTitle")}</span>
              <textarea
                rows={4}
                value={form.baseline_summary || ""}
                onChange={(e) => setForm((p) => ({ ...p, baseline_summary: e.target.value }))}
              />
            </label>
            {[
              "greatestStrength",
              "aspectToImprove",
              "preCompetitionWorry",
              "performanceHelps",
              "mistakeReaction",
              "poorPerformanceThoughts",
              "mostConfidentWhen",
              "leastConfidentWhen",
              "seasonObjective",
              "personalObjective",
              "teamObjective",
              "seasonSuccess",
            ].map((key) => (
              <label key={key} className="assessment-field assessment-field--wide">
                <span>{t(`initialAssessment.fields.${key}`)}</span>
                <textarea
                  rows={2}
                  value={form[key] || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </label>
            ))}
            {["currentConfidence", "coachRelationship", "perceivedPressure"].map((key) => (
              <label key={key} className="assessment-field assessment-field--wide">
                <span>
                  {t(`initialAssessment.fields.${key}`)}: <strong>{form[key] || "5"}</strong>
                </span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form[key] || "5"}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </label>
            ))}
            {error && <p className="form-error">{error}</p>}
            <div className="assessment-actions">
              <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("initialAssessment.saving") : t("baseline.save")}
              </Button>
            </div>
          </form>
        ) : (
          <>
            {assessment.baseline_summary && (
              <div className="baseline-summary">
                <h4>{t("baseline.summaryTitle")}</h4>
                <p>{assessment.baseline_summary}</p>
                <p className="baseline-summary__note">{t("baseline.summaryNote")}</p>
              </div>
            )}

            {comparisons.length > 0 && (
              <div className="baseline-comparison">
                <h4>{t("baseline.comparisonTitle")}</h4>
                <p className="baseline-comparison__hint">{t("baseline.comparisonHint")}</p>
                <table className="baseline-comparison__table">
                  <thead>
                    <tr>
                      <th>{t("baseline.metric")}</th>
                      <th>{t("baseline.baselineValue")}</th>
                      <th>{t("baseline.currentValue")}</th>
                      <th>{t("baseline.delta")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((row) => (
                      <tr
                        key={row.key}
                        className={row.significant ? "baseline-comparison__row--alert" : ""}
                      >
                        <td>{t(`baseline.metrics.${row.labelKey}`)}</td>
                        <td>{row.baseline}/10</td>
                        <td>{row.current}/10</td>
                        <td>
                          {row.delta > 0 ? "+" : ""}
                          {row.delta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="assessment-review">
              <AssessmentSection
                title={t("initialAssessment.personal")}
                data={assessment.personal_info}
                t={t}
              />
              <AssessmentSection
                title={t("initialAssessment.context")}
                data={assessment.family_social_support}
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
              {(assessment.mental_profile &&
                Object.keys(assessment.mental_profile).length > 0) && (
                <AssessmentSection
                  title={t("initialAssessment.mental")}
                  data={assessment.mental_profile}
                  t={t}
                />
              )}
              {(assessment.objectives && Object.keys(assessment.objectives).length > 0) && (
                <AssessmentSection
                  title={t("initialAssessment.objectives")}
                  data={assessment.objectives}
                  t={t}
                />
              )}
            </div>
          </>
        )}
      </section>
    </>
  )
}

function AssessmentSection({ title, data = {}, t }) {
  const entries = Object.entries(data).filter(([, value]) => value != null && value !== "")

  if (!entries.length) return null

  return (
    <section className="assessment-review__section">
      <h3>{title}</h3>
      <dl>
        {entries.map(([key, value]) => (
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
