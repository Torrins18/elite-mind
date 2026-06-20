export function synthesizeAthleteNarrative(context) {
  const lang = context.lang === "ca" ? "ca" : "es"
  const name = context.athlete?.name || (lang === "ca" ? "l'esportista" : "el deportista")
  const latest = context.metrics?.latest

  if (!latest) {
    return {
      tone: "neutral",
      text:
        lang === "ca"
          ? `Veient els registres disponibles, ${name} encara no té autoavaluacions recents.`
          : `Viendo los registros disponibles, ${name} aún no tiene autoevaluaciones recientes.`,
    }
  }

  const signals = extractInsightSignals(context)

  if (lang === "ca") {
    return buildCaNarrative(name, signals)
  }

  return buildEsNarrative(name, signals)
}

function extractInsightSignals(context) {
  const latest = context.metrics?.latest || {}
  const trends = context.metrics?.trends || {}
  const weakAreas = context.metrics?.weakAreas || []
  const note = context.qualitative?.personalNotes?.[0]?.text || ""
  const assessment = context.initialAssessment || {}
  const weeklyEor = context.metrics?.weeklyEor || {}
  const weeklyDifficulty = context.qualitative?.weeklyDifficulties?.[0]?.text || ""

  const noteMentionsSleep = /dorm|son|descans/i.test(note)
  const noteMentionsFatigue = /cansad|cansat|fatig|esgot|malament|mal descans/i.test(note)

  return {
    risk: context.metrics?.risk || "neutral",
    daysSince: context.metrics?.daysSince,
    inactive: context.metrics?.daysSince != null && context.metrics.daysSince >= 3,
    longInactive: context.metrics?.daysSince != null && context.metrics.daysSince >= 7,
    weakAreas,

    socialLow: weeklyEor.social != null && weeklyEor.social <= 5,
    mentalLow: weeklyEor.mental != null && weeklyEor.mental <= 5,
    mentalHigh: weeklyEor.mental != null && weeklyEor.mental >= 8,
    wellbeingLow: weeklyEor.wellbeing != null && weeklyEor.wellbeing <= 5,
    wellbeingHigh: weeklyEor.wellbeing != null && weeklyEor.wellbeing >= 8,
    socialHigh: weeklyEor.social != null && weeklyEor.social >= 8,
    coachCommLow: weeklyEor.coachCommunication != null && weeklyEor.coachCommunication <= 4,
    roleClarityLow: weeklyEor.roleClarity != null && weeklyEor.roleClarity <= 4,
    wantsPsychologistTalk: Boolean(weeklyEor.wantsPsychologistTalk),
    hasEor: weeklyEor.mental != null,

    energyDown: !weeklyEor.mental && ((trends.energy ?? 0) <= -0.5 || latest.energy <= 5),
    energyUp: !weeklyEor.mental && (trends.energy ?? 0) >= 0.5 && latest.energy >= 7,
    sleepBad: (trends.sleep ?? 0) <= -0.5 || latest.sleep <= 4 || noteMentionsSleep,
    stressUp: !weeklyEor.mental && ((trends.stress ?? 0) >= 0.5 || latest.stress >= 7),
    stressDown: !weeklyEor.mental && (trends.stress ?? 0) <= -0.5 && latest.stress <= 5,
    moodDown: !weeklyEor.mental && ((trends.mood ?? 0) <= -0.5 || latest.mood <= 4),
    moodUp: !weeklyEor.mental && (trends.mood ?? 0) >= 0.5 && latest.mood >= 7,
    focusDown: (trends.focus ?? 0) <= -0.5 || latest.focus <= 4,
    performanceLow: latest.performance != null && latest.performance <= 4,
    performanceHigh: latest.performance != null && latest.performance >= 8,
    involvementLow: latest.involvement != null && latest.involvement <= 4,
    involvementHigh: latest.involvement != null && latest.involvement >= 8,

    noteMentionsFatigue,
    noteSnippet: truncate(note, 90),
    moodWords: truncate(context.qualitative?.moodWords?.[0] || "", 50),
    moodEvent: truncate(context.qualitative?.moodEvents?.[0]?.text || "", 70),
    nextGoal: truncate(context.qualitative?.nextGoals?.[0]?.text || "", 70),
    weeklyWentWell: truncate(context.qualitative?.weeklyWentWell?.[0]?.text || "", 70),
    weeklyDifficulty: truncate(weeklyDifficulty, 90),

    baselineSleepIssues: hasBaselineSleepIssues(assessment),
    highBaselinePressure: Number(assessment.sports?.perceivedPressure) >= 7,
    lowBaselineConfidence: Number(assessment.sports?.currentConfidence) <= 4,
    balanceDifficult: /Difficult/i.test(assessment.support?.balanceDifficulty || ""),
    sportGoal: truncate(assessment.sports?.currentGoal || "", 80),
    familySupportLow: /^(never|little)$/i.test(assessment.support?.familySupport || ""),
    coachTension: Number(assessment.sports?.coachRelationship) <= 4,
  }
}

