export function isAdultInSpain(dateOfBirth, referenceDate = new Date()) {
  if (!dateOfBirth) return false

  const birthDate = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(birthDate.getTime())) return false

  const eighteenthBirthday = new Date(birthDate)
  eighteenthBirthday.setFullYear(birthDate.getFullYear() + 18)

  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)

  return eighteenthBirthday <= today
}

export function todayDate(referenceDate = new Date()) {
  return referenceDate.toISOString().slice(0, 10)
}

export function calculateAge(dateOfBirth, referenceDate = new Date()) {
  if (!dateOfBirth) return null

  const birthDate = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(birthDate.getTime())) return null

  const today = new Date(referenceDate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())

  if (!hasBirthdayPassed) age -= 1
  return age
}

export function hasGuardianConsent(profile) {
  return Boolean(
    profile?.guardian_consent_signed_at &&
      profile?.guardian_full_name &&
      profile?.guardian_signature &&
      (profile?.guardian_email || profile?.guardian_phone)
  )
}

export function consentStatus(profile) {
  if (!profile?.date_of_birth) return "missingBirthDate"
  if (isAdultInSpain(profile.date_of_birth)) return "adult"
  return hasGuardianConsent(profile) ? "guardianSigned" : "guardianPending"
}
