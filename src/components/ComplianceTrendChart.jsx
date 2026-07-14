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
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} unit="%" />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 12,
              }}
              formatter={(value, _name, item) => [
                `${value}% (${item.payload.done}/${item.payload.total})`,
                t("compliance.tooltipLabel"),
              ]}
            />
            <Line
              type="monotone"
              dataKey="compliance"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
