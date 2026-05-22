import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { buildCheckInsExport, downloadCsv } from "../lib/export"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { LoadingSpinner } from "../components/ui/LoadingSpinner"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { CheckInChart } from "../components/CheckInChart"
import { averageMetrics, calculateRiskLevel, countByRisk } from "../lib/risk"
import { PsychologistCoachAdmin } from "../components/PsychologistCoachAdmin"

export function PsychologistDashboard({ profile }) {
  const { t } = useTranslation()
  const [athletes, setAthletes] = useState([])
  const [teams, setTeams] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const [{ data: roster }, { data: teamList }, { data: ins }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, team_id, role")
        .eq("role", "athlete")
        .order("name"),
      supabase.from("teams").select("id, name").order("name"),
      supabase
        .from("check_ins")
        .select("*")
        .order("check_in_date", { ascending: false })
        .limit(500),
    ])

    setAthletes(roster || [])
    setTeams(teamList || [])
    setCheckIns(ins || [])
    setSelectedId((prev) => {
      const list = roster || []
      if (prev && list.some((a) => a.id === prev)) return prev
      return list[0]?.id ?? null
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((tm) => [tm.id, tm.name])),
    [teams]
  )

  const filteredAthletes = useMemo(() => {
    if (!categoryFilter) return athletes
    return athletes.filter((a) => a.team_id === categoryFilter)
  }, [athletes, categoryFilter])

  const filteredCheckIns = useMemo(() => {
    const ids = new Set(filteredAthletes.map((a) => a.id))
    return checkIns.filter((c) => ids.has(c.athlete_id))
  }, [checkIns, filteredAthletes])

  const exportCsv = () => {
    const rows = buildCheckInsExport({
      checkIns: filteredCheckIns,
      athletes: filteredAthletes,
      teams,
      t,
    })
    const suffix = categoryFilter ? teamMap[categoryFilter] : "todos"
    downloadCsv(`elite-mind-checkins-${suffix}.csv`, rows)
  }

  if (loading) return <LoadingSpinner label={t("psychologist.loading")} />

  const selected = filteredAthletes.find((a) => a.id === selectedId)
  const athleteCheckIns = filteredCheckIns.filter((c) => c.athlete_id === selectedId)

  const latestByAthlete = filteredAthletes.map((a) => {
    const latest = filteredCheckIns.find((c) => c.athlete_id === a.id)
    return { athlete: a, latest, risk: calculateRiskLevel(latest) }
  })

  const emotionalRisk = athleteCheckIns.filter(
    (c) => calculateRiskLevel(c) === "high" || (c.personal_notes && c.personal_notes.length > 20)
  )

  const orgAvg = averageMetrics(filteredCheckIns.slice(0, 80))
  const riskCounts = countByRisk(filteredCheckIns)

  return (
    <div className="dashboard-grid dashboard-grid--psych">
      <section className="hero-strip">
        <div>
          <h2>{t("psychologist.title")}</h2>
          <p>{t("psychologist.subtitle")}</p>
        </div>
        <Button variant="ghost" onClick={exportCsv}>
          {t("export.button")}
        </Button>
      </section>

      <PsychologistCoachAdmin psychologistId={profile.id} />

      <Card title={t("psychologist.filterTitle")} subtitle={t("psychologist.filterSubtitle")}>
        <label className="team-selector__label">
          <span>{t("psychologist.filterLabel")}</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">{t("psychologist.filterAll")}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <div className="stats-row">
        <StatCard label={t("psychologist.athletesMonitored")} value={filteredAthletes.length} />
        <StatCard label={t("psychologist.orgAvgMood")} value={orgAvg.mood || "—"} />
        <StatCard
          label={t("psychologist.highEmotionalRisk")}
          value={riskCounts.high}
          accent="var(--danger)"
        />
        <StatCard
          label={t("psychologist.entriesWithNotes")}
          value={filteredCheckIns.filter((c) => c.personal_notes).length}
        />
      </div>

      <div className="psych-layout">
        <Card title={t("psychologist.allAthletes")} subtitle={t("psychologist.allAthletesSubtitle")}>
          {filteredAthletes.length === 0 ? (
            <p className="empty-state">{t("psychologist.noAthletesInCategory")}</p>
          ) : (
            <ul className="athlete-picker">
              {filteredAthletes.map((a) => {
                const latest = filteredCheckIns.find((c) => c.athlete_id === a.id)
                const risk = calculateRiskLevel(latest)
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={
                        selectedId === a.id ? "athlete-picker__btn active" : "athlete-picker__btn"
                      }
                      onClick={() => setSelectedId(a.id)}
                    >
                      <span>
                        {a.name}
                        {a.team_id && (
                          <small className="athlete-picker__cat"> · {teamMap[a.team_id]}</small>
                        )}
                      </span>
                      {latest && <Badge variant={risk}>{t(`risk.${risk}`)}</Badge>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="psych-detail">
          {selected ? (
            <>
              <Card title={selected.name} subtitle={t("psychologist.historySubtitle")}>
                {selected.team_id && (
                  <p className="card__subtitle" style={{ marginBottom: 12 }}>
                    {teamMap[selected.team_id]}
                  </p>
                )}
                <CheckInChart checkIns={athleteCheckIns.slice(0, 14)} />
              </Card>

              {emotionalRisk.length > 0 && (
                <Card
                  title={t("psychologist.emotionalRisk")}
                  subtitle={t("psychologist.emotionalRiskSubtitle")}
                >
                  <ul className="notes-list">
                    {emotionalRisk.slice(0, 8).map((c) => {
                      const r = calculateRiskLevel(c)
                      return (
                        <li key={c.id}>
                          <div className="notes-list__meta">
                            <span>{c.check_in_date}</span>
                            <Badge variant={r}>{t(`risk.${r}`)}</Badge>
                          </div>
                          <p className="notes-list__metrics">
                            {t("psychologist.moodStress", {
                              mood: c.mood,
                              stress: c.stress,
                            })}{" "}
                            · {t("checkIn.sleep")} {c.sleep_quality} · {t("checkIn.energy")}{" "}
                            {c.energy}
                          </p>
                          {c.personal_notes && <blockquote>{c.personal_notes}</blockquote>}
                        </li>
                      )
                    })}
                  </ul>
                </Card>
              )}

              <Card
                title={t("psychologist.checkInLog")}
                subtitle={t("psychologist.checkInLogSubtitle")}
              >
                <ul className="notes-list">
                  {athleteCheckIns.length === 0 ? (
                    <p className="empty-state">{t("psychologist.noCheckIns")}</p>
                  ) : (
                    athleteCheckIns.map((c) => {
                      const r = calculateRiskLevel(c)
                      return (
                        <li key={c.id}>
                          <div className="notes-list__meta">
                            <span>{c.check_in_date}</span>
                            <Badge variant={r}>{t(`risk.${r}`)}</Badge>
                          </div>
                          <p className="notes-list__metrics">
                            {t("checkIn.mood")} {c.mood} · {t("checkIn.stress")} {c.stress} ·{" "}
                            {t("checkIn.sleep")} {c.sleep_quality} · {t("checkIn.energy")}{" "}
                            {c.energy} · {t("checkIn.focus")} {c.focus}
                          </p>
                          {c.personal_notes ? (
                            <blockquote>{c.personal_notes}</blockquote>
                          ) : (
                            <p className="notes-list__empty">{t("psychologist.noNotes")}</p>
                          )}
                        </li>
                      )
                    })
                  )}
                </ul>
              </Card>
            </>
          ) : (
            <Card title={t("psychologist.noAthletes")}>
              <p className="empty-state">{t("psychologist.noAthletesText")}</p>
            </Card>
          )}
        </div>
      </div>

      <Card title={t("psychologist.heatmap")} subtitle={t("psychologist.heatmapSubtitle")}>
        <ul className="roster-list">
          {latestByAthlete.map(({ athlete, latest, risk }) => (
            <li key={athlete.id}>
              <div>
                <strong>{athlete.name}</strong>
                <span>
                  {athlete.team_id ? teamMap[athlete.team_id] + " · " : ""}
                  {latest
                    ? t("psychologist.moodStress", {
                        mood: latest.mood,
                        stress: latest.stress,
                      })
                    : t("risk.noData")}
                  {latest?.personal_notes ? t("psychologist.hasNotes") : ""}
                </span>
              </div>
              <Badge variant={latest ? risk : "default"}>
                {latest ? t(`risk.${risk}`) : t("risk.noData")}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
