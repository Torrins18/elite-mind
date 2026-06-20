import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { useTranslation } from "../i18n/LanguageContext"
import { formatDate } from "../lib/dates"
import { Card } from "./ui/Card"

const CHART_LINES = {
  coach: [
    { key: "mental", stroke: "#22d3ee", labelKey: "psychologist.eorIndexMental", dot: "cyan" },
    {
      key: "wellbeing",
      stroke: "#34d399",
      labelKey: "psychologist.eorIndexWellbeing",
      dot: "green",
    },
    { key: "social", stroke: "#fbbf24", labelKey: "psychologist.eorIndexSocial", dot: "gold" },
  ],
  psychologist: [
    { key: "mental", stroke: "#22d3ee", labelKey: "psychologist.eorIndexMental", dot: "cyan" },
    {
      key: "wellbeing",
      stroke: "#34d399",
      labelKey: "psychologist.eorIndexWellbeing",
      dot: "green",
    },
    { key: "social", stroke: "#fbbf24", labelKey: "psychologist.eorIndexSocial", dot: "gold" },
    {
      key: "coachCommunication",
      stroke: "#f87171",
      labelKey: "checkIn.eorCoachCommunication",
      dot: "red",
    },
  ],
}

export function WeeklyEorChart({
  weeklyTrend,
  title,
  subtitle,
  emptyTitle,
  emptySubtitle,
  variant = "psychologist",
}) {
  const { t, lang } = useTranslation()
  const lines = CHART_LINES[variant] || CHART_LINES.psychologist

  const data = weeklyTrend.map((row) => ({
    date: formatDate(row.weekDate, lang),
    mental: row.mental,
    wellbeing: row.wellbeing,
    social: row.social,
    coachCommunication: row.coachCommunication,
  }))

  const cardTitle = title || t("chart.eorTitle")
  const cardSubtitle = subtitle || t(`chart.eorSubtitle_${variant}`)
  const emptyCardTitle = emptyTitle || cardTitle
  const emptyCardSubtitle = emptySubtitle || t("chart.eorEmpty")

  if (!data.length) {
    return (
      <Card title={emptyCardTitle} subtitle={emptyCardSubtitle}>
        <p className="empty-state">{t("chart.eorNoData")}</p>
      </Card>
    )
  }

  return (
    <Card title={cardTitle} subtitle={cardSubtitle}>
      <div className="chart-wrap chart-wrap--responsive chart-wrap--tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis domain={[0, 10]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 12,
              }}
            />
            {lines.map((line) => (
              <Line
                key={line.key}
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
        {lines.map((line) => (
          <span key={line.key}>
            <i className={`dot dot--${line.dot}`} /> {t(line.labelKey)}
          </span>
        ))}
      </div>
    </Card>
  )
}

/** @deprecated Use WeeklyEorChart */
export const WeeklyEorTeamChart = WeeklyEorChart
