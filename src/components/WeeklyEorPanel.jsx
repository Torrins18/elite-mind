import { computeWeeklyIndexes } from "../lib/weeklyEor"
import { EorIndexSummary } from "./EorIndexSummary"

export function WeeklyEorPanel({ checkIn, t }) {
  const indexes = computeWeeklyIndexes(checkIn)

  if (!indexes) {
    return <p className="empty-state">{t("psychologist.noWeeklyEor")}</p>
  }

  const coachLow = indexes.coachCommunication != null && indexes.coachCommunication <= 4
  const roleLow = indexes.roleClarity != null && indexes.roleClarity <= 4

  return (
    <div className="weekly-eor-panel">
      <EorIndexSummary indexes={indexes} variant="psychologist" t={t} />

      {(coachLow || roleLow || indexes.wantsPsychologistTalk) && (
        <ul className="weekly-eor-panel__alerts">
          {coachLow && (
            <li className="weekly-eor-panel__alert weekly-eor-panel__alert--danger">
              {t("psychologist.eorAlertCoachCommunication", {
                value: indexes.coachCommunication,
              })}
            </li>
          )}
          {roleLow && (
            <li className="weekly-eor-panel__alert weekly-eor-panel__alert--warning">
              {t("psychologist.eorAlertRoleClarity", { value: indexes.roleClarity })}
            </li>
          )}
          {indexes.wantsPsychologistTalk && (
            <li className="weekly-eor-panel__alert weekly-eor-panel__alert--key">
              {t(`psychologist.eorPsychologistContact_${indexes.psychologistContact}`)}
            </li>
          )}
        </ul>
      )}

      {(checkIn.weekly_went_well || checkIn.weekly_main_difficulty || checkIn.next_goal) && (
        <dl className="weekly-eor-panel__notes">
          {checkIn.weekly_went_well && (
            <div>
              <dt>{t("checkIn.eorWentWell")}</dt>
              <dd>{checkIn.weekly_went_well}</dd>
            </div>
          )}
          {checkIn.weekly_main_difficulty && (
            <div>
              <dt>{t("checkIn.eorMainDifficulty")}</dt>
              <dd>{checkIn.weekly_main_difficulty}</dd>
            </div>
          )}
          {checkIn.next_goal && (
            <div>
              <dt>{t("checkIn.eorNextGoal")}</dt>
              <dd>{checkIn.next_goal}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
