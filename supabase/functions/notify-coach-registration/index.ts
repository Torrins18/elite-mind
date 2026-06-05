const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type CoachNotificationBody = {
  coachEmail?: string
  coachName?: string
  coachId?: string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY")
  const psychologistEmail =
    Deno.env.get("PSYCHOLOGIST_EMAIL") || "psicologiaesportiva.aleixtorra@gmail.com"
  const fromEmail = Deno.env.get("ELITE_MIND_FROM_EMAIL") || "Elite Mind <onboarding@resend.dev>"
  const appUrl = Deno.env.get("APP_URL") || "https://elite-mind.vercel.app"

  if (!resendApiKey || !psychologistEmail) {
    return json({ error: "Missing email configuration" }, 500)
  }

  const body = (await req.json().catch(() => ({}))) as CoachNotificationBody
  const coachEmail = body.coachEmail?.trim()
  const coachName = body.coachName?.trim() || coachEmail || "Entrenador/a"
  const approvalUrl = `${appUrl.replace(/\/$/, "")}/#coach-approvals`

  if (!coachEmail) {
    return json({ error: "Missing coach email" }, 400)
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: psychologistEmail,
      subject: "Nou entrenador inscrit pendent de validació",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h2>Nou entrenador inscrit</h2>
          <p><strong>${escapeHtml(coachName)}</strong> s'ha inscrit com a entrenador/a i està pendent de validació.</p>
          <p><strong>Nom:</strong> ${escapeHtml(coachName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(coachEmail)}</p>
          ${body.coachId ? `<p><strong>ID:</strong> ${escapeHtml(body.coachId)}</p>` : ""}
          <p style="margin: 28px 0;">
            <a
              href="${escapeHtml(approvalUrl)}"
              style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #0891b2; color: #ffffff; font-weight: 700; text-decoration: none;"
            >
              Validar i assignar equip
            </a>
          </p>
          <p>Si el botó no funciona, obre aquest enllaç: <a href="${escapeHtml(approvalUrl)}">${escapeHtml(approvalUrl)}</a></p>
        </div>
      `,
      text: [
        "Nou entrenador inscrit",
        "",
        `${coachName} s'ha inscrit com a entrenador/a i està pendent de validació.`,
        `Nom: ${coachName}`,
        `Email: ${coachEmail}`,
        body.coachId ? `ID: ${body.coachId}` : "",
        "",
        `Validar i assignar equip: ${approvalUrl}`,
      ]
        .filter(Boolean)
        .join("\n"),
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    return json({ error: "Email provider failed", details }, 502)
  }

  return json({ ok: true })
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }

    return entities[char]
  })
}
