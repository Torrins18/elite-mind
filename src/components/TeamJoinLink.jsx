import { useTranslation } from "../i18n/LanguageContext"
import { buildAthleteJoinLink } from "../lib/invites"
import { Button } from "./ui/Button"

export function TeamJoinLink({ joinToken, teamName, onCopied }) {
  const { t } = useTranslation()

  if (!joinToken) {
    return <p className="auth-form__hint">{t("teams.joinLinkMissing")}</p>
  }

  const link = buildAthleteJoinLink(joinToken)

  const copyLink = async () => {
    await navigator.clipboard.writeText(link)
    onCopied?.(t("teams.joinLinkCopied"))
  }

  return (
    <div className="team-join-link">
      {teamName ? <strong className="team-join-link__name">{teamName}</strong> : null}
      <div className="invite-actions">
        <input className="invite-link" readOnly value={link} />
        <Button variant="ghost" type="button" onClick={copyLink}>
          {t("teams.copyJoinLink")}
        </Button>
      </div>
      <p className="auth-form__hint">{t("teams.joinLinkHint")}</p>
    </div>
  )
}
