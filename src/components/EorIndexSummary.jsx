const VARIANTS = {
  coach: [
    { key: "mental", labelKey: "psychologist.eorIndexMental", dot: "cyan" },
    { key: "wellbeing", labelKey: "psychologist.eorIndexWellbeing", dot: "green" },
    { key: "social", labelKey: "psychologist.eorIndexSocial", dot: "gold" },
  ],
  psychologist: [
    { key: "mental", labelKey: "psychologist.eorIndexMental", dot: "cyan" },
    { key: "wellbeing", labelKey: "psychologist.eorIndexWellbeing", dot: "green" },
    { key: "social", labelKey: "psychologist.eorIndexSocial", dot: "gold" },
    { key: "coachCommunication", labelKey: "checkIn.eorCoachCommunication", dot: "red" },
  ],
}

function toneForValue(value) {
  if (value == null) return "muted"
  if (value <= 4) return "danger"
  if (value <= 6) return "warning"
  return "good"
}

export function EorIndexSummary({ indexes, variant = "coach", t, compact = false }) {
  const items = VARIANTS[variant] || VARIANTS.coach

  if (!indexes) {
    return <p className="empty-state">{t("psychologist.noWeeklyEor")}</p>
  }

  return (
    <div className={`eor-index-summary${compact ? " eor-index-summary--compact" : ""}`}>
      {items.map((item) => {
        const value = indexes[item.key]
        const tone = toneForValue(value)
        return (
          <div key={item.key} className={`eor-index-summary__item eor-index-summary__item--${tone}`}>
            <span className="eor-index-summary__label">
              <i className={`dot dot--${item.dot}`} />
              {t(item.labelKey)}
            </span>
            <strong className="eor-index-summary__value">{value ?? "—"}</strong>
          </div>
        )
      })}
    </div>
  )
}
