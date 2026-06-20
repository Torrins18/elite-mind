import { useTranslation } from "../i18n/LanguageContext"
import { SliderField } from "./ui/SliderField"

const BLOCKS = [
  {
    id: "performance",
    badgeKey: "eorBlockPerformanceBadge",
    titleKey: "eorBlockPerformanceTitle",
    fields: [
      { key: "performance_rating", labelKey: "eorPerformance", hintKey: "eorPerformanceHint" },
      { key: "involvement_rating", labelKey: "eorInvolvement", hintKey: "eorInvolvementHint" },
      { key: "effort_rating", labelKey: "eorEffort", hintKey: "eorEffortHint" },
    ],
  },
  {
    id: "body",
    badgeKey: "eorBlockBodyBadge",
    titleKey: "eorBlockBodyTitle",
    fields: [
      { key: "weekly_rest_quality", labelKey: "eorRestQuality", hintKey: "eorRestQualityHint" },
      { key: "weekly_energy", labelKey: "eorWeeklyEnergy", hintKey: "eorWeeklyEnergyHint" },
      { key: "physical_fatigue", labelKey: "eorPhysicalFatigue", hintKey: "eorPhysicalFatigueHint" },
      { key: "general_recovery", labelKey: "eorGeneralRecovery", hintKey: "eorGeneralRecoveryHint" },
    ],
  },
  {
    id: "mental",
    badgeKey: "eorBlockMentalBadge",
    titleKey: "eorBlockMentalTitle",
    fields: [
      { key: "confidence_rating", labelKey: "eorConfidence", hintKey: "eorConfidenceHint" },
      { key: "concentration_rating", labelKey: "eorConcentration", hintKey: "eorConcentrationHint" },
      { key: "motivation_rating", labelKey: "eorMotivation", hintKey: "eorMotivationHint" },
      {
        key: "pressure_management",
        labelKey: "eorPressureManagement",
        hintKey: "eorPressureManagementHint",
      },
    ],
  },
  {
    id: "environment",
    badgeKey: "eorBlockEnvironmentBadge",
    titleKey: "eorBlockEnvironmentTitle",
    fields: [
      {
        key: "teammate_communication",
        labelKey: "eorTeammateCommunication",
        hintKey: "eorTeammateCommunicationHint",
      },
      {
        key: "coach_communication",
        labelKey: "eorCoachCommunication",
        hintKey: "eorCoachCommunicationHint",
      },
      {
        key: "group_integration",
        labelKey: "eorGroupIntegration",
        hintKey: "eorGroupIntegrationHint",
      },
      { key: "role_clarity", labelKey: "eorRoleClarity", hintKey: "eorRoleClarityHint" },
    ],
  },
  {
    id: "life",
    badgeKey: "eorBlockLifeBadge",
    titleKey: "eorBlockLifeTitle",
    fields: [
      { key: "sport_life_balance", labelKey: "eorSportLifeBalance", hintKey: "eorSportLifeBalanceHint" },
      { key: "life_outside_sport", labelKey: "eorLifeOutsideSport", hintKey: "eorLifeOutsideSportHint" },
      {
        key: "personal_time_management",
        labelKey: "eorPersonalTimeManagement",
        hintKey: "eorPersonalTimeManagementHint",
      },
    ],
  },
]

const CONTACT_OPTIONS = ["no", "maybe", "yes"]

export function WeeklyEorForm({ form, onChange }) {
  const { t } = useTranslation()

  const update = (key, value) => onChange(key, value)

  return (
    <div className="weekly-eor-form">
      {BLOCKS.map((block) => (
        <section key={block.id} className="check-in-block check-in-block--weekly weekly-eor-block">
          <header className="check-in-block__header">
            <span className="check-in-block__badge check-in-block__badge--weekly">
              {t(`checkIn.${block.badgeKey}`)}
            </span>
            <h3>{t(`checkIn.${block.titleKey}`)}</h3>
          </header>

          {block.fields.map((field) => (
            <SliderField
              key={field.key}
              label={t(`checkIn.${field.labelKey}`)}
              hint={t(`checkIn.${field.hintKey}`)}
              value={form[field.key] ?? 5}
              onChange={(value) => update(field.key, value)}
              min={0}
              lowLabel={t("checkIn.ratingLow")}
              highLabel={t("checkIn.ratingHigh")}
            />
          ))}
        </section>
      ))}

      <section className="check-in-block check-in-block--weekly weekly-eor-block">
        <header className="check-in-block__header">
          <span className="check-in-block__badge check-in-block__badge--weekly">
            {t("checkIn.eorBlockOpenBadge")}
          </span>
          <h3>{t("checkIn.eorBlockOpenTitle")}</h3>
        </header>

        <label className="notes-field">
          <span>{t("checkIn.eorWentWell")}</span>
          <p className="notes-field__hint">{t("checkIn.eorWentWellHint")}</p>
          <textarea
            rows={3}
            placeholder={t("checkIn.eorWentWellPlaceholder")}
            value={form.weekly_went_well || ""}
            onChange={(e) => update("weekly_went_well", e.target.value)}
          />
        </label>
        <label className="notes-field">
          <span>{t("checkIn.eorMainDifficulty")}</span>
          <p className="notes-field__hint">{t("checkIn.eorMainDifficultyHint")}</p>
          <textarea
            rows={3}
            placeholder={t("checkIn.eorMainDifficultyPlaceholder")}
            value={form.weekly_main_difficulty || ""}
            onChange={(e) => update("weekly_main_difficulty", e.target.value)}
          />
        </label>
        <label className="notes-field">
          <span>{t("checkIn.eorNextGoal")}</span>
          <p className="notes-field__hint">{t("checkIn.eorNextGoalHint")}</p>
          <textarea
            rows={3}
            placeholder={t("checkIn.eorNextGoalPlaceholder")}
            value={form.next_goal || ""}
            onChange={(e) => update("next_goal", e.target.value)}
          />
        </label>
      </section>

      <section className="check-in-block check-in-block--weekly weekly-eor-block weekly-eor-block--key">
        <header className="check-in-block__header">
          <span className="check-in-block__badge check-in-block__badge--weekly">
            {t("checkIn.eorKeyQuestionBadge")}
          </span>
          <h3>{t("checkIn.eorPsychologistContact")}</h3>
          <p>{t("checkIn.eorPsychologistContactHint")}</p>
        </header>

        <div className="choice-group" role="radiogroup" aria-label={t("checkIn.eorPsychologistContact")}>
          {CONTACT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={form.psychologist_contact === option}
              className={
                form.psychologist_contact === option
                  ? "choice-group__btn choice-group__btn--active"
                  : "choice-group__btn"
              }
              onClick={() => update("psychologist_contact", option)}
            >
              {t(`checkIn.eorPsychologistContact_${option}`)}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