function hasBaselineSleepIssues(assessment) {
  const sleep = assessment.sleep || {}
  return (
    /^(quite|very)$/i.test(sleep.troubleSleepingImportant || "") ||
    /^(little|never)$/i.test(sleep.wakeRecovered || "") ||
    /^(quite|very)$/i.test(sleep.restPerformanceImpact || "")
  )
}

function buildCaNarrative(name, signals) {
  const intro = `Veient els resultats dels últims dies, ${name}`

  if (signals.longInactive) {
    return {
      tone: "warning",
      text: `${intro} fa ${signals.daysSince} dies sense registrar; convé reprendre contacte abans de valorar l'estat actual.`,
    }
  }

  if (signals.risk === "high") {
    const focus = describePrimaryConcernCa(signals)
    return {
      tone: "danger",
      text: `${intro} acumula senyals de sobrecàrrega${focus ? ` (${focus})` : ""}; cal prioritzar seguiment i revisar càrrega avui.`,
    }
  }

  const mainParts = buildMainObservationPartsCa(signals)

  if (!mainParts.length && !hasQualitativeContext(signals)) {
    return {
      tone: signals.risk === "low" ? "positive" : "neutral",
      text:
        signals.risk === "low"
          ? `${intro} es manté estable i respon bé als últims registres.`
          : `${intro} es manté en una línia acceptable; continuar el seguiment habitual.`,
    }
  }

  let text = mainParts.length ? `${intro} ${joinPartsCa(mainParts)}` : `${intro} es manté en vigilància`

  if (signals.sleepBad) {
    text += signals.baselineSleepIssues
      ? "; el descans continua sent un punt feble, ja apuntat a l'avaluació inicial"
      : "; convé controlar el son perquè no acaba de recuperar-se bé"
  } else if (signals.noteMentionsFatigue && !mainParts.some((p) => p.includes("cansament"))) {
    text += "; en les notes parla de cansament o mal descans"
  }

  const detail = buildQualitativeDetailCa(signals)
  if (detail) {
    text += `. ${detail}`
  } else {
    const assessmentHint = buildAssessmentHintCa(signals)
    if (assessmentHint) {
      text += `. ${assessmentHint}`
    } else {
      text += "."
    }
  }

  if (signals.inactive && !signals.longInactive) {
    text += ` Fa ${signals.daysSince} dies de l'últim registre.`
  }

  return {
    tone: riskToTone(signals.risk),
    text: ensurePeriod(text),
  }
}

