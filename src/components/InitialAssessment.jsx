import { useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { calculateAge } from "../lib/age"
import { buildBaselineSummary, formToAssessmentPayload } from "../lib/baseline"
import { Button } from "./ui/Button"
import { Card } from "./ui/Card"
import { AssessmentSectionFields } from "./assessment/AssessmentSectionFields"

const initialForm = {
  teamId: "",
  sportPosition: "",
  yearsCompeting: "",
  categoryLevel: "",
  gender: "",
  weeklyTrainingSessions: "",
  weeklyCompetitions: "",
  livingWith: "",
  familySupport: "",
  studiesWork: "",
  balanceDifficulty: "",
  travelTimeToTraining: "",
  sleepHoursTypical: "",
  preEventSleep: "",
  troubleSleepingImportant: "",
  wakeRecovered: "",
  restPerformanceImpact: "",
  mealsPerDay: "",
  hydration: "",
  dailyEnergy: "5",
  caffeineUse: "",
  nutritionRating: "5",
  eatsBeforeTraining: "",
  recoversNutritionally: "",
  followsNutritionPlan: "",
  importantInjuries: "",
  hardestSportMoment: "",
  majorSetbacks: "",
  clubChanges: "",
  bestAchievement: "",
  currentGoal: "",
  perceivedPressure: "5",
  currentConfidence: "5",
  coachRelationship: "5",
  greatestStrength: "",
  aspectToImprove: "",
  preCompetitionWorry: "",
  performanceHelps: "",
  mistakeReaction: "",
  poorPerformanceThoughts: "",
  mostConfidentWhen: "",
  leastConfidentWhen: "",
  seasonObjective: "",
  personalObjective: "",
  teamObjective: "",
  seasonSuccess: "",
}

export function InitialAssessment({ profile, onCompleted }) {
  const { t, lang } = useTranslation()
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
        .is("deleted_at", null)
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

  const teamLocked = Boolean(profile?.team_id)

  const steps = useMemo(
    () => [
      {
        key: "personal",
        title: t("initialAssessment.personal"),
        fields: ["calculatedAge", "teamId", "gender", "sportPosition", "yearsCompeting", "categoryLevel", "weeklyTrainingSessions", "weeklyCompetitions"],
      },
      {
        key: "context",
        title: t("initialAssessment.context"),
        fields: ["livingWith", "familySupport", "studiesWork", "balanceDifficulty", "travelTimeToTraining"],
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
        fields: ["mealsPerDay", "hydration", "dailyEnergy", "caffeineUse", "nutritionRating", "eatsBeforeTraining", "recoversNutritionally", "followsNutritionPlan"],
      },
      {
        key: "sports",
        title: t("initialAssessment.sports"),
        fields: [
          "importantInjuries",
          "majorSetbacks",
          "clubChanges",
          "bestAchievement",
          "hardestSportMoment",
          "perceivedPressure",
          "currentConfidence",
          "coachRelationship",
        ],
      },
      {
        key: "mental",
        title: t("initialAssessment.mental"),
        fields: [
          "greatestStrength",
          "aspectToImprove",
          "preCompetitionWorry",
          "performanceHelps",
          "mistakeReaction",
          "poorPerformanceThoughts",
          "mostConfidentWhen",
          "leastConfidentWhen",
        ],
      },
      {
        key: "objectives",
        title: t("initialAssessment.objectives"),
        fields: ["seasonObjective", "personalObjective", "teamObjective", "seasonSuccess"],
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
    const payload = formToAssessmentPayload(form, calculatedAge)
    const baselineSummary = buildBaselineSummary(
      {
        personal_info: payload.personal_info,
        family_social_support: payload.family_social_support,
        sleep_habits: payload.sleep_habits,
        nutrition_habits: payload.nutrition_habits,
        sports_background: payload.sports_background,
        mental_profile: payload.mental_profile,
        objectives: payload.objectives,
      },
      lang
    )

    const { error: insertError } = await supabase.from("athlete_initial_assessments").insert([
      {
        athlete_id: profile.id,
        ...payload,
        baseline_summary: baselineSummary,
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
          <AssessmentSectionFields
            stepKey={current.key}
            form={form}
            update={update}
            t={t}
            teams={teams}
            calculatedAge={calculatedAge}
            teamLocked={teamLocked}
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
