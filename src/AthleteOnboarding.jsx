import { useState } from "react"
import { supabase } from "./supabase"
import { useTranslation } from "./i18n/LanguageContext"
import { hasGuardianConsent, isAdultInSpain, todayDate } from "./lib/age"
import { notifyCoachRegistration } from "./lib/coachNotifications"
import { RolePicker } from "./components/RolePicker"
import { Button } from "./components/ui/Button"
import { Card } from "./components/ui/Card"

const accountTypeStorageKey = (profileId) => `elite-mind-account-type-${profileId}`

export default function AthleteOnboarding({ profile, session, onUpdated }) {
  const { t } = useTranslation()
  const [accountTypeConfirmed, setAccountTypeConfirmed] = useState(
    () => localStorage.getItem(accountTypeStorageKey(profile.id)) === "1"
  )
  const [selectedRole, setSelectedRole] = useState(profile?.role || "athlete")
  const [savingRole, setSavingRole] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || "")
  const [guardianFullName, setGuardianFullName] = useState(profile?.guardian_full_name || "")
  const [guardianRelationship, setGuardianRelationship] = useState(
    profile?.guardian_relationship || ""
  )
  const [guardianEmail, setGuardianEmail] = useState(profile?.guardian_email || "")
  const [guardianPhone, setGuardianPhone] = useState(profile?.guardian_phone || "")
  const [guardianSignature, setGuardianSignature] = useState(profile?.guardian_signature || "")
  const [guardianAccepted, setGuardianAccepted] = useState(false)
  const [step, setStep] = useState(() =>
    profile?.date_of_birth &&
    !isAdultInSpain(profile.date_of_birth) &&
    !hasGuardianConsent(profile)
      ? "guardian"
      : "birthDate"
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const confirmAccountType = async (event) => {
    event.preventDefault()
    setError("")

    if (selectedRole === "athlete") {
      localStorage.setItem(accountTypeStorageKey(profile.id), "1")
      setAccountTypeConfirmed(true)
      return
    }

    setSavingRole(true)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "coach", approved: false })
      .eq("id", profile.id)

    if (updateError) {
      setSavingRole(false)
      setError(updateError.message)
      return
    }

    if (session?.user) {
      await supabase.auth.updateUser({ data: { role: "coach" } })
      await notifyCoachRegistration({
        coachEmail: session.user.email,
        coachName: profile.name,
        coachId: profile.id,
      })
    }

    setSavingRole(false)
    localStorage.setItem(accountTypeStorageKey(profile.id), "1")
    onUpdated?.()
  }

  const saveBirthDate = async (event) => {
    event.preventDefault()
    setError("")

    if (!dateOfBirth) {
      setError(t("onboarding.birthDateRequired"))
      return
    }

    const adult = isAdultInSpain(dateOfBirth)
    if (!adult) {
      setStep("guardian")
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        date_of_birth: dateOfBirth,
        is_adult: true,
        guardian_full_name: null,
        guardian_relationship: null,
        guardian_email: null,
        guardian_phone: null,
        guardian_signature: null,
        guardian_consent_text_version: null,
        guardian_consent_user_agent: null,
        guardian_consent_ip_address: null,
        guardian_consent_signed_at: null,
      })
      .eq("id", profile.id)

    setSaving(false)

    if (updateError) {
      setError(
        updateError.message.includes("column")
          ? `${updateError.message} — Executa supabase/privacy-onboarding.sql al SQL Editor.`
          : updateError.message
      )
      return
    }

    onUpdated?.()
  }

  const saveGuardianConsent = async (event) => {
    event.preventDefault()
    setError("")

    const hasContact = guardianEmail.trim() || guardianPhone.trim()
    if (
      !guardianFullName.trim() ||
      !guardianRelationship.trim() ||
      !guardianSignature.trim() ||
      !hasContact
    ) {
      setError(t("onboarding.guardianRequired"))
      return
    }

    if (!guardianAccepted) {
      setError(t("onboarding.guardianConsentRequired"))
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        date_of_birth: dateOfBirth,
        is_adult: false,
        guardian_full_name: guardianFullName.trim(),
        guardian_relationship: guardianRelationship.trim(),
        guardian_email: guardianEmail.trim() || null,
        guardian_phone: guardianPhone.trim() || null,
        guardian_signature: guardianSignature.trim(),
        guardian_consent_text_version: "guardian-consent-v1",
        guardian_consent_user_agent: window.navigator.userAgent,
        guardian_consent_ip_address: null,
        guardian_consent_signed_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    setSaving(false)

    if (updateError) {
      setError(
        updateError.message.includes("column")
          ? `${updateError.message} — Executa supabase/privacy-onboarding.sql al SQL Editor.`
          : updateError.message
      )
      return
    }

    onUpdated?.()
  }

  const guardianMailto = `mailto:${guardianEmail.trim()}?subject=${encodeURIComponent(
    t("onboarding.guardianEmailSubject")
  )}&body=${encodeURIComponent(t("onboarding.guardianEmailBody"))}`

  if (!accountTypeConfirmed) {
    return (
      <Card title={t("login.roleTitle")} subtitle={t("login.hintRegister")}>
        <form className="onboarding-form" onSubmit={confirmAccountType}>
          <RolePicker value={selectedRole} onChange={setSelectedRole} />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={savingRole}>
            {savingRole
              ? t("onboarding.saving")
              : selectedRole === "coach"
                ? t("login.createCoachAccount")
                : t("onboarding.continueAsAthlete")}
          </Button>
        </form>
      </Card>
    )
  }

  if (step === "guardian") {
    return (
      <Card title={t("onboarding.guardianTitle")} subtitle={t("onboarding.guardianSubtitle")}>
        <form className="onboarding-form" onSubmit={saveGuardianConsent}>
          <p>{t("onboarding.minorText")}</p>
          <label className="onboarding-form__field">
            <span>{t("onboarding.guardianFullName")}</span>
            <input
              type="text"
              value={guardianFullName}
              onChange={(event) => setGuardianFullName(event.target.value)}
              required
            />
          </label>
          <label className="onboarding-form__field">
            <span>{t("onboarding.guardianRelationship")}</span>
            <input
              type="text"
              value={guardianRelationship}
              onChange={(event) => setGuardianRelationship(event.target.value)}
              placeholder={t("onboarding.guardianRelationshipPlaceholder")}
              required
            />
          </label>
          <label className="onboarding-form__field">
            <span>{t("onboarding.guardianEmail")}</span>
            <input
              type="email"
              value={guardianEmail}
              onChange={(event) => setGuardianEmail(event.target.value)}
            />
          </label>
          {guardianEmail.trim() && (
            <a className="btn btn--ghost onboarding-form__mail" href={guardianMailto}>
              {t("onboarding.emailGuardian")}
            </a>
          )}
          <label className="onboarding-form__field">
            <span>{t("onboarding.guardianPhone")}</span>
            <input
              type="tel"
              value={guardianPhone}
              onChange={(event) => setGuardianPhone(event.target.value)}
            />
          </label>
          <label className="onboarding-form__field">
            <span>{t("onboarding.guardianSignature")}</span>
            <input
              type="text"
              value={guardianSignature}
              onChange={(event) => setGuardianSignature(event.target.value)}
              placeholder={t("onboarding.guardianSignaturePlaceholder")}
              required
            />
          </label>
          <label className="onboarding-form__check">
            <input
              type="checkbox"
              checked={guardianAccepted}
              onChange={(event) => setGuardianAccepted(event.target.checked)}
            />
            <span>{t("onboarding.guardianConsentText")}</span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? t("onboarding.saving") : t("onboarding.signAndContinue")}
          </Button>
          <Button variant="ghost" onClick={() => setStep("birthDate")}>
            {t("onboarding.correctBirthDate")}
          </Button>
        </form>
      </Card>
    )
  }

  return (
    <Card title={t("onboarding.title")} subtitle={t("onboarding.subtitle")}>
      <form className="onboarding-form" onSubmit={saveBirthDate}>
        <label className="onboarding-form__field">
          <span>{t("onboarding.birthDate")}</span>
          <input
            type="date"
            value={dateOfBirth}
            max={todayDate()}
            onChange={(event) => setDateOfBirth(event.target.value)}
            required
          />
        </label>
        <p className="onboarding-form__hint">{t("onboarding.privacyHint")}</p>
        {error && <p className="form-error">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? t("onboarding.saving") : t("onboarding.save")}
        </Button>
      </form>
    </Card>
  )
}
