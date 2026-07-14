/** Chart & data visualization palette — aligned with premium UI accents */
export const CHART_COLORS = {
  nav: "#2563EB",
  healthy: "#059669",
  followup: "#EA580C",
  risk: "#DC2626",
  grid: "#E2E8F0",
  axis: "#94A3B8",
  tooltipBg: "#FFFFFF",
  tooltipBorder: "#E2E8F0",
}

export const CHART_TOOLTIP_STYLE = {
  background: CHART_COLORS.tooltipBg,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: 10,
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  color: "#0f172a",
  fontSize: 13,
}

export const CHART_AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 }

export const CHART_GRID_STROKE = CHART_COLORS.grid
