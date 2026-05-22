import { useTranslation } from "../i18n/LanguageContext"
import { Layout } from "../components/Layout"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"

export function RejectedCoachPage({ profile, session, onLogout }) {
  const { t } = useTranslation()

  return (
    <Layout profile={profile} session={session} onLogout={onLogout}>
      <Card title={t("rejectedCoach.title")} subtitle={t("rejectedCoach.subtitle")}>
        <p className="empty-state">{t("rejectedCoach.text")}</p>
        <Button variant="ghost" onClick={onLogout}>
          {t("signOut")}
        </Button>
      </Card>
    </Layout>
  )
}
