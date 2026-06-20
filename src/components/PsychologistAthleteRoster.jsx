import { useCallback, useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { parseAthleteImport } from "../lib/parseAthleteImport"
import { buildAthleteJoinLink } from "../lib/invites"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"

export function PsychologistAthleteRoster({ psychologistId }) {
  const { t } = useTranslation()
  const [teams, setTeams] = useState([])
  const [invites, setInvites] = useState([])
  const [teamId, setTeamId] = useState("")
  const [importText, setImportText] = useState("")
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState("")
  const [schemaReady, setSchemaReady] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const { data: teamList } = await supabase.from("teams").select("id, name").order("name")

    const { data: inv, error } = await supabase
      .from("athlete_invites")
      .select("id, token, team_id, full_name, email, used_at, expires_at, created_at")
      .eq("created_by", psychologistId)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error?.code === "42P01" || error?.message?.includes("athlete_invites")) {
      setSchemaReady(false)
      setTeams(teamList || [])
      setInvites([])
      setLoading(false)
      return
    }

    setTeams(teamList || [])
    setInvites(inv || [])
    if (!teamId && teamList?.length === 1) {
      setTeamId(teamList[0].id)
    }
    setLoading(false)
  }, [psychologistId])

  useEffect(() => {
    load()
  }, [load])

  const teamName = (id) => teams.find((team) => team.id === id)?.name || "—"

  const importAthletes = async (event) => {
    event.preventDefault()
    setMessage("")

    if (!teamId) {
      setMessage(t("athleteInvites.teamRequired"))
      return
    }

    const rows = parseAthleteImport(importText)
    if (!rows.length) {
      setMessage(t("athleteInvites.importEmpty"))
      return
    }

    setImporting(true)

    const payload = rows.map((row) => ({
      created_by: psychologistId,
      team_id: teamId,
      full_name: row.fullName,
      email: row.email,
    }))

    const { error } = await supabase.from("athlete_invites").insert(payload)

    setImporting(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setImportText("")
    setMessage(t("athleteInvites.imported", { count: rows.length }))
    await load()
  }

  const copyLink = async (token) => {
    const link = buildAthleteJoinLink(token)
    await navigator.clipboard.writeText(link)
    setMessage(t("athleteInvites.copied"))
  }

  const copyAllPending = async () => {
    const pending = invites.filter((inv) => !inv.used_at)
    if (!pending.length) return

    const text = pending
      .map((inv) => {
        const label = inv.email ? `${inv.full_name} (${inv.email})` : inv.full_name
        return `${label}\n${buildAthleteJoinLink(inv.token)}`
      })
      .join("\n\n")

    await navigator.clipboard.writeText(text)
    setMessage(t("athleteInvites.copiedAll", { count: pending.length }))
  }

  if (loading) return null

  if (!schemaReady) {
    return (
      <Card title={t("athleteInvites.title")} subtitle={t("athleteInvites.subtitle")}>
        <p className="form-error">{t("athleteInvites.schemaMissing")}</p>
      </Card>
    )
  }

  return (
    <Card title={t("athleteInvites.title")} subtitle={t("athleteInvites.subtitle")}>
      <p className="auth-form__hint">{t("athleteInvites.flowHint")}</p>

      <form className="roster-import" onSubmit={importAthletes}>
        <label className="team-selector__label">
          <span>{t("athleteInvites.teamLabel")}</span>
          <select value={teamId} onChange={(event) => setTeamId(event.target.value)}>
            <option value="">{t("teams.chooseForCoach")}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <label className="assessment-field assessment-field--wide">
          <span>{t("athleteInvites.importLabel")}</span>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder={t("athleteInvites.importPlaceholder")}
            rows={5}
          />
        </label>
        <p className="auth-form__hint">{t("athleteInvites.importHint")}</p>

        <div className="invite-actions">
          <Button type="submit" disabled={importing || !importText.trim()}>
            {importing ? t("athleteInvites.importing") : t("athleteInvites.importButton")}
          </Button>
          {invites.some((inv) => !inv.used_at) && (
            <Button type="button" variant="ghost" onClick={copyAllPending}>
              {t("athleteInvites.copyAllPending")}
            </Button>
          )}
        </div>
      </form>

      {invites.length > 0 ? (
        <ul className="roster-list roster-list--invites">
          {invites.map((inv) => (
            <li key={inv.id}>
              <div>
                <strong>{inv.full_name}</strong>
                <span>
                  {teamName(inv.team_id)}
                  {inv.email ? ` · ${inv.email}` : ""}
                  {" · "}
                  {inv.used_at ? t("athleteInvites.used") : t("athleteInvites.pending")}
                  {" · "}
                  {new Date(inv.expires_at).toLocaleDateString()}
                </span>
              </div>
              {!inv.used_at && (
                <div className="coach-actions">
                  <Button variant="ghost" onClick={() => copyLink(inv.token)}>
                    {t("athleteInvites.copyLink")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">{t("athleteInvites.noInvites")}</p>
      )}

      {message && <p className="form-message">{message}</p>}
    </Card>
  )
}
