import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "../../i18n/LanguageContext"
import { buildAthleteJoinLink } from "../../lib/invites"
import {
  buildTeamClinicalOverview,
  sortTeamsByClinicalPriority,
} from "../../lib/teamClinicalOverview"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"

const STATUS_CLASS = {
  stable: "team-card--stable",
  watch: "team-card--watch",
  observation: "team-card--observation",
  critical: "team-card--critical",
  unknown: "team-card--unknown",
}

function formatScore(value) {
  if (value == null) return "—"
  return Number(value).toFixed(1)
}

function MetricRow({ icon, label, metric }) {
  return (
    <div className="team-card__metric">
      <span className="team-card__metric-label">
        {icon} {label}
      </span>
      <span className="team-card__metric-dots" aria-hidden="true" />
      <span className={`team-card__metric-value team-card__metric-value--${metric.level}`}>
        {formatScore(metric.value)}
      </span>
    </div>
  )
}

function TeamCard({
  overview,
  copiedTeamId,
  onViewTeam,
  onCopyInvitation,
  onRename,
  onDelete,
}) {
  const { t } = useTranslation()
  const { team, athleteCount, reviewsDone, pending, alertCount, status, metrics, lastReviewDays } =
    overview
  const copied = copiedTeamId === team.id

  const lastReviewLabel =
    lastReviewDays == null
      ? t("teams.lastReviewNone")
      : lastReviewDays === 0
        ? t("teams.lastReviewToday")
        : lastReviewDays === 1
          ? t("teams.lastReviewYesterday")
          : t("teams.lastReviewDaysAgo", { days: lastReviewDays })

  return (
    <article className={`team-card ${STATUS_CLASS[status] || ""}`}>
      <div className="team-card__head">
        <div className="team-card__title-block">
          <span className={`team-card__status team-card__status--${status}`}>
            {t(`teams.status.${status}`)}
          </span>
          <h3 className="team-card__name">{team.name}</h3>
        </div>
      </div>

      <ul className="team-card__stats">
        <li>{t("teams.cardAthletes", { count: athleteCount })}</li>
        {athleteCount > 0 ? (
          reviewsDone > 0 ? (
            <li className="team-card__stat--good">
              {t("teams.cardReviewsDoneGood", { count: reviewsDone })}
            </li>
          ) : (
            <li className="team-card__stat--pending">{t("teams.cardNoReviewsThisWeek")}</li>
          )
        ) : null}
        {pending > 0 ? (
          <li className="team-card__stat--pending">{t("teams.cardPendingGood", { count: pending })}</li>
        ) : null}
        {alertCount > 0 ? (
          <li className="team-card__stat--alert">{t("teams.cardAlertsGood", { count: alertCount })}</li>
        ) : null}
      </ul>

      <div className="team-card__divider" />

      <div className="team-card__metrics">
        <MetricRow icon="🧠" label={t("teams.metricMental")} metric={metrics.mental} />
        <MetricRow icon="💚" label={t("teams.metricWellbeing")} metric={metrics.wellbeing} />
        <MetricRow icon="🤝" label={t("teams.metricSocial")} metric={metrics.social} />
        <MetricRow icon="🗣" label={t("teams.metricCoach")} metric={metrics.coachCommunication} />
        <MetricRow icon="⚡" label={t("teams.metricEnergy")} metric={metrics.energy} />
      </div>

      <div className="team-card__divider" />

      <p className="team-card__last-review">
        <span>{t("teams.lastReviewLabel")}</span>
        <strong>{lastReviewLabel}</strong>
      </p>

      <div className="team-card__actions">
        <button type="button" className="team-card__action team-card__action--primary" onClick={() => onViewTeam(team.id)}>
          → {t("teams.viewTeam")}
        </button>
        {team.join_token ? (
          <button
            type="button"
            className={`team-card__action${copied ? " team-card__action--done" : ""}`}
            onClick={() => onCopyInvitation(team)}
          >
            {copied ? t("teams.invitationCopiedShort") : t("teams.copyInvitationShort")}
          </button>
        ) : null}
        <button type="button" className="team-card__action" onClick={() => onRename(team.id)}>
          {t("teams.edit")}
        </button>
        <button
          type="button"
          className="team-card__action team-card__action--danger"
          onClick={() => onDelete(team.id)}
        >
          {t("teams.delete")}
        </button>
      </div>
    </article>
  )
}

export function TeamManagement({
  teams,
  athletes = [],
  checkIns = [],
  alerts = [],
  onCreateTeam,
  onRenameTeam,
  onDeleteTeam,
  onOpenTeam,
  onNotify,
}) {
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)
  const [renameTeamId, setRenameTeamId] = useState(null)
  const [newTeamName, setNewTeamName] = useState("")
  const [renameTeamName, setRenameTeamName] = useState("")
  const [copiedTeamId, setCopiedTeamId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const teamOverviews = useMemo(() => {
    const overviews = buildTeamClinicalOverview(teams, athletes, checkIns, alerts)
    return sortTeamsByClinicalPriority(overviews)
  }, [teams, athletes, checkIns, alerts])

  const totalAthletes = useMemo(
    () => athletes.filter((row) => teams.some((team) => team.id === row.team_id)).length,
    [athletes, teams]
  )

  useEffect(() => {
    if (!copiedTeamId) return undefined
    const timer = window.setTimeout(() => setCopiedTeamId(null), 2000)
    return () => window.clearTimeout(timer)
  }, [copiedTeamId])

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
    const ok = await onCreateTeam?.(name)
    setSubmitting(false)
    if (ok !== false) {
      setNewTeamName("")
      setCreateOpen(false)
    }
  }

  const handleRename = async (event) => {
    event.preventDefault()
    const name = renameTeamName.trim()
    if (!name || !renameTeamId) return

    setSubmitting(true)
    const ok = await onRenameTeam?.(renameTeamId, name)
    setSubmitting(false)
    if (ok !== false) {
      setRenameTeamId(null)
      setRenameTeamName("")
    }
  }

  const handleDelete = async (teamId) => {
    await onDeleteTeam?.(teamId)
  }

  const copyInvitation = async (team) => {
    if (!team.join_token) return
    await navigator.clipboard.writeText(buildAthleteJoinLink(team.join_token))
    setCopiedTeamId(team.id)
    onNotify?.(t("teams.invitationCopied"))
  }

  return (
    <section className="team-management">
      <header className="team-management__header">
        <div className="team-management__title-row">
          <h2 className="team-management__title">{t("teams.manageTitle")}</h2>
          <p className="team-management__summary">
            {t("teams.headerSummary", { teams: teams.length, athletes: totalAthletes })}
          </p>
        </div>
        <Button variant="ghost" className="team-management__new-btn" onClick={() => setCreateOpen(true)}>
          {t("teams.newTeamShort")}
        </Button>
      </header>

      {teamOverviews.length === 0 ? (
        <p className="empty-state team-management__empty">{t("teams.emptyTeams")}</p>
      ) : (
        <div className="team-management__grid">
          {teamOverviews.map((overview) => (
            <TeamCard
              key={overview.team.id}
              overview={overview}
              copiedTeamId={copiedTeamId}
              onViewTeam={onOpenTeam}
              onCopyInvitation={copyInvitation}
              onRename={openRename}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

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
    </section>
  )
}
