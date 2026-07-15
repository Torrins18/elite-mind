import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../../supabase"
import { useTranslation } from "../../i18n/LanguageContext"
import { buildAthleteJoinLink } from "../../lib/invites"
import {
  buildExecutiveSummary,
  buildTodayPriorities,
  getGreetingKey,
} from "../../lib/clinicalCommandCenter"
import {
  buildTeamClinicalOverview,
  getMostChangedTeam,
  sortTeamsByClinicalPriority,
} from "../../lib/teamClinicalOverview"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"
import { TeamClinicalCard } from "./TeamClinicalCard"

function ExecutiveSummary({ summary, greetingKey, t }) {
  return (
    <header className="clinical-command__executive">
      <h1 className="clinical-command__greeting">
        {t(`command.greeting.${greetingKey}`, { name: summary.firstName })}
      </h1>
      <p className="clinical-command__today">{t("command.todayLabel")}</p>
      <div className="clinical-command__stats">
        <div
          className={`clinical-command__stat${summary.priorityAlerts ? " clinical-command__stat--critical" : " clinical-command__stat--muted"}`}
        >
          <span className="clinical-command__stat-icon">🔴</span>
          <span className="clinical-command__stat-value">{summary.priorityAlerts}</span>
          <span className="clinical-command__stat-label">{t("command.statPriorityAlerts")}</span>
        </div>
        <div
          className={`clinical-command__stat${summary.appointments ? " clinical-command__stat--watch" : " clinical-command__stat--muted"}`}
        >
          <span className="clinical-command__stat-icon">📅</span>
          <span className="clinical-command__stat-value">{summary.appointments}</span>
          <span className="clinical-command__stat-label">{t("command.statAppointments")}</span>
        </div>
        <div
          className={`clinical-command__stat${summary.messages ? " clinical-command__stat--watch" : " clinical-command__stat--muted"}`}
        >
          <span className="clinical-command__stat-icon">📩</span>
          <span className="clinical-command__stat-value">{summary.messages}</span>
          <span className="clinical-command__stat-label">{t("command.statMessages")}</span>
        </div>
        <div className="clinical-command__stat">
          <span className="clinical-command__stat-icon">👥</span>
          <span className="clinical-command__stat-value">{summary.activeAthletes}</span>
          <span className="clinical-command__stat-label">{t("command.statAthletes")}</span>
        </div>
        <div className="clinical-command__stat clinical-command__stat--compliance">
          <span className="clinical-command__stat-icon">📋</span>
          <span className="clinical-command__stat-value">{summary.compliancePct}%</span>
          <span className="clinical-command__stat-label">{t("command.statCompliance")}</span>
        </div>
      </div>
    </header>
  )
}