function buildEsNarrative(name, signals) {
  const intro = `Viendo los resultados de los últimos días, ${name}`

  if (signals.longInactive) {
    return {
      tone: "warning",
      text: `${intro} lleva ${signals.daysSince} días sin registrar; conviene retomar contacto antes de valorar el estado actual.`,
    }
  }

  if (signals.risk === "high") {
    const focus = describePrimaryConcernEs(signals)
    return {
      tone: "danger",
      text: `${intro} acumula señales de sobrecarga${focus ? ` (${focus})` : ""}; hay que priorizar seguimiento y revisar carga hoy.`,
    }
  }

  const mainParts = buildMainObservationPartsEs(signals)

  if (!mainParts.length && !hasQualitativeContext(signals)) {
    return {
      tone: signals.risk === "low" ? "positive" : "neutral",
      text:
        signals.risk === "low"
          ? `${intro} se mantiene estable y responde bien a los últimos registros.`
          : `${intro} se mantiene en una línea aceptable; continuar el seguimiento habitual.`,
    }
  }

  let text = mainParts.length ? `${intro} ${joinPartsEs(mainParts)}` : `${intro} se mantiene en vigilancia`

  if (signals.sleepBad) {
    text += signals.baselineSleepIssues
      ? "; el descanso sigue siendo un punto débil, ya señalado en la evaluación inicial"
      : "; conviene controlar el sueño porque no termina de recuperarse bien"
  } else if (signals.noteMentionsFatigue && !mainParts.some((p) => p.includes("cansancio"))) {
    text += "; en las notas habla de cansancio o mal descanso"
  }

  const detail = buildQualitativeDetailEs(signals)
  if (detail) {
    text += `. ${detail}`
  } else {
    const assessmentHint = buildAssessmentHintEs(signals)
    if (assessmentHint) {
      text += `. ${assessmentHint}`
    } else {
      text += "."
    }
  }

  if (signals.inactive && !signals.longInactive) {
    text += ` Hace ${signals.daysSince} días del último registro.`
  }

  return {
    tone: riskToTone(signals.risk),
    text: ensurePeriod(text),
  }
}

function buildMainObservationPartsCa(signals) {
  if (signals.hasEor) {
    const parts = []

    if (signals.mentalLow) {
      parts.push("mostra un índex mental baix a la revisió EOR")
    } else if (signals.mentalHigh && signals.wellbeingHigh) {
      parts.push("manté bon índex mental i benestar a la revisió EOR")
    } else if (signals.mentalHigh) {
      parts.push("manté bon índex mental a la revisió EOR")
    }

    if (signals.wellbeingLow) {
      parts.push(
        signals.mentalLow ? "i benestar baix" : "el benestar està per sota del que seria desitjable"
      )
    }

    if (signals.coachCommLow) {
      parts.push("però percep poca comunicació amb l'entrenador/a")
    } else if (signals.socialLow) {
      parts.push("amb senyals de desconnexió dins l'entorn d'equip")
    } else if (signals.socialHigh && !signals.mentalLow) {
      parts.push("amb bon clima social dins l'equip")
    }

    if (signals.roleClarityLow) {
      parts.push("i manca de claredat sobre el seu rol")
    }

    return parts
  }

  const parts = []

  if (signals.energyDown) {
    parts.push("està més cansat i amb menys energia que fa uns dies")
  } else if (signals.moodDown) {
    parts.push("mostra un ànim més baix que fa uns dies")
  } else if (signals.moodUp && signals.energyUp) {
    parts.push("manté bon ànim i energia respecte als dies anteriors")
  } else if (signals.noteMentionsFatigue) {
    parts.push("refereix cansament als darrers registres")
  }

  if (signals.stressUp) {
    parts.push(
      signals.energyDown || signals.moodDown
        ? "i percep més pressió o estrès"
        : "percep més pressió o estrès que abans"
    )
  } else if (signals.stressDown && !signals.moodDown && !signals.energyDown) {
    parts.push("amb estrès més controlat que fa uns dies")
  }

  if (signals.focusDown || signals.weakAreas.includes("focus")) {
    parts.push("amb el focus una mica dispers")
  }

  if (signals.performanceLow) {
    parts.push("i valora la seva performance per sota del que esperaria")
  } else if (signals.performanceHigh) {
    parts.push("i es veu satisfet amb la seva performance recent")
  }

  if (signals.involvementLow) {
    parts.push("amb implicació més baixa de l'habitual")
  } else if (signals.involvementHigh) {
    parts.push("amb bona implicació amb l'equip")
  }

  if (signals.coachCommLow) {
    parts.push("però percep poca comunicació amb l'entrenador/a")
  } else if (signals.socialLow) {
    parts.push("amb senyals de desconnexió dins l'entorn d'equip")
  }

  if (signals.roleClarityLow) {
    parts.push("i manca de claredat sobre el seu rol")
  }

  return parts
}

