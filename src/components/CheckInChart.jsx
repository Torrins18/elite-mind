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

export function CheckInChart({
  checkIns,
  showStress = true,
  title,
  subtitle,
  domain = [1, 10],
}) {
  const { t, lang } = useTranslation()

  const data = [...checkIns]
    .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))
    .map((c) => ({
      date: formatDate(c.check_in_date, lang),
      mood: c.mood,
      energy: c.energy,
      stress: c.stress,
    }))

  const cardTitle = title || t("chart.title7d")
  const cardSubtitle = subtitle || t("chart.subtitle7d")

  if (!data.length) {
    return (
      <Card title={cardTitle} subtitle={cardSubtitle}>
        <p className="empty-state">{t("chart.noData")}</p>
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
            <YAxis domain={domain} tick={CHART_AXIS_TICK} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="mood" stroke="#64748B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="energy" stroke={CHART_COLORS.followup} strokeWidth={2} dot={false} />
            {showStress && (
              <Line type="monotone" dataKey="stress" stroke={CHART_COLORS.risk} strokeWidth={2} dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        <span className="chart-legend__item">
          <ChartLegendIcon name="mood" /> {t("chart.mood")}
        </span>
        <span className="chart-legend__item">
          <ChartLegendIcon name="energy" /> {t("chart.energy")}
        </span>
        {showStress && (
          <span className="chart-legend__item">
            <ChartLegendIcon name="stress" /> {t("chart.stress")}
          </span>
        )}
      </div>
    </Card>
  )
}
