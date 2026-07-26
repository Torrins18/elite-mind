/**
 * TEMPORARY (development only)
 *
 * Aquesta és una solució temporal per facilitar les proves internes durant el
 * desenvolupament. Abans del llançament s'haurà de revisar el flux definitiu
 * d'autenticació dels esportistes.
 *
 * Menú discret d'inici de sessió ràpid. Només s'ha de muntar quan
 * import.meta.env.DEV === true (mai en producció).
 */

import { useState } from "react"
import { supabase } from "../supabase"
import { DEV_QUICK_LOGIN_ACCOUNTS, isDevQuickLoginEnabled } from "../lib/devQuickLogin"

export function DevQuickLogin({ onError }) {
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  if (!isDevQuickLoginEnabled()) return null

  const signInAs = async (account) => {
    setBusyId(account.id)
    onError?.("")

    const { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    if (error) {
      onError?.(error.message)
      setBusyId(null)
      return
    }

    setOpen(false)
    setBusyId(null)
  }

  return (
    <div className="dev-quick-login">
      <button
        type="button"
        className="dev-quick-login__toggle"
        aria-expanded={open}
        aria-controls="dev-quick-login-menu"
        onClick={() => setOpen((value) => !value)}
        disabled={Boolean(busyId)}
      >
        🧪 Entrar com a…
      </button>

      {open && (
        <ul id="dev-quick-login-menu" className="dev-quick-login__menu" role="menu">
          {DEV_QUICK_LOGIN_ACCOUNTS.map((account) => (
            <li key={account.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="dev-quick-login__item"
                disabled={Boolean(busyId)}
                onClick={() => signInAs(account)}
              >
                {busyId === account.id ? "Entrant…" : account.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
