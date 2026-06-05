import { useTranslation } from "../i18n/LanguageContext"

export function RolePicker({ value, onChange, showCoachHint = true }) {
  const { t } = useTranslation()

  return (
    <fieldset className="role-picker">
      <legend>{t("login.roleTitle")}</legend>
      <label className="role-picker__option">
        <input
          type="radio"
          name="accountRole"
          value="athlete"
          checked={value === "athlete"}
          onChange={() => onChange("athlete")}
        />
        <span>
          <strong>{t("roles.athlete")}</strong>
          <small>{t("login.athleteRoleHint")}</small>
        </span>
      </label>
      <label className="role-picker__option">
        <input
          type="radio"
          name="accountRole"
          value="coach"
          checked={value === "coach"}
          onChange={() => onChange("coach")}
        />
        <span>
          <strong>{t("roles.coach")}</strong>
          <small>{t("login.coachRoleHint")}</small>
        </span>
      </label>
      {showCoachHint && value === "coach" && (
        <p className="role-hint">{t("login.coachApprovalHint")}</p>
      )}
    </fieldset>
  )
}
