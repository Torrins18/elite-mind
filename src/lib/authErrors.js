export function mapAuthError(message, t) {
  if (!message) return ""

  const lower = message.toLowerCase()

  if (lower.includes("email rate limit exceeded") || lower.includes("over_email_send_rate_limit")) {
    return t("login.errors.rateLimit")
  }

  if (lower.includes("only request this after")) {
    return t("login.errors.tooSoon")
  }

  if (lower.includes("invalid login credentials")) {
    return t("login.errors.invalidCredentials")
  }

  if (lower.includes("user already registered")) {
    return t("login.errors.alreadyRegistered")
  }

  return message
}
