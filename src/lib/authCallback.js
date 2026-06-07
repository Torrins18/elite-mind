export function hasAuthCallbackInUrl() {
  const { hash, search } = window.location
  return (
    hash.includes("access_token=") ||
    hash.includes("type=recovery") ||
    search.includes("code=") ||
    search.includes("type=recovery")
  )
}

export function isPasswordRecoveryUrl() {
  const { hash, search } = window.location
  return hash.includes("type=recovery") || search.includes("type=recovery")
}

export function clearAuthCallbackFromUrl() {
  window.history.replaceState(null, "", window.location.pathname)
}
