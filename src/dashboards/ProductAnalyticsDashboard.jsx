import { useCallback, useEffect, useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { supabase } from "../supabase"
import { useTranslation } from "../i18n/LanguageContext"
import { Card } from "../components/ui/Card"
import { StatCard } from "../components/ui/StatCard"
import { PageSkeleton } from "../components/ui/PageSkeleton"
import { EmptyState } from "../components/ui/EmptyState"
import { buildProductInsights, formatDurationMs, disableProductAnalytics } from "../lib/productAnalytics"
import { CHART_AXIS_TICK, CHART_GRID_STROKE, CHART_TOOLTIP_STYLE } from "../lib/chartColors"

function Section({ id, title, subtitle, children }) {
  return (
    <Card id={id} title={title} subtitle={subtitle} className="product-analytics__section">
      {children}
    </Card>
  )
}

function SimpleTable({ columns, rows, emptyLabel }) {
  if (!rows?.length) {
    return <p className="type-caption">{emptyLabel}</p>
  }

  return (
    <div className="product-analytics__table-wrap">
      <table className="product-analytics__table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ProductAnalyticsDashboard() {
  const { t, lang } = useTranslation()
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    disableProductAnalytics()

    const { data, error: rpcError } = await supabase.rpc("get_product_analytics_snapshot", {
      p_weeks: 12,
    })

    if (rpcError) {
      setError(rpcError.message)
      setSnapshot(null)
    } else {
      setSnapshot(data)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const insights = useMemo(() => buildProductInsights(snapshot, t), [snapshot, t])

  const completionChart = useMemo(
    () =>
      (snapshot?.engagement?.completion_trend || []).map((row) => ({
        week: row.week_start,
        rate: row.rate_pct,
      })),
    [snapshot]
  )

  if (loading) return <PageSkeleton variant="dashboard" />

  if (error) {
    return (
      <EmptyState
        icon="alert"
        title={t("productAnalytics.errorTitle")}
        description={t("productAnalytics.errorBody")}
      />
    )
  }

  const platform = snapshot?.platform || {}
  const growth = platform.growth || {}
  const engagement = snapshot?.engagement || {}
  const review = snapshot?.review_completion || {}
  const activity = snapshot?.athlete_activity || {}
  const retention = snapshot?.retention || {}
  const appointments = snapshot?.appointments || {}
  const messages = snapshot?.messages || {}
  const alerts = snapshot?.alerts || {}
  const mental = snapshot?.mental_training || {}
  const psychActivity = snapshot?.psychologist_activity || {}
  const coachActivity = snapshot?.coach_activity || {}
  const features = snapshot?.feature_adoption || {}

  const clubRows = (engagement.by_club || []).map((row) => ({
    id: row.club_id || row.club_name,
    name: row.club_name || "—",
    athletes: row.athletes,
    completed: row.completed,
    rate: `${row.rate_pct}%`,
  }))

  const teamRows = (engagement.by_team || []).map((row) => ({
    id: row.team_id,
    name: row.team_name,
    club: row.club_name || "—",
    athletes: row.athletes,
    rate: `${row.rate_pct}%`,
  }))

  const pageViews = snapshot?.page_views || []

  return (
    <div className="dashboard-grid dashboard-grid--product-analytics">
      <header className="product-analytics__hero">
        <h1 className="type-page-title">{t("productAnalytics.title")}</h1>
        <p className="type-body">{t("productAnalytics.subtitle")}</p>
        <p className="type-caption">{t("productAnalytics.privacyNote")}</p>
      </header>

      <Section title={t("productAnalytics.insightsTitle")} subtitle={t("productAnalytics.insightsSubtitle")}>
        <ul className="product-analytics__insights">
          {insights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>

      <div className="stats-row stats-row--compact">
        <StatCard label={t("productAnalytics.kpi.completion")} value={`${engagement.current_week_completion_pct ?? 0}%`} />
        <StatCard label={t("productAnalytics.kpi.medianReview")} value={formatDurationMs(review.median_ms)} />
        <StatCard label={t("productAnalytics.kpi.activeAthletes")} value={platform.total_athletes ?? 0} />
        <StatCard label={t("productAnalytics.kpi.activeClubs")} value={platform.active_clubs ?? 0} />
      </div>

      <Section
        id="engagement"
        title={t("productAnalytics.sections.engagement")}
        subtitle={t("productAnalytics.sections.engagementHint")}
      >
        <div className="chart-wrap chart-wrap--responsive">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={completionChart}>
              <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="week"
                tick={CHART_AXIS_TICK}
                tickFormatter={(value) =>
                  new Date(`${value}T12:00:00`).toLocaleDateString(lang === "ca" ? "ca-ES" : "es-ES", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} unit="%" />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <h3 className="type-card-title product-analytics__subheading">{t("productAnalytics.byClub")}</h3>
        <SimpleTable
          columns={[
            { key: "name", label: t("productAnalytics.col.club") },
            { key: "athletes", label: t("productAnalytics.col.athletes") },
            { key: "completed", label: t("productAnalytics.col.completed") },
            { key: "rate", label: t("productAnalytics.col.rate") },
          ]}
          rows={clubRows}
          emptyLabel={t("productAnalytics.noData")}
        />

        <h3 className="type-card-title product-analytics__subheading">{t("productAnalytics.byTeam")}</h3>
        <SimpleTable
          columns={[
            { key: "name", label: t("productAnalytics.col.team") },
            { key: "club", label: t("productAnalytics.col.club") },
            { key: "athletes", label: t("productAnalytics.col.athletes") },
            { key: "rate", label: t("productAnalytics.col.rate") },
          ]}
          rows={teamRows}
          emptyLabel={t("productAnalytics.noData")}
        />
      </Section>

      <Section title={t("productAnalytics.sections.reviewCompletion")} subtitle={t("productAnalytics.sections.reviewGoal")}>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.avgReview")} value={formatDurationMs(review.avg_ms)} />
          <StatCard label={t("productAnalytics.kpi.fastestReview")} value={formatDurationMs(review.min_ms)} />
          <StatCard label={t("productAnalytics.kpi.slowestReview")} value={formatDurationMs(review.max_ms)} />
          <StatCard label={t("productAnalytics.kpi.abandonRate")} value={`${review.abandonment_rate_pct ?? 0}%`} />
        </div>
      </Section>

      <Section title={t("productAnalytics.sections.athleteActivity")} subtitle={t("productAnalytics.sections.athleteActivityHint")}>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.dau")} value={activity.dau_sessions ?? 0} />
          <StatCard label={t("productAnalytics.kpi.wau")} value={activity.wau_sessions ?? 0} />
          <StatCard label={t("productAnalytics.kpi.mau")} value={activity.mau_sessions ?? 0} />
          <StatCard label={t("productAnalytics.kpi.completedReviews")} value={activity.completed_reviews ?? 0} />
        </div>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.skippedWeeks")} value={activity.skipped_weeks_est ?? 0} />
          <StatCard label={t("productAnalytics.kpi.retentionWeekly")} value={`${retention.return_next_week_pct ?? 0}%`} />
          <StatCard label={t("productAnalytics.kpi.missedTwoWeeks")} value={`${retention.missed_two_weeks_pct ?? 0}%`} />
        </div>
      </Section>

      <Section title={t("productAnalytics.sections.mentalTraining")} subtitle={t("productAnalytics.sections.mentalTrainingHint")}>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.mtShown")} value={mental.shown ?? 0} />
          <StatCard label={t("productAnalytics.kpi.mtRead")} value={mental.read ?? 0} />
          <StatCard label={t("productAnalytics.kpi.mtDismissed")} value={mental.dismissed ?? 0} />
        </div>
        {(mental.top_topics || []).length > 0 && (
          <>
            <h3 className="type-card-title product-analytics__subheading">{t("productAnalytics.topTopics")}</h3>
            <ul className="product-analytics__feature-list">
              {mental.top_topics.map((row) => (
                <li key={row.topic}>
                  <span>{row.topic}</span>
                  <strong>{row.views}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title={t("productAnalytics.sections.platformHealth")} subtitle={t("productAnalytics.sections.platformHealthHint")}>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.teams")} value={platform.active_teams ?? 0} />
          <StatCard label={t("productAnalytics.kpi.psychologists")} value={platform.total_psychologists ?? 0} />
          <StatCard label={t("productAnalytics.kpi.coaches")} value={platform.total_coaches ?? 0} />
        </div>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.growthAthletes7d")} value={growth.athletes_7d ?? 0} />
          <StatCard label={t("productAnalytics.kpi.growthAthletes30d")} value={growth.athletes_30d ?? 0} />
          <StatCard label={t("productAnalytics.kpi.growthClubs30d")} value={growth.clubs_30d ?? 0} />
          <StatCard label={t("productAnalytics.kpi.growthTeams30d")} value={growth.teams_30d ?? 0} />
        </div>
      </Section>

      <Section title={t("productAnalytics.sections.psychActivity")}>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.psychWau")} value={psychActivity.wau_sessions ?? 0} />
          <StatCard label={t("productAnalytics.kpi.psychViews")} value={psychActivity.page_views ?? 0} />
          <StatCard label={t("productAnalytics.kpi.psychNotes")} value={psychActivity.notes_created ?? 0} />
        </div>
      </Section>

      <Section title={t("productAnalytics.sections.coachActivity")}>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.coachWau")} value={coachActivity.wau_sessions ?? 0} />
          <StatCard label={t("productAnalytics.kpi.coachViews")} value={coachActivity.page_views ?? 0} />
          <StatCard label={t("productAnalytics.kpi.coachRecs")} value={coachActivity.recommendations_shared ?? 0} />
        </div>
      </Section>

      <Section title={t("productAnalytics.sections.appointments")}>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.apptTotal")} value={appointments.total ?? 0} />
          <StatCard label={t("productAnalytics.kpi.apptPending")} value={appointments.pending ?? 0} />
          <StatCard label={t("productAnalytics.kpi.apptCompleted")} value={appointments.completed ?? 0} />
          <StatCard label={t("productAnalytics.kpi.apptCancelled")} value={appointments.cancelled ?? 0} />
        </div>
      </Section>

      <Section title={t("productAnalytics.sections.messages")}>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.msgTotal")} value={messages.total ?? 0} />
          <StatCard label={t("productAnalytics.kpi.msgFromAthletes")} value={messages.from_athletes ?? 0} />
          <StatCard label={t("productAnalytics.kpi.msgFromPsych")} value={messages.from_psychologists ?? 0} />
          <StatCard label={t("productAnalytics.kpi.msgUnread")} value={messages.unread ?? 0} />
        </div>
      </Section>

      <Section title={t("productAnalytics.sections.alerts")}>
        <div className="stats-row stats-row--compact">
          <StatCard label={t("productAnalytics.kpi.alertsGenerated")} value={alerts.generated ?? 0} />
          <StatCard label={t("productAnalytics.kpi.alertsResolved")} value={alerts.resolved ?? 0} />
          <StatCard label={t("productAnalytics.kpi.prioritiesReviewed")} value={alerts.priorities_reviewed ?? 0} />
        </div>
      </Section>

      <Section title={t("productAnalytics.sections.featureAdoption")} subtitle={t("productAnalytics.sections.featureAdoptionHint")}>
        <ul className="product-analytics__feature-list">
          {Object.entries(features).length ? (
            Object.entries(features).map(([name, count]) => (
              <li key={name}>
                <span>{name}</span>
                <strong>{count}</strong>
              </li>
            ))
          ) : (
            <li className="type-caption">{t("productAnalytics.featuresEmpty")}</li>
          )}
        </ul>
      </Section>

      <Section title={t("productAnalytics.sections.navigation")} subtitle={t("productAnalytics.sections.navigationHint")}>
        <ul className="product-analytics__feature-list">
          {pageViews.length ? (
            pageViews.map((row) => (
              <li key={row.page}>
                <span>{row.page}</span>
                <strong>{row.views}</strong>
              </li>
            ))
          ) : (
            <li className="type-caption">{t("productAnalytics.navigationEmpty")}</li>
          )}
        </ul>
      </Section>
    </div>
  )
}
