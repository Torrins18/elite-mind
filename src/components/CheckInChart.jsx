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

export function CheckInChart({ checkIns, showStress = true }) {
  const { t, lang } = useTranslation()

  const data = [...checkIns]
    .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))
    .map((c) => ({
      date: formatDate(c.check_in_date, lang),
      mood: c.mood,
      energy: c.energy,
      stress: c.stress,
    }))

  if (!data.length) {
    return (
      <Card title={t("chart.trends")} subtitle={t("chart.trendsEmpty")}>
        <p className="empty-state">{t("chart.noData")}</p>
      </Card>
    )
  }

  return (
    <Card title={t("chart.title7d")} subtitle={t("chart.subtitle7d")}>
      <div className="chart-wrap chart-wrap--responsive">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis domain={[1, 10]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 12,
              }}
            />
            <Line type="monotone" dataKey="mood" stroke="#22d3ee" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="energy" stroke="#fbbf24" strokeWidth={2} dot={false} />
            {showStress && (
              <Line type="monotone" dataKey="stress" stroke="#f87171" strokeWidth={2} dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        <span><i className="dot dot--cyan" /> {t("chart.mood")}</span>
        <span><i className="dot dot--gold" /> {t("chart.energy")}</span>
        {showStress && <span><i className="dot dot--red" /> {t("chart.stress")}</span>}
      </div>
    </Card>
  )
}
