import { useCallback, useEffect, useState } from "react"
import { supabase } from "../../supabase"
import { useTranslation } from "../../i18n/LanguageContext"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import {
  buildClubReportSections,
  downloadPrintReport,
} from "../../lib/pdfReports"

export function ClubManagement({ psychologistId, teams, athletes, checkIns, onUpdated }) {
  const { t } = useTranslation()
  const [clubs, setClubs] = useState([])
  const [directors, setDirectors] = useState([])
  const [newClubName, setNewClubName] = useState("")
  const [teamClubs, setTeamClubs] = useState({})
  const [directorPick, setDirectorPick] = useState({})
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    const [{ data: clubList }, { data: directorList }] = await Promise.all([
      supabase.from("clubs").select("*").is("deleted_at", null).order("name"),
      supabase
        .from("profiles")
        .select("id, name, role, club_id")
        .eq("role", "director")
        .order("name"),
    ])

    setClubs(clubList || [])
    setDirectors(directorList || [])
    setTeamClubs(Object.fromEntries((teams || []).map((team) => [team.id, team.club_id || ""])))
  }, [teams])

  useEffect(() => {
    load()
  }, [load])

  const createClub = async (event) => {
    event.preventDefault()
    const name = newClubName.trim()
    if (!name) return

    setMessage("")
    const { error } = await supabase.from("clubs").insert([{ name }])
    if (error) setMessage(error.message)
    else {
      setNewClubName("")
      setMessage(t("clubs.created"))
      await load()
      onUpdated?.()
    }
  }

  const assignTeamClub = async (teamId, clubId) => {
    setTeamClubs((prev) => ({ ...prev, [teamId]: clubId }))
    const { error } = await supabase
      .from("teams")
      .update({ club_id: clubId || null })
      .eq("id", teamId)

    if (error) setMessage(error.message)
    else {
      setMessage(t("clubs.teamAssigned"))
      onUpdated?.()
    }
  }

  const assignDirector = async (clubId) => {
    const profileId = directorPick[clubId]
    if (!profileId) {
      setMessage(t("clubs.directorRequired"))
      return
    }

    setMessage("")
    const { error } = await supabase
      .from("profiles")
      .update({ role: "director", club_id: clubId, team_id: null, approved: true })
      .eq("id", profileId)

    if (error) setMessage(error.message)
    else {
      setMessage(t("clubs.directorAssigned"))
      await load()
    }
  }

  const removeDirector = async (directorId) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "coach", club_id: null, approved: false })
      .eq("id", directorId)

    if (error) setMessage(error.message)
    else await load()
  }

  const deleteClub = async (clubId) => {
    if (!confirm(t("clubs.deleteConfirm"))) return
    const { error } = await supabase
      .from("clubs")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", clubId)

    if (error) setMessage(error.message)
    else {
      await load()
      onUpdated?.()
    }
  }

  const exportClubReport = (club) => {
    const clubTeams = teams.filter((team) => team.club_id === club.id)
    const clubAthletes = athletes.filter((a) => clubTeams.some((tm) => tm.id === a.team_id))
    downloadPrintReport({
      title: `${club.name} — ${t("reports.clubReport")}`,
      subtitle: t("reports.monthlySubtitle"),
      rows: buildClubReportSections({
        clubName: club.name,
        teams: clubTeams,
        athletes: clubAthletes,
        checkIns,
        t,
      }),
      filename: `club-${club.name}`,
    })
  }

  return (
    <Card title={t("clubs.manageTitle")} subtitle={t("clubs.manageSubtitle")}>
      <form className="team-create" onSubmit={createClub}>
        <input
          value={newClubName}
          onChange={(e) => setNewClubName(e.target.value)}
          placeholder={t("clubs.newPlaceholder")}
        />
        <Button type="submit">{t("clubs.create")}</Button>
      </form>

      {clubs.length === 0 ? (
        <p className="empty-state">{t("clubs.empty")}</p>
      ) : (
        <ul className="club-manage-list">
          {clubs.map((club) => {
            const clubDirector = directors.find((d) => d.club_id === club.id)
            return (
              <li key={club.id} className="club-manage-list__item">
                <header>
                  <strong>{club.name}</strong>
                  <div className="club-manage-list__header-actions">
                    <Button variant="ghost" onClick={() => exportClubReport(club)}>
                      {t("reports.exportPdf")}
                    </Button>
                    <Button variant="ghost" className="btn--danger-text" onClick={() => deleteClub(club.id)}>
                      {t("clubs.delete")}
                    </Button>
                  </div>
                </header>

                <div className="club-manage-list__director">
                  <span>{t("clubs.director")}:</span>
                  {clubDirector ? (
                    <span>
                      {clubDirector.name}{" "}
                      <Button variant="ghost" className="btn--danger-text" onClick={() => removeDirector(clubDirector.id)}>
                        {t("clubs.removeDirector")}
                      </Button>
                    </span>
                  ) : (
                    <div className="club-manage-list__assign">
                      <DirectorCandidateSelect
                        value={directorPick[club.id] || ""}
                        onChange={(id) => setDirectorPick((p) => ({ ...p, [club.id]: id }))}
                        t={t}
                      />
                      <Button variant="ghost" onClick={() => assignDirector(club.id)}>
                        {t("clubs.assignDirector")}
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {teams.length > 0 && clubs.length > 0 && (
        <div className="club-team-assign">
          <h3>{t("clubs.assignTeamsTitle")}</h3>
          <ul className="club-team-assign__list">
            {teams.map((team) => (
              <li key={team.id}>
                <span>{team.name}</span>
                <select
                  value={teamClubs[team.id] || ""}
                  onChange={(e) => assignTeamClub(team.id, e.target.value)}
                >
                  <option value="">{t("clubs.noClub")}</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && <p className="form-message">{message}</p>}
    </Card>
  )
}

function DirectorCandidateSelect({ value, onChange, t }) {
  const [candidates, setCandidates] = useState([])

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, role")
      .in("role", ["coach", "psychologist"])
      .order("name")
      .then(({ data }) => setCandidates(data || []))
  }, [])

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{t("clubs.chooseDirector")}</option>
      {candidates.map((person) => (
        <option key={person.id} value={person.id}>
          {person.name} ({t(`roles.${person.role}`)})
        </option>
      ))}
    </select>
  )
}
