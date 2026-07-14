import { useMemo } from "react"
import { BrandLogo } from "./BrandLogo"
import { Button } from "./ui/Button"
import { useTranslation } from "../i18n/LanguageContext"
import { todayISO } from "../lib/dates"
import {
  acknowledgeWeeklyReflection,
  getWeeklyReflectionText,
} from "../lib/weeklyReflectionRotation"

export function WeeklyReflectionScreen({ athleteId, onContinue }) {
  const { t, lang } = useTranslation()
  const today = todayISO()

  const reflectionText = useMemo(
    () => getWeeklyReflectionText(athleteId, lang, today),
    [athleteId, lang, today]
  )

  const handleContinue = () => {
    acknowledgeWeeklyReflection(athleteId, today)
    onContinue()
  }

  return (
    <div className="weekly-reflection-screen" role="dialog" aria-modal="true" aria-labelledby="weekly-reflection-title">
      <div className="weekly-reflection-screen__inner">
        <BrandLogo variant="compact" className="weekly-reflection-screen__logo" />
        <h1 id="weekly-reflection-title" className="weekly-reflection-screen__title">
          {t("weeklyReflection.title")}
        </h1>
        <blockquote className="weekly-reflection-screen__body">{reflectionText}</blockquote>
        <Button type="button" className="weekly-reflection-screen__cta" onClick={handleContinue}>
          {t("weeklyReflection.startReview")}
        </Button>
      </div>
    </div>
  )
}
