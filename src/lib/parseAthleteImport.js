/**
 * Parse bulk athlete roster text.
 * One athlete per line: "Name, email@example.com" or "Name; email" or tab-separated.
 */
export function parseAthleteImport(text) {
  const rows = []
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map((part) => part.trim()).filter(Boolean)
    if (!parts.length) continue

    const fullName = parts[0]
    const email = parts[1] ? parts[1].toLowerCase() : null

    if (!fullName || fullName.length < 2) continue
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue

    rows.push({ fullName, email })
  }

  return rows
}
