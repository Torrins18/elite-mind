import { formatDate } from "./dates"
import { compareWeeklyToBaseline, formatAssessmentFieldValue } from "./baseline"

export function buildReportSections({ title, subtitle, generatedAt, rows }) {
  return { title, subtitle, generatedAt, rows }
}

export function downloadPrintReport({ title, subtitle, rows, filename = "informe", source }) {
  const generatedAt = new Date().toLocaleString()
  const sourceLine = source === "ai" ? " · IA" : source === "synthesis" ? " · Síntesi" : ""
  const html = `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #111; padding: 32px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin: 0 0 4px; }
    .sub { color: #555; font-size: 0.9rem; margin-bottom: 24px; }
    .meta { font-size: 0.8rem; color: #777; margin-bottom: 28px; }
    section { margin-bottom: 20px; page-break-inside: avoid; }
    section h2 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin: 0 0 8px; }
    dl { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 0; }
    dt { font-size: 0.78rem; color: #666; }
    dd { margin: 0; font-weight: 600; font-size: 0.95rem; }
    p { margin: 0; line-height: 1.55; font-size: 0.92rem; }
    .insight { padding: 12px 14px; border-left: 3px solid #0891b2; background: #f8fafc; border-radius: 0 8px 8px 0; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ""}
  <p class="meta">${escapeHtml(generatedAt)} · Zona Mental+${escapeHtml(sourceLine)}</p>
  ${rows
    .map(
      (section) => `
  <section>
    <h2>${escapeHtml(section.heading)}</h2>
    ${
      section.items
        ? `<dl>${section.items
            .map(
              (item) =>
                `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(String(item.value ?? "—"))}</dd></div>`
            )
            .join("")}</dl>`
        : `<p class="${section.variant === "insight" ? "insight" : ""}">${escapeHtml(section.text || "")}</p>`
    }
  </section>`
    )
    .join("")}
</body>
</html>`

  const printWindow = window.open("", "_blank", "noopener,noreferrer")
  if (!printWindow) return

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.document.title = filename
  printWindow.focus()
  printWindow.onload = () => {
    printWindow.print()
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatWeekLabel(weekDate, lang = "es") {
  if (!weekDate) return "—"
  return formatDate(weekDate, lang)
}

function buildEvolutionSections({ evolutionInsight, complianceTrend, weeklyTrend, t, lang }) {
  const sections = []

  if (evolutionInsight?.text) {
    sections.push({
      heading: t("reports.sectionAiSummary"),
      text: evolutionInsight.text,
      variant: "insight",
    })
  }

  if (complianceTrend?.length) {
    sections.push({
      heading: t("reports.sectionComplianceEvolution"),
      items: complianceTrend.slice(-8).map((row) => ({
        label: formatWeekLabel(row.weekDate, lang),
        value: t("psychologist.complianceRatio", {
          done: row.done,
          total: row.total,
          pct: row.compliance,
        }),
      })),
    })
  }

  if (weeklyTrend?.length) {
    sections.push({
      heading: t("reports.sectionEorEvolution"),
      items: weeklyTrend.slice(-8).map((row) => ({
        label: formatWeekLabel(row.weekDate, lang),
        value: t("reports.eorWeekSnapshot", {
          mental: row.mental ?? "—",
          wellbeing: row.wellbeing ?? "—",
          social: row.social ?? "—",
          responses: row.responses ?? 0,
        }),
      })),
    })
  }

  return sections
}

export function buildTeamReportSections({
  teamName,
  summary,
  eorSnapshot,
  evolutionInsight,
  complianceTrend,
  weeklyTrend,
  t,
  lang = "es",
}) {
  return [
    {
      heading: t("reports.sectionOverview"),
      items: [
        { label: t("reports.team"), value: teamName },
        { label: t("psychologist.athletesMonitored"), value: summary.totalAthletes },
        {
          label: t("reports.compliance"),
          value: `${Math.round(summary.complianceRate * 100)}% (${summary.checkedInThisWeek}/${summary.totalAthletes})`,
        },
        { label: t("coach.summaryStable"), value: summary.riskBreakdown.low },
        { label: t("coach.summaryWatch"), value: summary.riskBreakdown.medium },
        { label: t("coach.summaryAtRisk"), value: summary.riskBreakdown.high },
      ],
    },
    {
      heading: t("reports.sectionEor"),
      items: [
        { label: t("psychologist.eorIndexMental"), value: eorSnapshot?.mental ?? "—" },
        { label: t("psychologist.eorIndexWellbeing"), value: eorSnapshot?.wellbeing ?? "—" },
        { label: t("psychologist.eorIndexSocial"), value: eorSnapshot?.social ?? "—" },
        {
          label: t("checkIn.eorCoachCommunication"),
          value: eorSnapshot?.coachCommunication ?? "—",
        },
      ],
    },
    ...buildEvolutionSections({ evolutionInsight, complianceTrend, weeklyTrend, t, lang }),
  ]
}

export function buildClubReportSections({
  clubName,
  teams,
  athletes,
  checkIns,
  evolutionInsight,
  complianceTrend,
  weeklyTrend,
  t,
  lang = "es",
}) {
  const teamSummaries = teams.map((team) => {
    const teamAthletes = athletes.filter((a) => a.team_id === team.id)
    const ids = new Set(teamAthletes.map((a) => a.id))
    const teamCheckIns = checkIns.filter((c) => ids.has(c.athlete_id))
    const checkedIn = teamAthletes.filter((a) =>
      teamCheckIns.some(
        (c) =>
          c.athlete_id === a.id &&
          c.check_in_date >= new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      )
    ).length
    return {
      label: team.name,
      value: `${teamAthletes.length} ${t("reports.athletesShort")} · ${teamAthletes.length ? Math.round((checkedIn / teamAthletes.length) * 100) : 0}%`,
    }
  })

  return [
    {
      heading: t("reports.sectionOverview"),
      items: [
        { label: t("reports.club"), value: clubName },
        { label: t("reports.teams"), value: teams.length },
        { label: t("reports.athletes"), value: athletes.length },
      ],
    },
    {
      heading: t("reports.sectionTeams"),
      items: teamSummaries.length ? teamSummaries : [{ label: t("reports.noTeams"), value: "—" }],
    },
    ...buildEvolutionSections({ evolutionInsight, complianceTrend, weeklyTrend, t, lang }),
  ]
}

export function buildAthleteReportSections({
  athlete,
  teamName,
  risk,
  latestWeekly,
  insight,
  weeklyTrend,
  assessment,
  t,
  lang = "es",
}) {
  const sections = [
    {
      heading: t("reports.sectionAthlete"),
      items: [
        { label: t("reports.athlete"), value: athlete.name },
        { label: t("reports.team"), value: teamName || "—" },
        { label: t("athleteFile.profileRisk"), value: t(`psychologist.riskBadge.${risk}`) },
      ],
    },
  ]

  if (assessment) {
    if (assessment.baseline_summary) {
      sections.push({
        heading: t("reports.sectionBaselineSummary"),
        text: assessment.baseline_summary,
        variant: "insight",
      })
    }

    const comparisons = compareWeeklyToBaseline(assessment, latestWeekly)
    if (comparisons.length) {
      sections.push({
        heading: t("reports.sectionBaselineComparison"),
        items: comparisons.map((row) => ({
          label: t(`baseline.metrics.${row.labelKey}`),
          value: t("reports.baselineComparisonValue", {
            baseline: row.baseline,
            current: row.current,
            delta: row.delta > 0 ? `+${row.delta}` : row.delta,
          }),
        })),
      })
    }

    const baselineItems = collectBaselineHighlightItems(assessment, t)
    if (baselineItems.length) {
      sections.push({
        heading: t("reports.sectionBaselineProfile"),
        items: baselineItems,
      })
    }
  }

  if (insight?.text) {
    sections.push({
      heading: t("reports.sectionAiSummary"),
      text: insight.text,
      variant: "insight",
    })
  }

  sections.push({
    heading: t("reports.sectionLatestEor"),
    items: latestWeekly
      ? [
          { label: t("reports.date"), value: latestWeekly.check_in_date },
          {
            label: t("psychologist.eorIndexMental"),
            value: latestWeekly.confidence_rating ?? "—",
          },
          {
            label: t("psychologist.eorIndexWellbeing"),
            value: latestWeekly.weekly_energy ?? latestWeekly.energy_level ?? "—",
          },
          {
            label: t("psychologist.eorIndexSocial"),
            value: latestWeekly.group_integration ?? "—",
          },
        ]
      : [{ label: t("psychologist.noWeeklyEor"), value: "—" }],
  })

  if (weeklyTrend?.length) {
    sections.push({
      heading: t("reports.sectionEorEvolution"),
      items: weeklyTrend.slice(-8).map((row) => ({
        label: formatWeekLabel(row.weekDate, lang),
        value: t("reports.eorWeekSnapshot", {
          mental: row.mental ?? "—",
          wellbeing: row.wellbeing ?? "—",
          social: row.social ?? "—",
          responses: 1,
        }),
      })),
    })
  }

  sections.push({
    heading: t("reports.disclaimer"),
    text: t("reports.disclaimerText"),
  })

  return sections
}

function collectBaselineHighlightItems(assessment, t) {
  const blocks = [
    assessment.personal_info,
    assessment.family_social_support,
    assessment.mental_profile,
    assessment.objectives,
  ]

  const items = []
  const seen = new Set()

  for (const data of blocks) {
    if (!data) continue
    for (const [key, value] of Object.entries(data)) {
      if (key === "calculatedAge" || value == null || value === "" || seen.has(key)) continue
      seen.add(key)
      items.push({
        label: t(`initialAssessment.fields.${key}`),
        value: formatAssessmentFieldValue(value, t),
      })
    }
  }

  return items.slice(0, 12)
}
