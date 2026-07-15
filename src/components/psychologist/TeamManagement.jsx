import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "../../i18n/LanguageContext"
import { calculateRiskLevel } from "../../lib/risk"
import { summarizeTeam } from "../../lib/insights/metrics"
import { buildAthleteJoinLink } from "../../lib/invites"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"

function buildTeamCardStats(teams, athletes, checkIns, alerts) {
  const alertCounts = {}
  for (const alert of alerts || []) {
    if (alert.status !== "active") continue
    const athlete = athletes.find((row) => row.id === alert.athleteId)
    if (athlete?.team_id) {
      alertCounts[athlete.team_id] = (alertCounts[athlete.team_id] || 0) + 1
    }
  }

  return teams.map((team) => {
    const teamAthletes = athletes.filter((row) => row.team_id === team.id)
    const ids = new Set(teamAthletes.map((row) => row.id))
    const teamCheckIns = checkIns.filter((row) => ids.has(row.athlete_id))
    const latestByAthlete = teamAthletes.map((athlete) => {
      const rows = teamCheckIns.filter((row) => row.athlete_id === athlete.id)
      const latest = rows.sort((a, b) => b.check_in_date.localeCompare(a.check_in_date))[0]
      return { athlete, latest, risk: calculateRiskLevel(latest) }
    })
    const summary = summarizeTeam({ athletes: teamAthletes, checkIns: teamCheckIns, latestByAthlete })

    return {
      team,
      athleteCount: teamAthletes.length,
      reviewsDone: summary.checkedInThisWeek,
      pending: Math.max(0, teamAthletes.length - summary.checkedInThisWeek),
      alertCount: alertCounts[team.id] || 0,
    }
  })
}

function TeamCardMenu({ teamId, onRename, onDelete, onClose }) {
  const { t } = useTranslation()
  const menuRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) onClose()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [onClose])

  return (
    <div className="team-card__menu" ref={menuRef}>
      <button type="button" className="team-card__menu-item" onClick={() => onRename(teamId)}>
        {t("teams.edit")}
      </button>
      <button
        type="button"
        className="team-card__menu-item team-card__menu-item--danger"
        onClick={() => onDelete(teamId)}
      >
        {t("teams.delete")}
      </button>
    </div>
  )
}

function TeamCard({ stats, copiedTeamId, onCopyInvitation, onRename, onDelete }) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { team, athleteCount, reviewsDone, pending, alertCount } = stats
  const copied = copiedTeamId === team.id

  return (
    <article className="team-card">
      <div className="team-card__head">
        <h3 className="team-card__name">{team.name}</h3>
        <div className="team-card__menu-wrap">
          <button
            type="button"
            className="team-card__menu-btn"
            aria-label={t("teams.menuActions")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ⋮
          </button>
          {menuOpen ? (
            <TeamCardMenu
              teamId={team.id}
              onRename={(id) => {
                setMenuOpen(false)
                onRename(id)
              }}
              onDelete={(id) => {
                setMenuOpen(false)
                onDelete(id)
              }}
              onClose={() => setMenuOpen(false)}
            />
          ) : null}
        </div>
      </div>

      <ul className="team-card__stats">
        <li>{t("teams.cardAthletes", { count: athleteCount })}</li>
        <li>{t("teams.cardReviewsDone", { count: reviewsDone })}</li>
        {pending > 0 ? <li className="team-card__stat--pending">{t("teams.cardPending", { count: pending })}</li> : null}
        {alertCount > 0 ? <li className="team-card__stat--alert">{t("teams.cardAlerts", { count: alertCount })}</li> : null}
      </ul>

      <div className="team-card__actions">
        {team.join_token ? (
          <button
            type="button"
            className={`team-card__copy${copied ? " team-card__copy--done" : ""}`}
            onClick={() => onCopyInvitation(team)}
          >
            {copied ? t("teams.invitationCopied") : t("teams.copyInvitation")}
          </button>
        ) : (
          <span className="team-card__copy-missing">{t("teams.joinLinkMissing")}</span>
        )}
        <Button variant="ghost" className="team-card__rename" onClick={() => onRename(team.id)}>
          {t("teams.edit")}
        </Button>
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
  onNotify,
}) {
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)
  const [renameTeamId, setRenameTeamId] = useState(null)
  const [newTeamName, setNewTeamName] = useState("")
  const [renameTeamName, setRenameTeamName] = useState("")
  const [copiedTeamId, setCopiedTeamId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const teamStats = useMemo(
    () => buildTeamCardStats(teams, athletes, checkIns, alerts),
    [teams, athletes, checkIns, alerts]
  )

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

      {teamStats.length === 0 ? (
        <p className="empty-state team-management__empty">{t("teams.emptyTeams")}</p>
      ) : (
        <div className="team-management__grid">
          {teamStats.map((stats) => (
            <TeamCard
              key={stats.team.id}
              stats={stats}
              copiedTeamId={copiedTeamId}
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
