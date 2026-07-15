import { useEffect, useRef, useState } from "react"
import { useTranslation } from "../../i18n/LanguageContext"

const STATUS_CLASS = {
  stable: "team-clinical-card--stable",
  watch: "team-clinical-card--watch",
  observation: "team-clinical-card--observation",
  critical: "team-clinical-card--critical",
  unknown: "team-clinical-card--unknown",
}

const HEALTH_CLASS = {
  healthy: "team-clinical-card__health--healthy",
  monitoring: "team-clinical-card__health--monitoring",
  priority: "team-clinical-card__health--priority",
}

const TREND_ICON = {
  up: "↑",
  down: "↓",
  stable: "→",
}

function formatScore(value) {
  if (value == null) return "—"
  return Number(value).toFixed(1)
}

function TrendKpi({ icon, label, metric, t }) {
  const trendKey = `teams.trend.${metric.direction}`
  const deltaLabel =
    metric.direction === "stable" || metric.delta === 0
      ? t("teams.trendStableShort")
      : t("teams.trendDelta", {
          delta: metric.delta > 0 ? `+${metric.delta.toFixed(1)}` : metric.delta.toFixed(1),
        })

  return (
    <div className={`team-clinical-card__kpi team-clinical-card__kpi--${metric.level}`}>
      <span className="team-clinical-card__kpi-icon" aria-hidden>
        {icon}
      </span>
      <span className="team-clinical-card__kpi-value">{formatScore(metric.value)}</span>
      <span className="team-clinical-card__kpi-label">{label}</span>
      <span className={`team-clinical-card__kpi-trend team-clinical-card__kpi-trend--${metric.direction}`}>
        {TREND_ICON[metric.direction]} {t(trendKey)}
      </span>
      {metric.direction !== "stable" && metric.delta !== 0 ? (
        <span className="team-clinical-card__kpi-delta">{deltaLabel}</span>
      ) : null}
    </div>
  )
}

function TeamCardMenu({ onDelete, onClose }) {
  const { t } = useTranslation()
  const menuRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) onClose()
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [onClose])

  return (
    <div className="team-clinical-card__menu" ref={menuRef}>
      <button
        type="button"
        className="team-clinical-card__menu-item team-clinical-card__menu-item--danger"
        onClick={onDelete}
      >
        {t("teams.delete")}
      </button>
    </div>
  )
}

function ChangeChip({ label, direction }) {
  return (
    <span className={`team-clinical-card__change team-clinical-card__change--${direction}`}>
      {TREND_ICON[direction]} {label}
    </span>
  )
}

