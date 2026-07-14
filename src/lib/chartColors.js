/** Chart palette — clinical SaaS accents */
export const CHART_COLORS = {
  nav: "#2563EB",
  healthy: "#16A34A",
  followup: "#F59E0B",
  risk: "#DC2626",
  grid: "#E8EDF3",
  axis: "#94A3B8",
  tooltipBg: "#FAFBFC",
  tooltipBorder: "#E8EDF3",
}

export const CHART_TOOLTIP_STYLE = {
  background: CHART_COLORS.tooltipBg,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(30, 41, 59, 0.04)",
  color: "#1E293B",
  fontSize: 13,
}

export const CHART_AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 }

export const CHART_GRID_STROKE = CHART_COLORS.grid
