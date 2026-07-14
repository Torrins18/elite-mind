export const frequencyOptions = ["never", "little", "quite", "very"]

export const studiesWorkOptions = ["studyOnly", "workOnly", "studyAndWork", "neitherStudyWork"]

export const balanceOptions = [
  "balanceVeryGood",
  "balanceGood",
  "balanceAcceptable",
  "balanceDifficult",
  "balanceVeryDifficult",
]

export const ASSESSMENT_SECTION_KEYS = [
  "personal",
  "context",
  "sleep",
  "nutrition",
  "sports",
  "mental",
  "objectives",
]

export function AssessmentSectionFields({
  stepKey,
  form,
  update,
  t,
  teams = [],
  calculatedAge,
  teamLocked = false,
  teamName = "",
  mode = "wizard",
}) {
  if (stepKey === "personal") {
    return (
      <div className="assessment-grid">
        <ReadOnlyField label={t("initialAssessment.fields.calculatedAge")} value={calculatedAge ?? "-"} />
        {mode === "edit" ? (
          teamName ? (
            <ReadOnlyField label={t("initialAssessment.fields.teamId")} value={teamName} />
          ) : null
        ) : (
          <TeamField teams={teams} form={form} update={update} t={t} locked={teamLocked} />
        )}
        <TextField id="gender" form={form} update={update} t={t} optional />
        <TextField id="sportPosition" form={form} update={update} t={t} />
        <TextField id="yearsCompeting" type="number" form={form} update={update} t={t} />
        <TextField id="categoryLevel" form={form} update={update} t={t} />
        <TextField id="weeklyTrainingSessions" type="number" form={form} update={update} t={t} />
        <TextField id="weeklyCompetitions" type="number" form={form} update={update} t={t} />
      </div>
    )
  }

  if (stepKey === "context") {
    return (
      <div className="assessment-grid">
        <TextField id="livingWith" form={form} update={update} t={t} />
        <SelectField id="familySupport" options={frequencyOptions} form={form} update={update} t={t} />
        <RadioField id="studiesWork" options={studiesWorkOptions} form={form} update={update} t={t} />
        <RadioField id="balanceDifficulty" options={balanceOptions} form={form} update={update} t={t} />
        <TextField id="travelTimeToTraining" form={form} update={update} t={t} />
      </div>
    )
  }

  if (stepKey === "sleep") {
    return (
      <div className="assessment-grid">
        <SelectField
          id="sleepHoursTypical"
          options={["lessThan5", "fiveSix", "sixSeven", "sevenEight", "moreThan8"]}
          form={form}
          update={update}
          t={t}
        />
        <SelectField
          id="preEventSleep"
          options={["muchLess", "slightlyLess", "same", "better"]}
          form={form}
          update={update}
          t={t}
        />
        <SelectField
          id="troubleSleepingImportant"
          options={frequencyOptions}
          form={form}
          update={update}
          t={t}
        />
        <SelectField id="wakeRecovered" options={frequencyOptions} form={form} update={update} t={t} />
        <SelectField
          id="restPerformanceImpact"
          options={["little", "quite", "very"]}
          form={form}
          update={update}
          t={t}
        />
      </div>
    )
  }

  if (stepKey === "nutrition") {
    return (
      <div className="assessment-grid">
        <TextField id="mealsPerDay" type="number" form={form} update={update} t={t} />
        <SelectField id="hydration" options={["low", "medium", "high"]} form={form} update={update} t={t} />
        <SliderField id="dailyEnergy" form={form} update={update} t={t} />
        <SelectField
          id="caffeineUse"
          options={["never", "sometimes", "often", "daily"]}
          form={form}
          update={update}
          t={t}
        />
        <SliderField id="nutritionRating" form={form} update={update} t={t} />
        <SelectField id="eatsBeforeTraining" options={frequencyOptions} form={form} update={update} t={t} />
        <SelectField id="recoversNutritionally" options={frequencyOptions} form={form} update={update} t={t} />
        <SelectField
          id="followsNutritionPlan"
          options={["yes", "no", "sometimes"]}
          form={form}
          update={update}
          t={t}
        />
      </div>
    )
  }

  if (stepKey === "sports") {
    return (
      <div className="assessment-grid">
        <TextArea id="importantInjuries" form={form} update={update} t={t} />
        <TextArea id="majorSetbacks" form={form} update={update} t={t} />
        <TextArea id="clubChanges" form={form} update={update} t={t} />
        <TextArea id="bestAchievement" form={form} update={update} t={t} />
        <TextArea id="hardestSportMoment" form={form} update={update} t={t} />
        <TextArea id="currentGoal" form={form} update={update} t={t} />
        <SliderField id="perceivedPressure" form={form} update={update} t={t} />
        <SliderField id="currentConfidence" form={form} update={update} t={t} />
        <SliderField id="coachRelationship" form={form} update={update} t={t} />
      </div>
    )
  }

  if (stepKey === "mental") {
    return (
      <div className="assessment-grid">
        <TextArea id="greatestStrength" form={form} update={update} t={t} />
        <TextArea id="aspectToImprove" form={form} update={update} t={t} />
        <TextArea id="preCompetitionWorry" form={form} update={update} t={t} />
        <TextArea id="performanceHelps" form={form} update={update} t={t} />
        <TextArea id="mistakeReaction" form={form} update={update} t={t} />
        <TextArea id="poorPerformanceThoughts" form={form} update={update} t={t} />
        <TextArea id="mostConfidentWhen" form={form} update={update} t={t} />
        <TextArea id="leastConfidentWhen" form={form} update={update} t={t} />
      </div>
    )
  }

  if (stepKey === "objectives") {
    return (
      <div className="assessment-grid">
        <TextArea id="seasonObjective" form={form} update={update} t={t} />
        <TextArea id="personalObjective" form={form} update={update} t={t} />
        <TextArea id="teamObjective" form={form} update={update} t={t} />
        <TextArea id="seasonSuccess" form={form} update={update} t={t} />
      </div>
    )
  }

  return null
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="assessment-readonly">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function TeamField({ teams, form, update, t, locked }) {
  const name = teams.find((team) => team.id === form.teamId)?.name

  if (locked && form.teamId) {
    return (
      <ReadOnlyField
        label={t("initialAssessment.fields.teamId")}
        value={name || t("initialAssessment.teamAssigned")}
      />
    )
  }

  return (
    <label className="assessment-field">
      <span>{t("initialAssessment.fields.teamId")}</span>
      <select value={form.teamId} onChange={(event) => update("teamId", event.target.value)}>
        <option value="">{t("initialAssessment.choose")}</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextField({ id, form, update, t, type = "text", optional = false }) {
  return (
    <label className="assessment-field">
      <span>
        {t(`initialAssessment.fields.${id}`)}
        {optional ? ` (${t("initialAssessment.optional")})` : ""}
      </span>
      <input type={type} value={form[id] || ""} onChange={(event) => update(id, event.target.value)} />
    </label>
  )
}

function TextArea({ id, form, update, t }) {
  return (
    <label className="assessment-field assessment-field--wide">
      <span>{t(`initialAssessment.fields.${id}`)}</span>
      <textarea value={form[id] || ""} onChange={(event) => update(id, event.target.value)} />
    </label>
  )
}

function SelectField({ id, options, form, update, t }) {
  return (
    <label className="assessment-field">
      <span>{t(`initialAssessment.fields.${id}`)}</span>
      <select value={form[id] || ""} onChange={(event) => update(id, event.target.value)}>
        <option value="">{t("initialAssessment.choose")}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {t(`initialAssessment.options.${option}`)}
          </option>
        ))}
      </select>
    </label>
  )
}

function RadioField({ id, options, form, update, t }) {
  return (
    <fieldset className="assessment-field assessment-field--wide assessment-radio">
      <legend>{t(`initialAssessment.fields.${id}`)}</legend>
      <div className="assessment-radio__options">
        {options.map((option) => (
          <label key={option} className="assessment-radio__option">
            <input
              type="radio"
              name={id}
              value={option}
              checked={form[id] === option}
              onChange={() => update(id, option)}
            />
            <span>{t(`initialAssessment.options.${option}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function SliderField({ id, form, update, t }) {
  return (
    <label className="assessment-field assessment-field--wide">
      <span>
        {t(`initialAssessment.fields.${id}`)}: <strong>{form[id] || "5"}</strong>
      </span>
      <input
        type="range"
        min="1"
        max="10"
        value={form[id] || "5"}
        onChange={(event) => update(id, event.target.value)}
      />
    </label>
  )
}

export function sectionTitleKey(stepKey) {
  if (stepKey === "context") return "initialAssessment.context"
  if (stepKey === "mental") return "initialAssessment.mental"
  if (stepKey === "objectives") return "initialAssessment.objectives"
  return `initialAssessment.${stepKey}`
}
