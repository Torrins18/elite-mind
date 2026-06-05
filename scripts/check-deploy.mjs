const urls = [
  "https://elite-mind.vercel.app",
  "https://mental-performance-app.vercel.app",
]

for (const url of urls) {
  try {
    const html = await fetch(url).then((r) => r.text())
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/)
    if (!match) {
      console.log(JSON.stringify({ url, error: "no bundle found" }))
      continue
    }
    const js = await fetch(`${url.replace(/\/$/, "")}${match[1]}`).then((r) => r.text())
    const supabaseIdx = js.indexOf("supabase")
    const snippet =
      supabaseIdx >= 0 ? js.slice(Math.max(0, supabaseIdx - 60), supabaseIdx + 180) : null
    console.log(
      JSON.stringify({
        url,
        status: "online",
        supabaseHosts: [...new Set(js.match(/https:\/\/[a-z0-9]+\.supabase\.co/g) || [])],
        usesNewSupabase: js.includes("wdibvfgvgmpgorzaraud"),
        usesOldSupabase: js.includes("pmjptxnwrboesprlfeod"),
        hasRolePicker: js.includes("role-picker") || js.includes("RolePicker"),
        supabaseSnippet: snippet,
      })
    )
  } catch (e) {
    console.log(JSON.stringify({ url, error: e.message }))
  }
}
