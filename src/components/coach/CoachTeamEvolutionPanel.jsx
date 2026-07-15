import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Card } from "../ui/Card"
import { EmptyState } from "../ui/EmptyState"
import { useTranslation } from "../../i18n/LanguageContext"
import { formatDate } from "../../lib/dates"
import {
  CHART_AXIS_TICK,
  CHART_COLORS,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
} from "../../lib/chartColors"

const SERIES = [
  { key: "mental", labelKey: "coach.evolution.mental", stroke: "#64748B" },
  { key: "participation", labelKey: "coach.evolution.participation", stroke: CHART_COLORS.healthy },
  { key: "communication", labelKey: "coach.evolution.communication", stroke: "#2563EB" },
  { key: "cohesion", labelKey: "coach.evolution.cohesion", stroke: CHART_COLORS.followup },
  { key: "energy", labelKey: "coach.evolution.energy", stroke: "#A16207" },
]

export function CoachTeamEvolutionPanel({ weeklyMetrics }) {
  const { t, lang } = useTranslation()

  const data = (weeklyMetrics || []).map((row) => ({
    date: formatDate(row.weekDate, lang),
    mental: row.mental,
    participation: row.participation,
    communication: row.communication,
    cohesion: row.cohesion,
    energy: row.energy,
  }))

  if (!data.length) {
    return (
      <Card title={t("coach.evolutionTitle")} subtitle={t("coach.evolutionSubtitle")}>
        <EmptyState
          icon="chart"
          title={t("ux.emptyTeamReviewsTitle")}
          description={t("ux.emptyTeamReviewsBody")}
        />
      </Card>
    )
  }

  return (
    <Card title={t("coach.evolutionTitle")} subtitle={t("coach.evolutionSubtitle")}>
      <div className="chart-wrap chart-wrap--responsive chart-wrap--tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="date" tick={CHART_AXIS_TICK} />
            <YAxis yAxisId="left" domain={[0, 10]} tick={CHART_AXIS_TICK} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={CHART_AXIS_TICK} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            {SERIES.map((line) => (
              <Line
                key={line.key}
                yAxisId={line.key === "participation" ? "right" : "left"}
                type="monotone"
                dataKey={line.key}
                stroke={line.stroke}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend chart-legend--wrap">
        {SERIES.map((line) => (
          <span key={line.key} className="chart-legend__item">
            {t(line.labelKey)}
          </span>
        ))}
      </div>
      <p className="coach-evolution-note">{t("coach.evolutionNote")}</p>
    </Card>
  )
}
