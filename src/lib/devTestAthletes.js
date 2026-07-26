/**
 * TEMPORARY (development only)
 *
 * Aquesta és una solució temporal per facilitar les proves internes durant el
 * desenvolupament. Abans del llançament s'haurà de revisar el flux definitiu
 * d'autenticació dels esportistes.
 *
 * Crea esportistes de prova amb email confirmat via Edge Function (Admin API).
 * No modifica el flux de registre dels usuaris reals.
 */

import { supabase } from "../supabase"

export const DEV_TEST_ATHLETE_PASSWORD = "TestAthlete2026!"

export const DEV_TEST_ATHLETE_ACCOUNTS = [
  {
    email: "provaesportista1@zonamental.app",
    name: "Prova Esportista 1",
  },
  {
    email: "provaesportista2@zonamental.app",
    name: "Prova Esportista 2",
  },
  {
    email: "provaesportista3@zonamental.app",
    name: "Prova Esportista 3",
  },
  {
    email: "provaesportista4@zonamental.app",
    name: "Prova Esportista 4",
  },
  {
    email: "provaesportista5@zonamental.app",
    name: "Prova Esportista 5",
  },
]

/**
 * @param {{ email: string, password?: string, name?: string }} params
 */
export async function createTestAthlete({ email, password = DEV_TEST_ATHLETE_PASSWORD, name }) {
  // TEMPORARY DEV: només comptes marcats isTestAthlete via Edge Function amb email_confirm.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) return { data: null, error: sessionError }

  const accessToken = sessionData.session?.access_token
  if (!accessToken) {
    return { data: null, error: new Error("Authentication required") }
  }

  const { data, error } = await supabase.functions.invoke("create-test-athlete", {
    body: {
      email,
      password,
      name,
      isTestAthlete: true,
    },
  })

  if (error) return { data: null, error }
  if (data?.error) return { data: null, error: new Error(data.error) }
  return { data, error: null }
}
