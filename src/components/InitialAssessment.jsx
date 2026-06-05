import { useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { calculateAge } from "../lib/age"
import { Button } from "./ui/Button"
import { Card } from "./ui/Card"

const initialForm = {
  teamId: "",
  sportPosition: "",
  yearsCompeting: "",
  categoryLevel: "",
  livingWith: "",
  familySupport: "",
  studiesWork: "",
  balanceDifficulty: "",
  sleepHoursTypical: "",
  preEventSleep: "",
  troubleSleepingImportant: "",
  wakeRecovered: "",
  restPerformanceImpact: "",
  mealsPerDay: "",
  hydration: "",
  dailyEnergy: "5",
  caffeineUse: "",
  importantInjuries: "",
  hardestSportMoment: "",
  currentGoal: "",
  perceivedPressure: "5",
  currentConfidence: "5",
  coachRelationship: "5",
}

const frequencyOptions = ["never", "little", "quite", "very"]

const studiesWorkOptions = ["studyOnly", "workOnly", "studyAndWork", "neitherStudyWork"]

const balanceOptions = [
  "balanceVeryGood",
  "balanceGood",
  "balanceAcceptable",
  "balanceDifficult",
  "balanceVeryDifficult",
]

export function InitialAssessment({ profile, onCompleted }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ ...initialForm, teamId: profile?.team_id || "" })
  const [teams, setTeams] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const calculatedAge = calculateAge(profile?.date_of_birth)

  useEffect(() => {
    let isMounted = true

    const loadTeams = async () => {
      const { data, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .order("name")

      if (!isMounted) return

      if (teamsError) {
        setError(teamsError.message)
        return
      }

      setTeams(data || [])
    }

    loadTeams()

    return () => {
      isMounted = false
    }
  }, [])

  const steps = useMemo(
    () => [
      {
        key: "personal",
        title: t("initialAssessment.personal"),
        fields: ["calculatedAge", "teamId", "sportPosition", "yearsCompeting", "categoryLevel"],
      },
      {
        key: "context",
        title: t("initialAssessment.context"),
        fields: ["livingWith", "familySupport", "studiesWork", "balanceDifficulty"],
      },
      {
        key: "sleep",
        title: t("initialAssessment.sleep"),
        fields: [
          "sleepHoursTypical",
          "preEventSleep",
          "troubleSleepingImportant",
          "wakeRecovered",
          "restPerformanceImpact",
        ],
      },
      {
        key: "nutrition",
        title: t("initialAssessment.nutrition"),
        fields: ["mealsPerDay", "hydration", "dailyEnergy", "caffeineUse"],
      },
      {
        key: "sports",
        title: t("initialAssessment.sports"),
        fields: [
          "importantInjuries",
          "hardestSportMoment",
          "currentGoal",
          "perceivedPressure",
          "currentConfidence",
          "coachRelationship",
        ],
      },
    ],
    [t]
  )

  const current = steps[step]
  const progress = Math.round(((step + 1) / steps.length) * 100)

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const next = () => {
    setError("")
    setStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const back = () => {
    setError("")
    setStep((prev) => Math.max(prev - 1, 0))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError("")

    if (!form.teamId) {
      setError(t("initialAssessment.teamRequired"))
      return
    }

    setSaving(true)

    const submittedAt = new Date().toISOString()
    const { error: insertError } = await supabase.from("athlete_initial_assessments").insert([
      {
        athlete_id: profile.id,
        personal_info: {
          calculatedAge,
          ...pick(form, ["sportPosition", "yearsCompeting", "categoryLevel"]),
        },
        sleep_habits: pick(form, [
          "sleepHoursTypical",
          "preEventSleep",
          "troubleSleepingImportant",
          "wakeRecovered",
          "restPerformanceImpact",
        ]),
        nutrition_habits: pick(form, ["mealsPerDay", "hydration", "dailyEnergy", "caffeineUse"]),
        sports_background: pick(form, [
          "importantInjuries",
          "hardestSportMoment",
          "currentGoal",
          "perceivedPressure",
          "currentConfidence",
          "coachRelationship",
        ]),
        family_social_support: pick(form, ["livingWith", "familySupport", "studiesWork", "balanceDifficulty"]),
        submitted_at: submittedAt,
      },
    ])

    if (insertError) {
      setSaving(false)
      setError(insertError.message)
      return
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ initial_assessment_completed_at: submittedAt, team_id: form.teamId })
      .eq("id", profile.id)

    setSaving(false)

    if (profileError) {
      setError(profileError.message)
      return
    }

    onCompleted?.()
  }

  return (
    <Card
      title={t("initialAssessment.title")}
      subtitle={t("initialAssessment.subtitle")}
      className="assessment-card"
    >
      <form className="assessment-form" onSubmit={submit}>
        <div className="assessment-progress" aria-label={t("initialAssessment.progress")}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="assessment-steps">
          {steps.map((item, index) => (
            <button
              type="button"
              key={item.key}
              className={index === step ? "assessment-step active" : "assessment-step"}
              onClick={() => setStep(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <section className="assessment-section">
          <p className="assessment-section__eyebrow">
            {t("initialAssessment.stepLabel", { current: step + 1, total: steps.length })}
          </p>
          <h3>{current.title}</h3>
          <Fields
            stepKey={current.key}
            form={form}
            update={update}
            t={t}
            teams={teams}
            calculatedAge={calculatedAge}
          />
        </section>

        {error && <p className="form-error">{error}</p>}

        <div className="assessment-actions">
          <Button variant="ghost" onClick={back} disabled={step === 0 || saving}>
            {t("initialAssessment.back")}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next}>{t("initialAssessment.next")}</Button>
          ) : (
            <Button type="submit" disabled={saving}>
              {saving ? t("initialAssessment.saving") : t("initialAssessment.submit")}
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}

function Fields({ stepKey, form, update, t, teams, calculatedAge }) {
  if (stepKey === "personal") {
    return (
      <div className="assessment-grid">
        <ReadOnlyField label={t("initialAssessment.fields.calculatedAge")} value={calculatedAge ?? "-"} />
        <TeamField teams={teams} form={form} update={update} t={t} />
        <TextField id="sportPosition" form={form} update={update} t={t} />
        <TextField id="yearsCompeting" type="number" form={form} update={update} t={t} />
        <TextField id="categoryLevel" form={form} update={update} t={t} />
      </div>
    )
  }

  if (stepKey === "context") {
    return (
      <div className="assessment-grid">
        <TextField id="livingWith" form={form} update={update} t={t} />
        <SelectField id="familySupport" options={frequencyOptions} form={form} update={update} t={t} />
        <RadioField
          id="studiesWork"
          options={studiesWorkOptions}
          form={form}
          update={update}
          t={t}
        />
        <RadioField
          id="balanceDifficulty"
          options={balanceOptions}
          form={form}
          update={update}
          t={t}
        />
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
        <SelectField
          id="hydration"
          options={["low", "medium", "high"]}
          form={form}
          update={update}
          t={t}
        />
        <SliderField id="dailyEnergy" form={form} update={update} t={t} />
        <SelectField
          id="caffeineUse"
          options={["never", "sometimes", "often", "daily"]}
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
        <TextArea id="hardestSportMoment" form={form} update={update} t={t} />
        <TextArea id="currentGoal" form={form} update={update} t={t} />
        <SliderField id="perceivedPressure" form={form} update={update} t={t} />
        <SliderField id="currentConfidence" form={form} update={update} t={t} />
        <SliderField id="coachRelationship" form={form} update={update} t={t} />
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

function TeamField({ teams, form, update, t }) {
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

function TextField({ id, form, update, t, type = "text" }) {
  return (
    <label className="assessment-field">
      <span>{t(`initialAssessment.fields.${id}`)}</span>
      <input type={type} value={form[id]} onChange={(event) => update(id, event.target.value)} />
    </label>
  )
}

function TextArea({ id, form, update, t }) {
  return (
    <label className="assessment-field assessment-field--wide">
      <span>{t(`initialAssessment.fields.${id}`)}</span>
      <textarea value={form[id]} onChange={(event) => update(id, event.target.value)} />
    </label>
  )
}

function SelectField({ id, options, form, update, t }) {
  return (
    <label className="assessment-field">
      <span>{t(`initialAssessment.fields.${id}`)}</span>
      <select value={form[id]} onChange={(event) => update(id, event.target.value)}>
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
        {t(`initialAssessment.fields.${id}`)}: <strong>{form[id]}</strong>
      </span>
      <input
        type="range"
        min="1"
        max="10"
        value={form[id]}
        onChange={(event) => update(id, event.target.value)}
      />
    </label>
  )
}

function pick(source, keys) {
  return Object.fromEntries(keys.map((key) => [key, source[key]]))
}