function buildMainObservationPartsEs(signals) {
  if (signals.hasEor) {
    const parts = []

    if (signals.mentalLow) {
      parts.push("muestra un índice mental bajo en la revisión EOR")
    } else if (signals.mentalHigh && signals.wellbeingHigh) {
      parts.push("mantiene buen índice mental y bienestar en la revisión EOR")
    } else if (signals.mentalHigh) {
      parts.push("mantiene buen índice mental en la revisión EOR")
    }

    if (signals.wellbeingLow) {
      parts.push(
        signals.mentalLow
          ? "y bienestar bajo"
          : "el bienestar está por debajo de lo deseable"
      )
    }

    if (signals.coachCommLow) {
      parts.push("pero percibe poca comunicación con el/la entrenador/a")
    } else if (signals.socialLow) {
      parts.push("con señales de desconexión dentro del entorno de equipo")
    } else if (signals.socialHigh && !signals.mentalLow) {
      parts.push("con buen clima social dentro del equipo")
    }

    if (signals.roleClarityLow) {
      parts.push("y falta de claridad sobre su rol")
    }

    return parts
  }

  const parts = []

  if (signals.energyDown) {
    parts.push("está más cansado y con menos energía que hace unos días")
  } else if (signals.moodDown) {
    parts.push("muestra un ánimo más bajo que hace unos días")
  } else if (signals.moodUp && signals.energyUp) {
    parts.push("mantiene buen ánimo y energía respecto a los días anteriores")
  } else if (signals.noteMentionsFatigue) {
    parts.push("refiere cansancio en los registros recientes")
  }

  if (signals.stressUp) {
    parts.push(
      signals.energyDown || signals.moodDown
        ? "y percibe más presión o estrés"
        : "percibe más presión o estrés que antes"
    )
  } else if (signals.stressDown && !signals.moodDown && !signals.energyDown) {
    parts.push("con estrés más controlado que hace unos días")
  }

  if (signals.focusDown || signals.weakAreas.includes("focus")) {
    parts.push("con el foco un poco disperso")
  }

  if (signals.performanceLow) {
    parts.push("y valora su rendimiento por debajo de lo que esperaría")
  } else if (signals.performanceHigh) {
    parts.push("y se siente satisfecho con su rendimiento reciente")
  }

  if (signals.involvementLow) {
    parts.push("con implicación más baja de lo habitual")
  } else if (signals.involvementHigh) {
    parts.push("con buena implicación con el equipo")
  }

  if (signals.coachCommLow) {
    parts.push("pero percibe poca comunicación con el/la entrenador/a")
  } else if (signals.socialLow) {
    parts.push("con señales de desconexión dentro del entorno de equipo")
  }

  if (signals.roleClarityLow) {
    parts.push("y falta de claridad sobre su rol")
  }

  return parts
}

function buildQualitativeDetailCa(signals) {
  const bits = []

  if (signals.moodWords) {
    bits.push(`es descriu com a ${lowerFirst(signals.moodWords)}`)
  }

  if (signals.moodEvent) {
    bits.push(`i relata que ${lowerFirst(signals.moodEvent)}`)
  }

  if (signals.noteSnippet && !signals.noteMentionsFatigue) {
    bits.push(`a les notes comenta ${lowerFirst(signals.noteSnippet)}`)
  } else if (signals.noteSnippet && signals.noteMentionsFatigue && !signals.moodEvent) {
    bits.push(`a les notes afegeix: ${lowerFirst(signals.noteSnippet)}`)
  }

  if (signals.nextGoal) {
    bits.push(`el seu objectiu proper és ${lowerFirst(signals.nextGoal)}`)
  }

  if (signals.weeklyWentWell) {
    bits.push(`destaca que ${lowerFirst(signals.weeklyWentWell)}`)
  }

  if (signals.weeklyDifficulty) {
    bits.push(`i la dificultat principal ha estat ${lowerFirst(signals.weeklyDifficulty)}`)
  }

  if (signals.wantsPsychologistTalk) {
    bits.push("ha indicat que podria necessitar parlar amb el psicòleg/òloga")
  }

  if (!bits.length) return ""

  let detail = capitalize(joinBitsCa(bits))

  if (signals.sportGoal && signals.nextGoal && !goalsOverlap(signals.nextGoal, signals.sportGoal)) {
    detail += `; l'objectiu de base continua sent ${lowerFirst(signals.sportGoal)}`
  }

  return ensurePeriod(detail)
}

