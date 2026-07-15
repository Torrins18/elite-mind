const INDICATOR_KEYS = [
  { key: "confidence", emoji: "🧠", labelKey: "coach.indicators.confidence" },
  { key: "energy", emoji: "⚡", labelKey: "coach.indicators.energy" },
  { key: "cohesion", emoji: "🤝", labelKey: "coach.indicators.cohesion" },
  { key: "communication", emoji: "🗣", labelKey: "coach.indicators.communication" },
  { key: "recovery", emoji: "💪", labelKey: "coach.indicators.recovery" },
  { key: "participation", emoji: "📈", labelKey: "coach.indicators.participation", suffix: "%" },
]

function toneForValue(key, value) {
  if (value == null) return "muted"
  if (key === "participation") {
    if (value < 40) return "watch"
    if (value >= 70) return "good"
    return "neutral"
  }
  if (value <= 4) return "watch"
  if (value >= 7) return "good"
  return "neutral"
}

export function CoachTeamIndicators({ indicators, t }) {
  return (
    <section className="coach-indicators" aria-label={t("coach.indicatorsTitle")}>
      <h3 className="coach-indicators__title">{t("coach.indicatorsTitle")}</h3>
      <p className="coach-indicators__subtitle">{t("coach.indicatorsSubtitle")}</p>
      <ul className="coach-indicators__grid">
        {INDICATOR_KEYS.map((item) => {
          const value = indicators[item.key]
          const tone = toneForValue(item.key, value)
          const display =
            value == null
              ? "—"
              : item.suffix
                ? `${value}${item.suffix}`
                : `${value}/10`

          return (
            <li key={item.key} className={`coach-indicators__item coach-indicators__item--${tone}`}>
              <span className="coach-indicators__emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="coach-indicators__label">{t(item.labelKey)}</span>
              <strong className="coach-indicators__value">{display}</strong>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
