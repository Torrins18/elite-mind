import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"
import { filterActiveTeams } from "../lib/teams"
import { PsychologistResourceLibrary } from "./psychologist/PsychologistResourceLibrary"
import { ClubManagement } from "./psychologist/ClubManagement"

export function PsychologistCoachAdmin({
  psychologistId,
  onPreviewCoachTeam,
  athletes = [],
  checkIns = [],
  externalMessage = "",
  onMessage,
}) {
  const { t } = useTranslation()
  const [pendingCoaches, setPendingCoaches] = useState([])
  const [approvedCoaches, setApprovedCoaches] = useState([])
  const [invites, setInvites] = useState([])
  const [teams, setTeams] = useState([])
  const [coachTeams, setCoachTeams] = useState({})
  const [previewTeamId, setPreviewTeamId] = useState("")
  const [newLink, setNewLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)

    let pendingQuery = await supabase
      .from("profiles")
      .select("id, name, team_id, created_at, approved, is_rejected")
      .eq("role", "coach")
      .eq("approved", false)
      .order("created_at", { ascending: false })

    if (pendingQuery.error?.message?.includes("is_rejected")) {
      pendingQuery = await supabase
        .from("profiles")
        .select("id, name, team_id, created_at, approved")
        .eq("role", "coach")
        .eq("approved", false)
        .order("created_at", { ascending: false })
    }

    const pending = (pendingQuery.data || []).filter((c) => c.is_rejected !== true)

    let approvedQuery = await supabase
      .from("profiles")
      .select("id, name, team_id, created_at, approved, is_rejected")
      .eq("role", "coach")
      .eq("approved", true)
      .order("name")

    if (approvedQuery.error?.message?.includes("is_rejected")) {
      approvedQuery = await supabase
        .from("profiles")
        .select("id, name, team_id, created_at, approved")
        .eq("role", "coach")
        .eq("approved", true)
        .order("name")
    }

    const approved = (approvedQuery.data || []).filter((c) => c.is_rejected !== true)

    const { data: teamList } = await supabase
      .from("teams")
      .select("id, name, join_token, deleted_at, club_id")
      .order("name")

    const { data: inv } = await supabase
      .from("coach_invites")
      .select("id, token, used_at, expires_at, created_at")
      .eq("created_by", psychologistId)
      .order("created_at", { ascending: false })
      .limit(10)

    setPendingCoaches(pending || [])
    setApprovedCoaches(approved || [])
    setTeams(teamList || [])
    setCoachTeams(
      Object.fromEntries([...(pending || []), ...(approved || [])].map((coach) => [coach.id, coach.team_id || ""]))
    )
    setInvites(inv || [])
    setLoading(false)
  }, [psychologistId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!loading && window.location.hash === "#coach-approvals") {
      document.getElementById("coach-approvals")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [loading])

  const createInvite = async () => {
    setMessage("")

    const { data, error } = await supabase
      .from("coach_invites")
      .insert([{ created_by: psychologistId }])
      .select("token")
      .single()

    if (error) {
      setMessage(error.message)
      return
    }

    const link = `${window.location.origin}/?invite=${data.token}`
    setNewLink(link)
    await load()
  }

  const copyLink = async () => {
    if (!newLink) return
    await navigator.clipboard.writeText(newLink)
    setMessage(t("invites.copied"))
  }

  const notify = (value) => {
    setMessage(value)
    onMessage?.(value)
  }

  const updateCoachTeam = async (coachId, teamId) => {
    setCoachTeams((prev) => ({ ...prev, [coachId]: teamId }))
    notify("")

    const { error } = await supabase
      .from("profiles")
      .update({ team_id: teamId || null })
      .eq("id", coachId)

    if (error) notify(error.message)
    else {
      notify(t("teams.assigned"))
      await load()
    }
  }

  const approveCoach = async (coachId) => {
    const teamId = coachTeams[coachId]
    if (!teamId) {
      setMessage(t("teams.requiredForCoach"))
      return
    }

    setMessage("")
    const { error: teamError } = await supabase
      .from("profiles")
      .update({ team_id: teamId })
      .eq("id", coachId)

    if (teamError) {
      setMessage(teamError.message)
      return
    }

    const { error } = await supabase.rpc("approve_coach", { coach_profile_id: coachId })
    if (error) setMessage(error.message)
    else {
      setMessage(t("invites.approved"))
      await load()
    }
  }

  const rejectCoach = async (coachId) => {
    if (!confirm(t("invites.rejectConfirm"))) return

    const { error } = await supabase.rpc("reject_coach", { coach_profile_id: coachId })
    if (error) setMessage(error.message)
    else {
      setMessage(t("invites.rejected"))
      await load()
    }
  }

  const activeTeams = useMemo(() => filterActiveTeams(teams), [teams])

  if (loading) return null

  const displayMessage = externalMessage || message

  return (
    <div className="admin-grid admin-grid--config">
      <header className="admin-grid__header">
        <h2 className="clinical-command__section-title">{t("brand.nav.settings")}</h2>
      </header>
      <Card title={t("teams.previewTitle")} subtitle={t("teams.previewSubtitle")}>
        <div className="coach-preview-controls">
          <label className="team-selector__label">
            <span>{t("teams.previewTeam")}</span>
            <select value={previewTeamId} onChange={(event) => setPreviewTeamId(event.target.value)}>
              <option value="">{t("teams.chooseForCoach")}</option>
              {activeTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={() => onPreviewCoachTeam?.(previewTeamId)} disabled={!previewTeamId}>
            {t("teams.previewOpen")}
          </Button>
        </div>
      </Card>

      <Card title={t("invites.title")} subtitle={t("invites.subtitle")}>
        <div className="invite-actions">
          <Button onClick={createInvite}>{t("invites.generate")}</Button>
          {newLink && (
            <>
              <input className="invite-link" readOnly value={newLink} />
              <Button variant="ghost" onClick={copyLink}>
                {t("invites.copy")}
              </Button>
            </>
          )}
        </div>
        <p className="auth-form__hint">{t("invites.hint")}</p>

        {invites.length > 0 && (
          <ul className="invite-list">
            {invites.map((inv) => (
              <li key={inv.id}>
                <span>
                  {inv.used_at ? t("invites.used") : t("invites.active")} ·{" "}
                  {new Date(inv.expires_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div id="coach-approvals" className="scroll-anchor">
        <Card title={t("invites.pendingTitle")} subtitle={t("invites.pendingSubtitle")}>
          {pendingCoaches.length === 0 ? (
            <p className="empty-state">{t("invites.noPending")}</p>
          ) : (
            <ul className="roster-list">
              {pendingCoaches.map((coach) => (
                <li key={coach.id}>
                  <div>
                    <strong>{coach.name}</strong>
                    <span>{new Date(coach.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="coach-actions">
                    <select
                      value={coachTeams[coach.id] || ""}
                      onChange={(event) =>
                        setCoachTeams((prev) => ({ ...prev, [coach.id]: event.target.value }))
                      }
                    >
                      <option value="">{t("teams.chooseForCoach")}</option>
                      {activeTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <Button variant="ghost" onClick={() => approveCoach(coach.id)}>
                      {t("invites.approve")}
                    </Button>
                    <Button variant="ghost" className="btn--danger-text" onClick={() => rejectCoach(coach.id)}>
                      {t("invites.reject")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title={t("teams.coachAssignmentsTitle")} subtitle={t("teams.coachAssignmentsSubtitle")}>
        {approvedCoaches.length === 0 ? (
          <p className="empty-state">{t("teams.noApprovedCoaches")}</p>
        ) : (
          <ul className="roster-list">
            {approvedCoaches.map((coach) => (
              <li key={coach.id}>
                <div>
                  <strong>{coach.name}</strong>
                  <span>
                    {teams.find((team) => team.id === coach.team_id)?.name || t("teams.noTeam")}
                  </span>
                </div>
                <div className="coach-actions">
                  <select
                    value={coachTeams[coach.id] || ""}
                    onChange={(event) => updateCoachTeam(coach.id, event.target.value)}
                  >
                    <option value="">{t("teams.noTeam")}</option>
                    {activeTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ClubManagement
        psychologistId={psychologistId}
        teams={activeTeams}
        athletes={athletes}
        checkIns={checkIns}
        onUpdated={load}
      />

      <PsychologistResourceLibrary psychologistId={psychologistId} />

      {displayMessage && <p className="form-message">{displayMessage}</p>}
    </div>
  )
}
