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

export function ComplianceTrendChart({ trend, title, subtitle }) {
  const { t, lang } = useTranslation()

  const data = (trend || []).map((row) => ({
    date: formatDate(row.weekDate, lang),
    compliance: row.compliance,
    done: row.done,
    total: row.total,
  }))

  const cardTitle = title || t("compliance.trendTitle")
  const cardSubtitle = subtitle || t("compliance.trendSubtitle")

  if (!data.length) {
    return (
      <Card title={cardTitle} subtitle={cardSubtitle}>
        <p className="empty-state">{t("compliance.noTrend")}</p>
      </Card>
    )
  }

  return (
    <Card title={cardTitle} subtitle={cardSubtitle}>
      <div className="chart-wrap chart-wrap--responsive">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="date" tick={CHART_AXIS_TICK} />
            <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} unit="%" />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value, _name, item) => [
                `${value}% (${item.payload.done}/${item.payload.total})`,
                t("compliance.tooltipLabel"),
              ]}
            />
            <Line
              type="monotone"
              dataKey="compliance"
              stroke={CHART_COLORS.nav}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
