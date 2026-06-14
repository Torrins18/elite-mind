import { Card } from "../ui/Card"
import { Button } from "../ui/Button"

export function PsychologistInbox({
  appointmentRequests,
  psychologistMessages,
  athleteMap,
  teamMap,
  t,
  onMarkAppointmentHandled,
  onMarkMessageRead,
  onOpenAthlete,
}) {
  if (appointmentRequests.length === 0 && psychologistMessages.length === 0) {
    return null
  }

  return (
    <div className="psych-inbox-grid">
      <Card
        title={t("psychologist.pendingAppointments")}
        subtitle={t("psychologist.pendingAppointmentsSubtitle")}
      >
        {appointmentRequests.length === 0 ? (
          <p className="empty-state">{t("psychologist.noPendingAppointments")}</p>
        ) : (
          <ul className="inbox-list">
            {appointmentRequests.map((item) => {
              const athlete = athleteMap[item.user_id]
              return (
                <li key={item.id} className="inbox-list__item">
                  <div className="inbox-list__meta">
                    <strong>{athlete?.name || t("psychologist.unknownAthlete")}</strong>
                    <span>
                      {athlete?.team_id ? teamMap[athlete.team_id] : t("risk.noData")}
                      {" · "}
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="inbox-list__body">
                    {item.message || t("psychologist.appointmentNoMessage")}
                  </p>
                  <div className="inbox-list__actions">
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
      </Card>

      <Card
        title={t("psychologist.unreadMessages")}
        subtitle={t("psychologist.unreadMessagesSubtitle")}
      >
        {psychologistMessages.length === 0 ? (
          <p className="empty-state">{t("psychologist.noUnreadMessages")}</p>
        ) : (
          <ul className="inbox-list">
            {psychologistMessages.map((item) => {
              const athlete = athleteMap[item.user_id]
              return (
                <li key={item.id} className="inbox-list__item">
                  <div className="inbox-list__meta">
                    <strong>{athlete?.name || t("psychologist.unknownAthlete")}</strong>
                    <span>
                      {athlete?.team_id ? teamMap[athlete.team_id] : t("risk.noData")}
                      {" · "}
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <blockquote className="inbox-list__quote">{item.message}</blockquote>
                  <div className="inbox-list__actions">
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
      </Card>
    </div>
  )
}
