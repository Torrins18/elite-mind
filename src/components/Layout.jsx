import { useTranslation } from "../i18n/LanguageContext"
import { BrandLogo } from "./BrandLogo"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { PrivacyNotice } from "./PrivacyNotice"
import { Button } from "./ui/Button"

export function Layout({ profile, session, teamName, onLogout, children }) {
  const { t } = useTranslation()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <BrandLogo variant="bar" />
        </div>

        <div className="topbar__user">
          <LanguageSwitcher />
          <div className="topbar__meta">
            <span className="topbar__name">{profile?.name || session.user.email}</span>
            <span className="topbar__role">
              {profile?.role ? t(`roles.${profile.role}`) : t("user")}
              {teamName ? ` · ${teamName}` : ""}
            </span>
          </div>
          <Button variant="ghost" onClick={onLogout}>
            {t("signOut")}
          </Button>
        </div>
      </header>

      <main className="main-content">{children}</main>
      {profile && <PrivacyNotice />}
    </div>
  )
}
