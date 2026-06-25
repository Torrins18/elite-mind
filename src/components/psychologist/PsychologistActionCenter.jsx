import { Button } from "../ui/Button"

export function PsychologistActionCenter({
  alerts,
  appointmentRequests,
  psychologistMessages,
  teamSummaries,
  athleteMap,
  t,
  onOpenAthlete,
  onDismissAlert,
  onMarkAppointmentHandled,
  onMarkMessageRead,
  onOpenTeam,
}) {
  const activeAlerts = alerts.filter((alert) => alert.status === "active")
  const reviewedAlerts = alerts.filter((alert) => alert.status === "reviewed")
  const highAlerts = activeAlerts.filter((alert) => alert.severity === "high")
  const mediumAlerts = activeAlerts.filter((alert) => alert.severity === "medium")

  const renderAlertItem = (alert, { showDismiss = true, reviewed = false } = {}) => (
    <li
      key={alert.dbId || `${alert.athleteId}-${alert.id}`}
      className={reviewed ? "psych-action-center__item psych-action-center__item--reviewed" : "psych-action-center__item"}
    >
      <div>
        <strong>{alert.athleteName}</strong>
        <span>{t(`psychologist.alert.${alert.id}`, alert)}</span>
        {reviewed && <em className="psych-action-center__reviewed-tag">{t("psychologist.alertReviewed")}</em>}
      </div>
      <div className="psych-action-center__row-actions">
        {showDismiss && alert.dbId && (
          <Button variant="ghost" className="btn--danger-text" onClick={() => onDismissAlert(alert.dbId)}>
            {t("psychologist.dismissAlert")}
          </Button>
        )}
        <Button variant="ghost" onClick={() => onOpenAthlete(alert.athleteId)}>
          {t("psychologist.viewAthlete")}
        </Button>
      </div>
    </li>
  )

  return (
    <div className="psych-action-center">
      <section className="psych-action-center__block psych-action-center__block--danger">
        <header>
          <span className="psych-action-center__icon" aria-hidden>
            🔴
          </span>
          <div>
            <h2>
              {t("psychologist.actionAlerts")}
              {activeAlerts.length > 0 && (
                <span className="psych-action-center__count">{activeAlerts.length}</span>
              )}
            </h2>
            <p>{t("psychologist.actionAlertsSubtitle")}</p>
          </div>
        </header>
        {activeAlerts.length === 0 && reviewedAlerts.length === 0 ? (
          <p className="psych-action-center__empty">{t("psychologist.noActiveAlerts")}</p>
        ) : (
          <ul className="psych-action-center__list">
            {[...highAlerts, ...mediumAlerts].slice(0, 8).map((alert) => renderAlertItem(alert))}
            {reviewedAlerts.slice(0, 4).map((alert) => renderAlertItem(alert, { reviewed: true }))}
          </ul>
        )}
      </section>

      <section className="psych-action-center__block psych-action-center__block--warning">
        <header>
          <span className="psych-action-center__icon" aria-hidden>
            🟡
          </span>
          <div>
            <h2>{t("psychologist.actionAppointments")}</h2>
            <p>{t("psychologist.pendingAppointmentsSubtitle")}</p>
          </div>
        </header>
        {appointmentRequests.length === 0 ? (
          <p className="psych-action-center__empty">{t("psychologist.noPendingAppointments")}</p>
        ) : (
          <ul className="psych-action-center__list">
            {appointmentRequests.map((item) => {
              const athlete = athleteMap[item.user_id]
              return (
                <li key={item.id} className="psych-action-center__item">
                  <div>
                    <strong>{athlete?.name || t("psychologist.unknownAthlete")}</strong>
                    <span>
                      {item.message || t("psychologist.appointmentNoMessage")}
                      {" · "}
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="psych-action-center__row-actions">
                    <Button variant="ghost" onClick={() => onMarkAppointmentHandled(item.id)}>
                      {t("psychologist.markAppointmentHandled")}
                    </Button>
                    {athlete && (
                      <Button variant="ghost" onClick={() => onOpenAthlete(athlete.id)}>
                        {t("psychologist.viewAthlete")}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="psych-action-center__block psych-action-center__block--success">
        <header>
          <span className="psych-action-center__icon" aria-hidden>
            🟢
          </span>
          <div>
            <h2>{t("psychologist.actionMessages")}</h2>
            <p>{t("psychologist.unreadMessagesSubtitle")}</p>
          </div>
        </header>
        {psychologistMessages.length === 0 ? (
          <p className="psych-action-center__empty">{t("psychologist.noUnreadMessages")}</p>
        ) : (
          <ul className="psych-action-center__list">
            {psychologistMessages.map((item) => {
              const athlete = athleteMap[item.user_id]
              return (
                <li key={item.id} className="psych-action-center__item">
                  <div>
                    <strong>{athlete?.name || t("psychologist.unknownAthlete")}</strong>
                    <span>{item.message}</span>
                  </div>
                  <div className="psych-action-center__row-actions">
                    <Button variant="ghost" onClick={() => onMarkMessageRead(item.id)}>
                      {t("psychologist.markMessageRead")}
                    </Button>
                    {athlete && (
                      <Button variant="ghost" onClick={() => onOpenAthlete(athlete.id)}>
                        {t("psychologist.viewAthlete")}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="psych-action-center__block psych-action-center__block--neutral">
        <header>
          <span className="psych-action-center__icon" aria-hidden>
            📊
          </span>
          <div>
            <h2>{t("psychologist.actionCompliance")}</h2>
            <p>{t("psychologist.actionComplianceSubtitle")}</p>
          </div>
        </header>
        <ul className="psych-compliance-list">
          {teamSummaries.map(({ team, athletes: teamAthletes, summary }) => {
            const total = teamAthletes.length
            const done = summary.checkedInThisWeek
            const pct = total ? Math.round((done / total) * 100) : 0
            return (
              <li key={team.id} className="psych-compliance-list__item">
                <div>
                  <strong>{team.name}</strong>
                  <span>
                    {t("psychologist.complianceRatio", { done, total, pct })}
                  </span>
                </div>
                <Button variant="ghost" onClick={() => onOpenTeam(team.id)}>
                  {t("psychologist.openTeam")}
                </Button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