function TodayPriorities({ items, t, onAction }) {
  if (!items.length) return null

  return (
    <section className="clinical-command__priorities">
      <h2 className="clinical-command__section-title">{t("command.prioritiesTitle")}</h2>
      <ul className="clinical-command__priority-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`clinical-command__priority clinical-command__priority--${item.tone}`}
              onClick={() => item.action && onAction(item.action)}
              disabled={!item.action}
            >
              {t(`command.priority.${item.key}`, item.params)}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ClinicalCommandCenter({
  profile,
  teams,
  athletes = [],
  checkIns = [],
  alerts = [],
  appointmentRequests = [],
  psychologistMessages = [],
  onOpenTeam,
  onOpenAthlete,
  onTeamsChanged,
  onNotify,
}) {
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)
  const [renameTeamId, setRenameTeamId] = useState(null)
  const [newTeamName, setNewTeamName] = useState("")
  const [renameTeamName, setRenameTeamName] = useState("")
  const [copiedTeamId, setCopiedTeamId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const greetingKey = getGreetingKey()
  const teamOverviews = useMemo(() => {
    const overviews = buildTeamClinicalOverview(teams, athletes, checkIns, alerts)
    return sortTeamsByClinicalPriority(overviews)
  }, [teams, athletes, checkIns, alerts])

  const mostChangedTeam = useMemo(() => getMostChangedTeam(teamOverviews), [teamOverviews])

  const executiveSummary = useMemo(
    () =>
      buildExecutiveSummary({
        profile,
        teamOverviews,
        alerts,
        appointmentRequests,
        psychologistMessages,
        athletes,
        teams,
      }),
    [profile, teamOverviews, alerts, appointmentRequests, psychologistMessages, athletes, teams]
  )

  const priorities = useMemo(
    () =>
      buildTodayPriorities({
        teamOverviews,
        alerts,
        appointmentRequests,
        psychologistMessages,
        mostChangedTeam,
      }),
    [teamOverviews, alerts, appointmentRequests, psychologistMessages, mostChangedTeam]
  )

  useEffect(() => {
    if (!copiedTeamId) return undefined
    const timer = window.setTimeout(() => setCopiedTeamId(null), 2000)
    return () => window.clearTimeout(timer)
  }, [copiedTeamId])

  const handlePriorityAction = useCallback(
    (action) => {
      if (action.type === "team") onOpenTeam?.(action.id)
      if (action.type === "athlete") onOpenAthlete?.(action.id)
    },
    [onOpenTeam, onOpenAthlete]
  )

  const createTeam = async (name) => {
    const { error } = await supabase.from("teams").insert([{ name }])
    if (error) {
      onNotify?.(error.message)
      return false
    }
    onNotify?.(t("teams.created"))
    await onTeamsChanged?.()
    return true
  }

  const renameTeam = async (teamId, name) => {
    const { error } = await supabase.from("teams").update({ name }).eq("id", teamId)
    if (error) {
      onNotify?.(error.message)
      return false
    }
    onNotify?.(t("teams.updated"))
    await onTeamsChanged?.()
    return true
  }

  const deleteTeam = async (teamId) => {
    if (!confirm(t("teams.deleteConfirm"))) return false
    const { error } = await supabase
      .from("teams")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", teamId)
    if (error) {
      onNotify?.(error.message)
      return false
    }
    onNotify?.(t("teams.deleted"))
    await onTeamsChanged?.()
    return true
  }

  const openRename = (teamId) => {
    const team = teams.find((row) => row.id === teamId)
    if (!team) return
    setRenameTeamId(teamId)
    setRenameTeamName(team.name)
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    const name = newTeamName.trim()
    if (!name) return
    setSubmitting(true)
    const ok = await createTeam(name)
    setSubmitting(false)
    if (ok) {
      setNewTeamName("")
      setCreateOpen(false)
    }
  }

  const handleRename = async (event) => {
    event.preventDefault()
    const name = renameTeamName.trim()
    if (!name || !renameTeamId) return
    setSubmitting(true)
    const ok = await renameTeam(renameTeamId, name)
    setSubmitting(false)
    if (ok) {
      setRenameTeamId(null)
      setRenameTeamName("")
    }
  }

  const copyInvitation = async (team) => {
    if (!team.join_token) return
    await navigator.clipboard.writeText(buildAthleteJoinLink(team.join_token))
    setCopiedTeamId(team.id)
    onNotify?.(t("teams.invitationCopied"))
  }

  return (
    <div className="clinical-command">
      <ExecutiveSummary summary={executiveSummary} greetingKey={greetingKey} t={t} />
      <TodayPriorities items={priorities} t={t} onAction={handlePriorityAction} />

      <section className="clinical-command__teams">
        <header className="clinical-command__teams-header">
          <h2 className="clinical-command__section-title">{t("command.teamsTitle")}</h2>
          <Button variant="ghost" className="clinical-command__new-team" onClick={() => setCreateOpen(true)}>
            {t("teams.newTeamShort")}
          </Button>
        </header>

        {teamOverviews.length === 0 ? (
          <p className="empty-state">{t("teams.emptyTeams")}</p>
        ) : (
          <div className="clinical-command__team-grid">
            {teamOverviews.map((overview) => (
              <TeamClinicalCard
                key={overview.team.id}
                overview={overview}
                copiedTeamId={copiedTeamId}
                onViewTeam={onOpenTeam}
                onCopyInvitation={copyInvitation}
                onRename={openRename}
                onDelete={deleteTeam}
              />
            ))}
          </div>
        )}
      </section>

      <Modal title={t("teams.createModalTitle")} open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="team-management__form" onSubmit={handleCreate}>
          <input
            value={newTeamName}
            onChange={(event) => setNewTeamName(event.target.value)}
            placeholder={t("teams.newPlaceholder")}
            autoFocus
          />
          <div className="team-management__form-actions">
            <Button type="submit" disabled={submitting || !newTeamName.trim()}>
              {t("teams.create")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title={t("teams.renameModalTitle")}
        open={Boolean(renameTeamId)}
        onClose={() => setRenameTeamId(null)}
      >
        <form className="team-management__form" onSubmit={handleRename}>
          <input
            value={renameTeamName}
            onChange={(event) => setRenameTeamName(event.target.value)}
            placeholder={t("teams.editPlaceholder")}
            autoFocus
          />
          <div className="team-management__form-actions">
            <Button type="submit" disabled={submitting || !renameTeamName.trim()}>
              {t("teams.save")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRenameTeamId(null)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