function buildQualitativeDetailEs(signals) {
  const bits = []

  if (signals.moodWords) {
    bits.push(`se describe como ${lowerFirst(signals.moodWords)}`)
  }

  if (signals.moodEvent) {
    bits.push(`y relata que ${lowerFirst(signals.moodEvent)}`)
  }

  if (signals.noteSnippet && !signals.noteMentionsFatigue) {
    bits.push(`en las notas comenta ${lowerFirst(signals.noteSnippet)}`)
  } else if (signals.noteSnippet && signals.noteMentionsFatigue && !signals.moodEvent) {
    bits.push(`en las notas añade: ${lowerFirst(signals.noteSnippet)}`)
  }

  if (signals.nextGoal) {
    bits.push(`su objetivo próximo es ${lowerFirst(signals.nextGoal)}`)
  }

  if (signals.weeklyWentWell) {
    bits.push(`destaca que ${lowerFirst(signals.weeklyWentWell)}`)
  }

  if (signals.weeklyDifficulty) {
    bits.push(`y la dificultad principal ha sido ${lowerFirst(signals.weeklyDifficulty)}`)
  }

  if (signals.wantsPsychologistTalk) {
    bits.push("ha indicado que podría necesitar hablar con el/la psicólogo/a")
  }

  if (!bits.length) return ""

  let detail = capitalize(joinBitsEs(bits))

  if (signals.sportGoal && signals.nextGoal && !goalsOverlap(signals.nextGoal, signals.sportGoal)) {
    detail += `; el objetivo base sigue siendo ${lowerFirst(signals.sportGoal)}`
  }

  return ensurePeriod(detail)
}

function buildAssessmentHintCa(signals) {
  if (signals.highBaselinePressure && signals.stressUp) {
    return "Té pressió percebuda alta des de l'inici; val la pena revisar càrrega i expectatives"
  }
  if (signals.lowBaselineConfidence && signals.moodDown) {
    return "La confiança era ja baixa a l'avaluació inicial; convé reforçar seguiment"
  }
  if (signals.balanceDifficult && (signals.stressUp || signals.energyDown)) {
    return "L'equilibri vida-esport li costa; pot estar contribuint al cansament actual"
  }
  if (signals.familySupportLow && signals.moodDown) {
    return "El suport familiar és limitat; té sentit explorar com es nota fora de la pista"
  }
  if (signals.coachTension && signals.stressUp) {
    return "La relació amb l'entrenador era tensa a l'inici; pot estar pesant en l'estat actual"
  }
  return ""
}

function buildAssessmentHintEs(signals) {
  if (signals.highBaselinePressure && signals.stressUp) {
    return "Tiene presión percibida alta desde el inicio; vale la pena revisar carga y expectativas"
  }
  if (signals.lowBaselineConfidence && signals.moodDown) {
    return "La confianza ya era baja en la evaluación inicial; conviene reforzar seguimiento"
  }
  if (signals.balanceDifficult && (signals.stressUp || signals.energyDown)) {
    return "El equilibrio vida-deporte le cuesta; puede estar contribuyendo al cansancio actual"
  }
  if (signals.familySupportLow && signals.moodDown) {
    return "El apoyo familiar es limitado; tiene sentido explorar cómo se siente fuera de la pista"
  }
  if (signals.coachTension && signals.stressUp) {
    return "La relación con el entrenador era tensa al inicio; puede estar pesando en el estado actual"
  }
  return ""
}

