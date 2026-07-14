import { useState } from "react"
import { supabase } from "../../supabase"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { todayISO } from "../../lib/dates"

const GOAL_EMPTY = { title: "", description: "", target_date: "" }
const STEP_EMPTY = { step_kind: "action", title: "", description: "", resource_id: "", follow_up_date: "" }

const STEP_KINDS = ["action", "exercise", "followup"]
const STEP_STATUSES = ["pending", "in_progress", "done"]

export function AthleteFilePlan({ athleteId, psychologistId, goals, resources, onChange, t }) {
  const [goalForm, setGoalForm] = useState(GOAL_EMPTY)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [expandedGoalId, setExpandedGoalId] = useState(null)
  const [stepForms, setStepForms] = useState({})
  const [outcomeDraft, setOutcomeDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const resetGoalForm = () => {
    setGoalForm(GOAL_EMPTY)
    setEditingGoalId(null)
    setError("")
  }

  const saveGoal = async (event) => {
    event.preventDefault()
    if (!goalForm.title.trim()) {
      setError(t("athleteFile.plan.goalTitleRequired"))
      return
    }

    setSaving(true)
    setError("")
    const now = new Date().toISOString()
    const payload = {
      athlete_id: athleteId,
      psychologist_id: psychologistId,
      title: goalForm.title.trim(),
      description: goalForm.description.trim(),
      target_date: goalForm.target_date || null,
      updated_at: now,
    }

    const query = editingGoalId
      ? supabase.from("athlete_goals").update(payload).eq("id", editingGoalId)
      : supabase.from("athlete_goals").insert([{ ...payload, status: "active" }])

    const { error: err } = await query
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }

    resetGoalForm()
    onChange?.()
  }

  const startEditGoal = (goal) => {
    setEditingGoalId(goal.id)
    setGoalForm({
      title: goal.title,
      description: goal.description || "",
      target_date: goal.target_date || "",
    })
    setExpandedGoalId(goal.id)
  }

  const updateGoalStatus = async (goalId, status, outcome = "") => {
    const payload = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === "achieved") payload.outcome = outcome

    const { error: err } = await supabase.from("athlete_goals").update(payload).eq("id", goalId)
    if (err) {
      setError(err.message)
      return
    }
    onChange?.()
  }

  const removeGoal = async (goalId) => {
    if (!confirm(t("athleteFile.plan.goalDeleteConfirm"))) return
    const { error: err } = await supabase.from("athlete_goals").delete().eq("id", goalId)
    if (err) setError(err.message)
    else onChange?.()
  }

  const getStepForm = (goalId) => stepForms[goalId] || STEP_EMPTY

  const setStepForm = (goalId, patch) => {
    setStepForms((prev) => ({
      ...prev,
      [goalId]: { ...getStepForm(goalId), ...patch },
    }))
  }

  const addStep = async (goalId, event) => {
    event.preventDefault()
    const form = getStepForm(goalId)
    if (!form.title.trim()) return

    const steps = goals.find((g) => g.id === goalId)?.athlete_goal_steps || []
    const { error: err } = await supabase.from("athlete_goal_steps").insert([
      {
        goal_id: goalId,
        step_kind: form.step_kind,
        title: form.title.trim(),
        description: form.description.trim(),
        resource_id: form.resource_id || null,
        follow_up_date: form.follow_up_date || null,
        sort_order: steps.length,
        status: "pending",
      },
    ])

    if (err) {
      setError(err.message)
      return
    }

    setStepForms((prev) => ({ ...prev, [goalId]: STEP_EMPTY }))
    onChange?.()
  }

  const updateStepStatus = async (stepId, status) => {
    const { error: err } = await supabase
      .from("athlete_goal_steps")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", stepId)
    if (!err) onChange?.()
  }

  const removeStep = async (stepId) => {
    const { error: err } = await supabase.from("athlete_goal_steps").delete().eq("id", stepId)
    if (!err) onChange?.()
  }

  const sortedGoals = [...goals].sort((a, b) => {
    const order = { active: 0, paused: 1, achieved: 2, cancelled: 3 }
    return (order[a.status] ?? 9) - (order[b.status] ?? 9)
  })

  return (
    <div className="athlete-file-plan">
      <form className="athlete-file-plan__goal-form" onSubmit={saveGoal}>
        <h3>{editingGoalId ? t("athleteFile.plan.editGoal") : t("athleteFile.plan.newGoal")}</h3>
        <label className="field">
          <span>{t("athleteFile.plan.goalTitle")}</span>
          <input
            value={goalForm.title}
            onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))}
            placeholder={t("athleteFile.plan.goalTitlePlaceholder")}
            required
          />
        </label>
        <label className="field">
          <span>{t("athleteFile.plan.goalDescription")}</span>
          <textarea
            rows={2}
            value={goalForm.description}
            onChange={(e) => setGoalForm((p) => ({ ...p, description: e.target.value }))}
          />
        </label>
        <label className="field">
          <span>{t("athleteFile.plan.targetDate")}</span>
          <input
            type="date"
            value={goalForm.target_date}
            onChange={(e) => setGoalForm((p) => ({ ...p, target_date: e.target.value }))}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="athlete-file-plan__actions">
          <Button type="submit" disabled={saving}>
            {saving ? t("athleteFile.saving") : editingGoalId ? t("athleteFile.save") : t("athleteFile.plan.addGoal")}
          </Button>
          {editingGoalId && (
            <Button type="button" variant="ghost" onClick={resetGoalForm}>
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </form>

      {sortedGoals.length === 0 ? (
        <p className="empty-state">{t("athleteFile.plan.noGoals")}</p>
      ) : (
        <ul className="athlete-file-plan__goals">
          {sortedGoals.map((goal) => {
            const steps = [...(goal.athlete_goal_steps || [])].sort(
              (a, b) => a.sort_order - b.sort_order
            )
            const stepForm = getStepForm(goal.id)
            const expanded = expandedGoalId === goal.id

            return (
              <li key={goal.id} className="athlete-file-plan__goal">
                <header className="athlete-file-plan__goal-header">
                  <button
                    type="button"
                    className="athlete-file-plan__goal-toggle"
                    onClick={() => setExpandedGoalId(expanded ? null : goal.id)}
                  >
                    <strong>{goal.title}</strong>
                    <Badge variant={goalStatusVariant(goal.status)}>
                      {t(`athleteFile.plan.goalStatus.${goal.status}`)}
                    </Badge>
                  </button>
                  <div className="athlete-file-plan__goal-meta">
                    {goal.target_date && (
                      <span>{t("athleteFile.plan.targetDate")}: {goal.target_date}</span>
                    )}
                    <Button variant="ghost" onClick={() => startEditGoal(goal)}>
                      {t("athleteFile.edit")}
                    </Button>
                    <Button variant="ghost" className="btn--danger-text" onClick={() => removeGoal(goal.id)}>
                      {t("athleteFile.delete")}
                    </Button>
                  </div>
                </header>

                {goal.description && <p className="athlete-file-plan__goal-desc">{goal.description}</p>}
                {goal.outcome && (
                  <p className="athlete-file-plan__outcome">
                    <em>{t("athleteFile.plan.outcome")}:</em> {goal.outcome}
                  </p>
                )}

                {expanded && (
                  <div className="athlete-file-plan__goal-body">
                    {goal.status === "active" && (
                      <div className="athlete-file-plan__status-actions">
                        <Button variant="ghost" onClick={() => updateGoalStatus(goal.id, "paused")}>
                          {t("athleteFile.plan.pauseGoal")}
                        </Button>
                        <div className="athlete-file-plan__achieve">
                          <input
                            value={outcomeDraft[goal.id] || ""}
                            onChange={(e) =>
                              setOutcomeDraft((p) => ({ ...p, [goal.id]: e.target.value }))
                            }
                            placeholder={t("athleteFile.plan.outcomePlaceholder")}
                          />
                          <Button
                            variant="ghost"
                            onClick={() =>
                              updateGoalStatus(goal.id, "achieved", outcomeDraft[goal.id] || "")
                            }
                          >
                            {t("athleteFile.plan.markAchieved")}
                          </Button>
                        </div>
                      </div>
                    )}
                    {goal.status === "paused" && (
                      <Button variant="ghost" onClick={() => updateGoalStatus(goal.id, "active")}>
                        {t("athleteFile.plan.resumeGoal")}
                      </Button>
                    )}

                    <h4>{t("athleteFile.plan.stepsTitle")}</h4>
                    {steps.length === 0 ? (
                      <p className="empty-state">{t("athleteFile.plan.noSteps")}</p>
                    ) : (
                      <ol className="athlete-file-plan__steps">
                        {steps.map((step) => (
                          <li key={step.id} className="athlete-file-plan__step">
                            <div className="athlete-file-plan__step-head">
                              <Badge variant="default">
                                {t(`athleteFile.plan.stepKind.${step.step_kind}`)}
                              </Badge>
                              <strong>{step.title}</strong>
                              <Badge variant={stepStatusVariant(step.status)}>
                                {t(`athleteFile.plan.stepStatus.${step.status}`)}
                              </Badge>
                            </div>
                            {step.description && <p>{step.description}</p>}
                            {step.psychologist_resources && (
                              <p className="athlete-file-plan__resource-link">
                                📎 {step.psychologist_resources.title} (
                                {t(`resources.type.${step.psychologist_resources.resource_type}`)})
                                {step.psychologist_resources.url && (
                                  <>
                                    {" · "}
                                    <a href={step.psychologist_resources.url} target="_blank" rel="noreferrer">
                                      {t("athleteFile.plan.openResource")}
                                    </a>
                                  </>
                                )}
                              </p>
                            )}
                            {step.follow_up_date && (
                              <p className="athlete-file-plan__followup-date">
                                {t("athleteFile.plan.followUpDate")}: {step.follow_up_date}
                              </p>
                            )}
                            <div className="athlete-file-plan__step-actions">
                              {STEP_STATUSES.filter((s) => s !== step.status).map((status) => (
                                <Button
                                  key={status}
                                  variant="ghost"
                                  onClick={() => updateStepStatus(step.id, status)}
                                >
                                  {t(`athleteFile.plan.stepStatus.${status}`)}
                                </Button>
                              ))}
                              <Button
                                variant="ghost"
                                className="btn--danger-text"
                                onClick={() => removeStep(step.id)}
                              >
                                {t("athleteFile.delete")}
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}

                    {(goal.status === "active" || goal.status === "paused") && (
                      <form className="athlete-file-plan__step-form" onSubmit={(e) => addStep(goal.id, e)}>
                        <h5>{t("athleteFile.plan.addStep")}</h5>
                        <label className="field">
                          <span>{t("athleteFile.plan.stepKindLabel")}</span>
                          <select
                            value={stepForm.step_kind}
                            onChange={(e) => setStepForm(goal.id, { step_kind: e.target.value })}
                          >
                            {STEP_KINDS.map((kind) => (
                              <option key={kind} value={kind}>
                                {t(`athleteFile.plan.stepKind.${kind}`)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>{t("athleteFile.plan.stepTitle")}</span>
                          <input
                            value={stepForm.title}
                            onChange={(e) => setStepForm(goal.id, { title: e.target.value })}
                            required
                          />
                        </label>
                        <label className="field">
                          <span>{t("athleteFile.plan.stepDescription")}</span>
                          <textarea
                            rows={2}
                            value={stepForm.description}
                            onChange={(e) => setStepForm(goal.id, { description: e.target.value })}
                          />
                        </label>
                        {stepForm.step_kind === "exercise" && (
                          <label className="field">
                            <span>{t("athleteFile.plan.linkResource")}</span>
                            <select
                              value={stepForm.resource_id}
                              onChange={(e) => setStepForm(goal.id, { resource_id: e.target.value })}
                            >
                              <option value="">{t("athleteFile.plan.noResource")}</option>
                              {resources.map((resource) => (
                                <option key={resource.id} value={resource.id}>
                                  {resource.title}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        {stepForm.step_kind === "followup" && (
                          <label className="field">
                            <span>{t("athleteFile.plan.followUpDate")}</span>
                            <input
                              type="date"
                              value={stepForm.follow_up_date || todayISO()}
                              onChange={(e) => setStepForm(goal.id, { follow_up_date: e.target.value })}
                            />
                          </label>
                        )}
                        <Button type="submit">{t("athleteFile.plan.addStep")}</Button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function goalStatusVariant(status) {
  if (status === "active") return "low"
  if (status === "achieved") return "default"
  if (status === "paused") return "medium"
  return "high"
}

function stepStatusVariant(status) {
  if (status === "done") return "low"
  if (status === "in_progress") return "medium"
  return "default"
}