export function TeamClinicalCard({
  overview,
  copiedTeamId,
  onViewTeam,
  onCopyInvitation,
  onRename,
  onDelete,
}) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const {
    team,
    athleteCount,
    reviewsDone,
    pending,
    alertCount,
    status,
    metrics,
    lastReviewDays,
    healthScore,
    alertFactors,
    complianceRate,
  } = overview
  const copied = copiedTeamId === team.id
  const showFactors = alertFactors.length > 0 && status !== "stable"

  const lastReviewLabel =
    lastReviewDays == null
      ? t("teams.lastReviewNever")
      : lastReviewDays === 0
        ? t("teams.lastReviewToday")
        : lastReviewDays === 1
          ? t("teams.lastReviewYesterday")
          : t("teams.lastReviewDaysAgo", { days: lastReviewDays })

  const healthEmoji =
    healthScore.label === "healthy" ? "🟢" : healthScore.label === "monitoring" ? "🟡" : "🔴"

  return (
    <article className={`team-clinical-card ${STATUS_CLASS[status] || ""}`}>
      <div className="team-clinical-card__top">
        <div className="team-clinical-card__identity">
          <h3 className="team-clinical-card__name">{team.name}</h3>
          <span className={`team-clinical-card__badge team-clinical-card__badge--${status}`}>
            {t(`teams.status.${status}`)}
          </span>
        </div>
        <div className={`team-clinical-card__health ${HEALTH_CLASS[healthScore.label]}`}>
          <span className="team-clinical-card__health-score">
            {healthEmoji} {healthScore.score}
          </span>
          <span className="team-clinical-card__health-label">
            {t(`teams.healthLabel.${healthScore.label}`)}
          </span>
        </div>
      </div>

      <div className="team-clinical-card__snapshot">
        <span>{t("teams.cardAthletesShort", { count: athleteCount })}</span>
        <span className="team-clinical-card__snapshot-sep">·</span>
        <span>
          {t("teams.cardParticipation", {
            done: reviewsDone,
            pct: Math.round(complianceRate * 100),
          })}
        </span>
        {pending > 0 ? (
          <>
            <span className="team-clinical-card__snapshot-sep">·</span>
            <span className="team-clinical-card__snapshot-warn">
              {t("teams.cardPendingShort", { count: pending })}
            </span>
          </>
        ) : null}
        {alertCount > 0 ? (
          <>
            <span className="team-clinical-card__snapshot-sep">·</span>
            <span className="team-clinical-card__snapshot-alert">
              {t("teams.cardAlertsShort", { count: alertCount })}
            </span>
          </>
        ) : null}
      </div>

      <div className="team-clinical-card__kpi-grid">
        <TrendKpi icon="🧠" label={t("teams.metricShort.mental")} metric={metrics.mental} t={t} />
        <TrendKpi icon="💚" label={t("teams.metricShort.wellbeing")} metric={metrics.wellbeing} t={t} />
        <TrendKpi icon="⚡" label={t("teams.metricShort.energy")} metric={metrics.energy} t={t} />
        <TrendKpi icon="🤝" label={t("teams.metricShort.social")} metric={metrics.social} t={t} />
      </div>

      {showFactors ? (
        <div className="team-clinical-card__factors">
          <p className="team-clinical-card__factors-title">{t("teams.alertFactorsTitle")}</p>
          <ul>
            {alertFactors.map((factor) => (
              <li key={factor.key}>{t(`teams.alertFactor.${factor.key}`, factor)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="team-clinical-card__timeline">
        <span>{t("teams.lastReviewShort")}</span>
        <strong>{lastReviewLabel}</strong>
      </div>

      <div className="team-clinical-card__changes">
        <span className="team-clinical-card__changes-label">{t("teams.last7Days")}</span>
        <div className="team-clinical-card__changes-row">
          <ChangeChip label={t("teams.metricShort.mental")} direction={metrics.mental.direction} />
          <ChangeChip label={t("teams.metricShort.energy")} direction={metrics.energy.direction} />
          <ChangeChip label={t("teams.metricShort.social")} direction={metrics.social.direction} />
          <ChangeChip
            label={t("teams.metricShort.coach")}
            direction={metrics.coachCommunication.direction}
          />
        </div>
      </div>

      <footer className="team-clinical-card__footer">
        <button
          type="button"
          className="team-clinical-card__footer-primary"
          onClick={() => onViewTeam(team.id)}
        >
          → {t("teams.viewTeam")}
        </button>
        <div className="team-clinical-card__footer-secondary">
          {team.join_token ? (
            <button
              type="button"
              className={copied ? "team-clinical-card__footer-link--done" : "team-clinical-card__footer-link"}
              onClick={() => onCopyInvitation(team)}
            >
              {copied ? t("teams.invitationCopiedShort") : t("teams.copyInvitationShort")}
            </button>
          ) : null}
          <button type="button" className="team-clinical-card__footer-link" onClick={() => onRename(team.id)}>
            {t("teams.edit")}
          </button>
          <div className="team-clinical-card__menu-wrap">
            <button
              type="button"
              className="team-clinical-card__footer-more"
              aria-label={t("teams.menuActions")}
              onClick={() => setMenuOpen((open) => !open)}
            >
              ⋮
            </button>
            {menuOpen ? (
              <TeamCardMenu
                onDelete={() => {
                  setMenuOpen(false)
                  onDelete(team.id)
                }}
                onClose={() => setMenuOpen(false)}
              />
            ) : null}
          </div>
        </div>
      </footer>
    </article>
  )
}