function describePrimaryConcernCa(signals) {
  if (signals.hasEor) {
    const areas = []
    if (signals.mentalLow) areas.push("mental")
    if (signals.wellbeingLow) areas.push("benestar")
    if (signals.socialLow) areas.push("social")
    if (signals.coachCommLow) areas.push("comunicació entrenador")
    if (signals.roleClarityLow) areas.push("rol")
    return areas.slice(0, 3).join(", ")
  }

  const areas = []
  if (signals.weakAreas.includes("mood") || signals.moodDown) areas.push("ànim")
  if (signals.weakAreas.includes("stress") || signals.stressUp) areas.push("estrès")
  if (signals.weakAreas.includes("sleep") || signals.sleepBad) areas.push("son")
  if (signals.weakAreas.includes("energy") || signals.energyDown) areas.push("energia")
  if (signals.weakAreas.includes("focus") || signals.focusDown) areas.push("focus")
  return areas.slice(0, 3).join(", ")
}

function describePrimaryConcernEs(signals) {
  if (signals.hasEor) {
    const areas = []
    if (signals.mentalLow) areas.push("mental")
    if (signals.wellbeingLow) areas.push("bienestar")
    if (signals.socialLow) areas.push("social")
    if (signals.coachCommLow) areas.push("comunicación entrenador")
    if (signals.roleClarityLow) areas.push("rol")
    return areas.slice(0, 3).join(", ")
  }

  const areas = []
  if (signals.weakAreas.includes("mood") || signals.moodDown) areas.push("ánimo")
  if (signals.weakAreas.includes("stress") || signals.stressUp) areas.push("estrés")
  if (signals.weakAreas.includes("sleep") || signals.sleepBad) areas.push("sueño")
  if (signals.weakAreas.includes("energy") || signals.energyDown) areas.push("energía")
  if (signals.weakAreas.includes("focus") || signals.focusDown) areas.push("foco")
  return areas.slice(0, 3).join(", ")
}

function hasQualitativeContext(signals) {
  return Boolean(signals.moodWords || signals.moodEvent || signals.noteSnippet || signals.nextGoal)
}

function joinPartsCa(parts) {
  if (parts.length <= 1) return parts[0] || ""
  if (parts.length === 2) return `${parts[0]} ${parts[1]}`
  return `${parts.slice(0, -1).join(", ")} i ${parts[parts.length - 1]}`
}

function joinPartsEs(parts) {
  if (parts.length <= 1) return parts[0] || ""
  if (parts.length === 2) return `${parts[0]} ${parts[1]}`
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`
}

function joinBitsCa(bits) {
  if (bits.length === 1) return bits[0]
  if (bits.length === 2) return `${bits[0]} ${bits[1]}`
  return `${bits.slice(0, -1).join(", ")} i ${bits[bits.length - 1]}`
}

function joinBitsEs(bits) {
  if (bits.length === 1) return bits[0]
  if (bits.length === 2) return `${bits[0]} ${bits[1]}`
  return `${bits.slice(0, -1).join(", ")} y ${bits[bits.length - 1]}`
}

function goalsOverlap(a, b) {
  const na = a.toLowerCase().slice(0, 20)
  const nb = b.toLowerCase().slice(0, 20)
  return na.includes(nb) || nb.includes(na)
}

function truncate(text, max) {
  const clean = String(text || "").replace(/\s+/g, " ").trim()
  if (!clean) return ""
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trim()}…`
}

function lowerFirst(text) {
  if (!text) return ""
  return text.charAt(0).toLowerCase() + text.slice(1)
}

function capitalize(text) {
  if (!text) return ""
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function ensurePeriod(text) {
  const clean = String(text || "").trim()
  if (!clean) return ""
  return clean.endsWith(".") ? clean : `${clean}.`
}

function riskToTone(risk) {
  if (risk === "high") return "danger"
  if (risk === "medium") return "warning"
  if (risk === "low") return "positive"
  return "neutral"
}
