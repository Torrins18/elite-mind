import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { Button } from "./ui/Button"
import { Card } from "./ui/Card"

export function TeamSelector({ profile, onUpdated }) {
  const { t } = useTranslation()
  const [teams, setTeams] = useState([])
  const [selectedId, setSelectedId] = useState(profile?.team_id || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase
      .from("teams")
      .select("id, name")
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => setTeams(data || []))

    setSelectedId(profile?.team_id || "")
  }, [profile?.team_id])

  const save = async () => {
    if (!selectedId) {
      setError(t("team.required"))
      return
    }

    setSaving(true)
    setError("")

    const { error: err } = await supabase
      .from("profiles")
      .update({ team_id: selectedId })
      .eq("id", profile.id)

    setSaving(false)

    if (err) {
      setError(err.message)
      return
    }

    onUpdated?.()
  }

  const currentTeam = teams.find((t) => t.id === profile?.team_id)

  return (
    <Card title={t("team.title")} subtitle={t("team.subtitle")}>
      <div className="team-selector">
        {currentTeam && (
          <p className="team-selector__current">
            {t("team.current")}: <strong>{currentTeam.name}</strong>
          </p>
        )}

        <label className="team-selector__label">
          <span>{t("team.choose")}</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">{t("team.placeholder")}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="form-error">{error}</p>}

        <Button onClick={save} disabled={saving || !selectedId}>
          {saving ? t("team.saving") : t("team.save")}
        </Button>
      </div>
    </Card>
  )
}
