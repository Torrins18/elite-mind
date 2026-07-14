type EvolutionWeek = {
  date?: string
  mental?: number | null
  wellbeing?: number | null
  social?: number | null
  coachCommunication?: number | null
}

type ComplianceWeek = {
  date?: string
  pct?: number
  done?: number
  total?: number
}

type TeamContext = {
  lang?: "ca" | "es"
  scope?: "team" | "club"
  team?: { name?: string; athleteCount?: number }
  club?: { name?: string; teamCount?: number; athleteCount?: number }
  summary?: {
    compliancePct?: number
    checkedInThisWeek?: number
    totalAthletes?: number
    riskBreakdown?: { low?: number; medium?: number; high?: number }
  }
  evolution?: {
    eorWeeks?: EvolutionWeek[]
    complianceWeeks?: ComplianceWeek[]
  }
}

function delta(current?: number | null, previous?: number | null) {
  if (current == null || previous == null) return null
  return Math.round((current - previous) * 10) / 10
}

export function synthesizeTeamNarrative(context: TeamContext) {
  const lang = context.lang === "ca" ? "ca" : "es"
  const eorWeeks = context.evolution?.eorWeeks || []
  const complianceWeeks = context.evolution?.complianceWeeks || []

  if (eorWeeks.length < 2) {
    return {
      tone: "neutral",
      text:
        lang === "ca"
          ? "Encara no hi ha prou revisions setmanals per analitzar l'evolució del grup."
          : "Aún no hay suficientes revisiones semanales para analizar la evolución del grupo.",
    }
  }

  const first = eorWeeks[0]
  const last = eorWeeks[eorWeeks.length - 1]
  const mentalDelta = delta(last.mental, first.mental)
  const socialDelta = delta(last.social, first.social)
  const wellbeingDelta = delta(last.wellbeing, first.wellbeing)
  const complianceFirst = complianceWeeks[0]?.pct
  const complianceLast = complianceWeeks[complianceWeeks.length - 1]?.pct
  const complianceDelta =
    complianceFirst != null && complianceLast != null ? complianceLast - complianceFirst : null

  const label =
    context.scope === "club"
      ? context.club?.name || (lang === "ca" ? "el club" : "el club")
      : context.team?.name || (lang === "ca" ? "l'equip" : "el equipo")

  const compliance = context.summary?.compliancePct ?? complianceLast ?? "—"
  const mental = last.mental ?? "—"
  const social = last.social ?? "—"
  const wellbeing = last.wellbeing ?? "—"

  if (lang === "ca") {
    if (mentalDelta != null && mentalDelta <= -1.5 && socialDelta != null && socialDelta <= -1) {
      return {
        tone: "warning",
        text: `A ${label}, l'índex mental i el social baixen en les darreres setmanes (mental ${mental}/10, social ${social}/10). Compliment ${compliance}%. Valora càrrega, rol i clima de grup.`,
      }
    }
    if (complianceDelta != null && complianceDelta <= -15) {
      return {
        tone: "warning",
        text: `El compliment de ${label} cau ${Math.abs(complianceDelta)} punts en les darreres setmanes (ara ${compliance}%). Mental ${mental}/10, benestar ${wellbeing}/10.`,
      }
    }
    if (mentalDelta != null && mentalDelta >= 1 && (complianceDelta == null || complianceDelta >= 0)) {
      return {
        tone: "positive",
        text: `Tendència positiva a ${label}: mental ${mental}/10, benestar ${wellbeing}/10, social ${social}/10 i ${compliance}% de compliment.`,
      }
    }
    return {
      tone: "neutral",
      text: `Evolució estable a ${label} en les darreres setmanes: mental ${mental}/10, social ${social}/10, compliment ${compliance}%.`,
    }
  }

  if (mentalDelta != null && mentalDelta <= -1.5 && socialDelta != null && socialDelta <= -1) {
    return {
      tone: "warning",
      text: `En ${label}, el índice mental y el social bajan en las últimas semanas (mental ${mental}/10, social ${social}/10). Cumplimiento ${compliance}%. Valora carga, rol y clima de grupo.`,
    }
  }
  if (complianceDelta != null && complianceDelta <= -15) {
    return {
      tone: "warning",
      text: `El cumplimiento de ${label} cae ${Math.abs(complianceDelta)} puntos en las últimas semanas (ahora ${compliance}%). Mental ${mental}/10, bienestar ${wellbeing}/10.`,
    }
  }
  if (mentalDelta != null && mentalDelta >= 1 && (complianceDelta == null || complianceDelta >= 0)) {
    return {
      tone: "positive",
      text: `Tendencia positiva en ${label}: mental ${mental}/10, bienestar ${wellbeing}/10, social ${social}/10 y ${compliance}% de cumplimiento.`,
    }
  }
  return {
    tone: "neutral",
    text: `Evolución estable en ${label} en las últimas semanas: mental ${mental}/10, social ${social}/10, cumplimiento ${compliance}%.`,
  }
}
