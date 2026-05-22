import { useTranslation } from "../i18n/LanguageContext"
import { Layout } from "../components/Layout"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"

export function PendingCoachPage({ profile, session, onLogout, onRefresh }) {
  const { t } = useTranslation()

  return (
    <Layout profile={profile} session={session} onLogout={onLogout}>
      <Card title={t("pendingCoach.title")} subtitle={t("pendingCoach.subtitle")}>
        <p className="empty-state">{t("pendingCoach.text")}</p>
        <Button variant="ghost" onClick={onRefresh}>
          {t("pendingCoach.refresh")}
        </Button>
      </Card>
    </Layout>
  )
}
