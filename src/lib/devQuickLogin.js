/**
 * TEMPORARY (development only)
 *
 * Aquesta és una solució temporal per facilitar les proves internes durant el
 * desenvolupament. Abans del llançament s'haurà de revisar el flux definitiu
 * d'autenticació dels esportistes.
 *
 * Credencials i llista per a l'inici de sessió ràpid (NOMÉS import.meta.env.DEV).
 * En producció aquest mòdul no s'ha d'importar / queda eliminat del bundle.
 */

import { DEV_TEST_ATHLETE_ACCOUNTS, DEV_TEST_ATHLETE_PASSWORD } from "./devTestAthletes"

/** Contrasenya compartida de desenvolupament per a tots els comptes demo. */
export const DEV_QUICK_LOGIN_PASSWORD = DEV_TEST_ATHLETE_PASSWORD

/**
 * Comptes disponibles al menú "Entrar com a…".
 * Aquests comptes només existeixen per facilitar les proves internes i es podran
 * eliminar o substituir abans del llançament oficial de la plataforma.
 */
export const DEV_QUICK_LOGIN_ACCOUNTS = [
  ...DEV_TEST_ATHLETE_ACCOUNTS.map((account, index) => ({
    id: `athlete-${index + 1}`,
    label: account.name,
    email: account.email,
    password: DEV_QUICK_LOGIN_PASSWORD,
    role: "athlete",
  })),
  {
    id: "psychologist-demo",
    label: "Psicòleg Demo",
    email: "provapsicoleg@zonamental.app",
    password: DEV_QUICK_LOGIN_PASSWORD,
    role: "psychologist",
  },
  {
    id: "coach-demo",
    label: "Entrenador Demo",
    email: "provaentrenador@zonamental.app",
    password: DEV_QUICK_LOGIN_PASSWORD,
    role: "coach",
  },
]

export function isDevQuickLoginEnabled() {
  return import.meta.env.DEV === true
}
