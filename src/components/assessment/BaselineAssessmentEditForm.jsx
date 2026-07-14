import { Button } from "../ui/Button"
import {
  ASSESSMENT_SECTION_KEYS,
  AssessmentSectionFields,
  sectionTitleKey,
} from "./AssessmentSectionFields"

export function BaselineAssessmentEditForm({
  form,
  setForm,
  calculatedAge,
  teamName,
  t,
  saving,
  error,
  onCancel,
  onSubmit,
}) {
  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <form className="assessment-form baseline-edit-form" onSubmit={onSubmit}>
      <label className="assessment-field assessment-field--wide">
        <span>{t("baseline.summaryTitle")}</span>
        <textarea
          rows={4}
          value={form.baseline_summary || ""}
          onChange={(e) => setForm((p) => ({ ...p, baseline_summary: e.target.value }))}
        />
        <span className="baseline-summary__note">{t("baseline.editSummaryHint")}</span>
      </label>

      {ASSESSMENT_SECTION_KEYS.map((stepKey) => (
        <section key={stepKey} className="baseline-edit-form__section">
          <h4>{t(sectionTitleKey(stepKey))}</h4>
          <AssessmentSectionFields
            stepKey={stepKey}
            form={form}
            update={update}
            t={t}
            calculatedAge={calculatedAge}
            teamName={teamName}
            mode="edit"
          />
        </section>
      ))}

      {error && <p className="form-error">{error}</p>}

      <div className="assessment-actions">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t("initialAssessment.saving") : t("baseline.save")}
        </Button>
      </div>
    </form>
  )
}
