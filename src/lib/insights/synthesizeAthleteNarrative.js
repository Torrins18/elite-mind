export function synthesizeAthleteNarrative(context) {
  const lang = context.lang === "ca" ? "ca" : "es"
  const name = context.athlete?.name || (lang === "ca" ? "l'esportista" : "el deportista")
  const latest = context.metrics?.latest
  const trends = context.metrics?.trends || {}
  const risk = context.metrics?.risk || "neutral"
  const note = context.qualitative?.personalNotes?.[0]?.text || ""

  if (!latest) {
    return {
      tone: "neutral",
      text:
        lang === "ca"
          ? `Veient els registres disponibles, ${name} encara no té autoavaluacions recents.`
          : `Viendo los registros disponibles, ${name} aún no tiene autoevaluaciones recientes.`,
    }
  }

  const noteMentionsSleep = /dorm|son|descans/i.test(note)
  const signals = {
    energyDown: (trends.energy ?? 0) <= -0.5 || latest.energy <= 5,
    sleepBad: (trends.sleep ?? 0) <= -0.5 || latest.sleep <= 4 || noteMentionsSleep,
    stressUp: (trends.stress ?? 0) >= 0.5 || latest.stress >= 7,
    moodDown: (trends.mood ?? 0) <= -0.5 || latest.mood <= 4,
    noteMentionsFatigue: /cansad|cansat|fatig|esgot|malament|mal descans/i.test(note),
  }

  if (lang === "ca") {
    return buildCaNarrative(name, risk, signals)
  }

  return buildEsNarrative(name, risk, signals)
}

function buildCaNarrative(name, risk, signals) {
  const intro = `Veient els resultats dels últims dies, ${name}`

  if (risk === "high") {
    return {
      tone: "danger",
      text: `${intro} acumula senyals de sobrecàrrega emocional; convé prioritzar contacte i revisar càrrega avui.`,
    }
  }

  if (
    !signals.energyDown &&
    !signals.sleepBad &&
    !signals.stressUp &&
    !signals.moodDown &&
    !signals.noteMentionsFatigue
  ) {
    return {
      tone: risk === "low" ? "positive" : "neutral",
      text:
        risk === "low"
          ? `${intro} es manté estable i respon bé als últims registres.`
          : `${intro} es manté en una línia acceptable; continuar el seguiment habitual.`,
    }
  }

  const parts = []

  if (signals.energyDown) {
    parts.push("està més cansat i amb menys energia que fa uns dies")
  } else if (signals.moodDown) {
    parts.push("mostra un ànim més baix que fa uns dies")
  } else if (signals.noteMentionsFatigue) {
    parts.push("refereix cansament als darrers registres")
  }

  if (signals.stressUp && !signals.energyDown) {
    parts.push("percep més pressió o estrès que abans")
  }

  let text = `${intro} ${parts.join(" i ")}`

  if (signals.sleepBad) {
    text += parts.length
      ? "; convé controlar perquè tampoc dorm bé"
      : " dorm poc bé darrerament; convé fer seguiment del descans"
  } else if (signals.noteMentionsFatigue) {
    text += parts.length
      ? "; en les notes parla de cansament o mal descans, val la pena repassar-ho"
      : " comenta cansament o mal descans a les notes; convé fer seguiment"
  }

  return {
    tone: riskToTone(risk),
    text: `${text}.`,
  }
}

function buildEsNarrative(name, risk, signals) {
  const intro = `Viendo los resultados de los últimos días, ${name}`

  if (risk === "high") {
    return {
      tone: "danger",
      text: `${intro} acumula señales de sobrecarga emocional; conviene priorizar contacto y revisar carga hoy.`,
    }
  }

  if (
    !signals.energyDown &&
    !signals.sleepBad &&
    !signals.stressUp &&
    !signals.moodDown &&
    !signals.noteMentionsFatigue
  ) {
    return {
      tone: risk === "low" ? "positive" : "neutral",
      text:
        risk === "low"
          ? `${intro} se mantiene estable y responde bien a los últimos registros.`
          : `${intro} se mantiene en una línea aceptable; continuar el seguimiento habitual.`,
    }
  }

  const parts = []

  if (signals.energyDown) {
    parts.push("está más cansado y con menos energía que hace unos días")
  } else if (signals.moodDown) {
    parts.push("muestra un ánimo más bajo que hace unos días")
  } else if (signals.noteMentionsFatigue) {
    parts.push("refiere cansancio en los registros recientes")
  }

  if (signals.stressUp && !signals.energyDown) {
    parts.push("percibe más presión o estrés que antes")
  }

  let text = `${intro} ${parts.join(" y ")}`

  if (signals.sleepBad) {
    text += parts.length
      ? "; conviene controlar porque tampoco duerme bien"
      : " duerme mal últimamente; conviene hacer seguimiento del descanso"
  } else if (signals.noteMentionsFatigue) {
    text += parts.length
      ? "; en las notas habla de cansancio o mal descanso, vale la pena repasarlo"
      : " comenta cansancio o mal descanso en las notas; conviene hacer seguimiento"
  }

  return {
    tone: riskToTone(risk),
    text: `${text}.`,
  }
}

function riskToTone(risk) {
  if (risk === "high") return "danger"
  if (risk === "medium") return "warning"
  if (risk === "low") return "positive"
  return "neutral"
}
