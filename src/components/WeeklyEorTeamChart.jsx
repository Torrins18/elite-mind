import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import {
  CHART_AXIS_TICK,
  CHART_COLORS,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
} from "../lib/chartColors"
import { useTranslation } from "../i18n/LanguageContext"
import { formatDate } from "../lib/dates"
import { Card } from "./ui/Card"
import { ChartLegendIcon } from "./ui/ChartLegendIcon"

const CHART_LINES = {
  coach: [
    { key: "mental", stroke: "#64748B", labelKey: "psychologist.eorIndexMental", icon: "mental" },
    {
      key: "wellbeing",
      stroke: CHART_COLORS.healthy,
      labelKey: "psychologist.eorIndexWellbeing",
      icon: "wellbeing",
    },
    { key: "social", stroke: CHART_COLORS.followup, labelKey: "psychologist.eorIndexSocial", icon: "social" },
  ],
  psychologist: [
    { key: "mental", stroke: "#64748B", labelKey: "psychologist.eorIndexMental", icon: "mental" },
    {
      key: "wellbeing",
      stroke: CHART_COLORS.healthy,
      labelKey: "psychologist.eorIndexWellbeing",
      icon: "wellbeing",
    },
    { key: "social", stroke: CHART_COLORS.followup, labelKey: "psychologist.eorIndexSocial", icon: "social" },
    {
      key: "coachCommunication",
      stroke: "#64748B",
      labelKey: "checkIn.eorCoachCommunication",
      icon: "coachCommunication",
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
            <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="date" tick={CHART_AXIS_TICK} />
            <YAxis domain={[0, 10]} tick={CHART_AXIS_TICK} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
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
          <span key={line.key} className="chart-legend__item">
            <ChartLegendIcon name={line.icon} />
            {t(line.labelKey)}
          </span>
        ))}
      </div>
    </Card>
  )
}

/** @deprecated Use WeeklyEorChart */
export const WeeklyEorTeamChart = WeeklyEorChart
