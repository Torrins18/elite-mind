export const translations = {
  es: {
    appName: "Elite Mind",
    appEyebrow: "Rendimiento mental",
    signOut: "Cerrar sesión",
    retry: "Reintentar",
    loadingSession: "Cargando sesión...",
    noProfile: "No se encontró tu perfil.",
    noProfileHint:
      "En Supabase SQL Editor, ejecuta el archivo completo supabase/fix-profiles.sql y luego pulsa Reintentar.",
    errorLabel: "Error",
    user: "Usuario",

    common: {
      close: "Cerrar",
    },

    privacy: {
      title: "Privacidad y uso de datos",
      athleteData:
        "Tus autoevaluaciones y notas personales son privadas: solo tú y el/la psicólogo/a autorizado/a pueden ver el detalle.",
      coachView:
        "El/la entrenador/a solo ve resúmenes agregados del equipo, sin respuestas individuales ni notas privadas.",
      psychologistView:
        "El/la psicólogo/a tiene acceso clínico completo para seguimiento, alertas y exportación autorizada.",
      minors:
        "Si eres menor en España, hace falta consentimiento firmado por un tutor legal antes del uso completo.",
      cadence:
        "Rutina recomendada: 1-2 autoevaluaciones por semana (unos 2 minutos cada una).",
    },

    roles: {
      athlete: "Deportista",
      coach: "Entrenador/a",
      psychologist: "Psicólogo/a",
    },

    risk: {
      low: "Estable",
      medium: "Vigilar",
      high: "En riesgo",
      noData: "Sin datos",
    },

    consent: {
      adult: "Mayor de edad",
      guardianSigned: "Consentimiento firmado",
      guardianPending: "Consentimiento pendiente",
      missingBirthDate: "Edad pendiente",
    },

    login: {
      badge: "Psicología deportiva",
      heroTitle: "Entrena la mente.",
      heroTitle2: "Domina el rendimiento.",
      heroText:
        "Autoevaluaciones mentales, inteligencia de equipo para entrenadores y visión clínica completa para psicólogos — diseñado para el deporte de élite.",
      welcome: "Bienvenido/a de nuevo",
      register: "Crear cuenta",
      hintLogin: "Inicia sesión en tu panel de rendimiento.",
      hintRegister:
        "Elige si te registras como deportista o entrenador/a. Los entrenadores deberán ser aprobados por el psicólogo.",
      roleTitle: "Tipo de cuenta",
      athleteOnly: "Registro abierto para deportistas y entrenadores.",
      athleteRoleHint: "Autoevaluaciones y seguimiento personal.",
      coachRoleHint: "Panel de equipo tras aprobación.",
      coachApprovalHint:
        "Tu cuenta de entrenador/a quedará pendiente hasta que el psicólogo apruebe el acceso.",
      registerCoach: "Registro de entrenador/a",
      hintRegisterCoach:
        "Has recibido un enlace válido. Tras registrarte, el psicólogo deberá aprobar tu acceso.",
      inviteValid: "Invitación válida — registro de entrenador/a",
      inviteInvalid:
        "La invitación no es válida o ha caducado. Puedes iniciar sesión o registrarte como deportista.",
      checkingInvite: "Comprobando invitación...",
      createCoachAccount: "Crear cuenta de entrenador/a",
      email: "Correo electrónico",
      password: "Contraseña",
      signIn: "Entrar",
      createAccount: "Crear cuenta",
      createAthleteAccount: "Crear cuenta de deportista",
      toggleSignup: "¿Nuevo usuario? Crear cuenta",
      toggleLogin: "¿Ya tienes cuenta? Iniciar sesión",
      confirmEmail:
        "Cuenta creada. Revisa tu email para confirmar, luego inicia sesión. Tu perfil se creará al entrar.",
      errors: {
        rateLimit:
          "Demasiados intentos de registro o correos enviados. Espera unos minutos o pide al psicólogo que cree la cuenta de prueba.",
        tooSoon: "Espera un minuto antes de volver a intentar el registro.",
        invalidCredentials: "Correo o contraseña incorrectos, o el email aún no está confirmado.",
        alreadyRegistered: "Este correo ya está registrado. Prueba a iniciar sesión.",
      },
    },

    passwordReset: {
      forgotLink: "He olvidado la contraseña",
      title: "Recuperar contraseña",
      subtitle: "Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.",
      missingEmail: "Introduce tu correo electrónico para recuperar la contraseña.",
      send: "Enviar correo de recuperación",
      sent: "Te hemos enviado un correo para recuperar la contraseña.",
      backToLogin: "Volver a iniciar sesión",
      newTitle: "Crear nueva contraseña",
      newSubtitle: "Introduce una nueva contraseña para tu cuenta.",
      newPassword: "Nueva contraseña",
      confirmPassword: "Repetir nueva contraseña",
      update: "Guardar nueva contraseña",
      updating: "Guardando...",
      mismatch: "Las contraseñas no coinciden.",
      minLength: "La contraseña debe tener al menos 6 caracteres.",
      updated: "Contraseña actualizada correctamente.",
      continue: "Continuar",
    },

    invites: {
      title: "Invitaciones de entrenador/a",
      subtitle: "Genera enlaces seguros. Solo quien reciba tu enlace podrá registrarse como entrenador.",
      generate: "Generar nuevo enlace",
      copy: "Copiar enlace",
      copied: "Enlace copiado al portapapeles.",
      approved: "Entrenador/a aprobado/a correctamente.",
      hint: "Comparte el enlace por email o WhatsApp. Caduca en 14 días y solo se puede usar una vez.",
      used: "Usada",
      active: "Activa",
      pendingTitle: "Entrenadores pendientes de aprobación",
      pendingSubtitle: "Valida su identidad antes de darles acceso al panel.",
      noPending: "No hay entrenadores pendientes.",
      approve: "Aprobar acceso",
      reject: "Rechazar",
      rejectConfirm: "¿Rechazar esta solicitud de entrenador/a?",
      rejected: "Solicitud rechazada.",
    },

    rejectedCoach: {
      title: "Solicitud no aprobada",
      subtitle: "Tu acceso como entrenador/a no ha sido validado.",
      text: "El psicólogo responsable ha rechazado tu solicitud. Si crees que es un error, contacta con él/ella directamente.",
    },

    export: {
      button: "Exportar CSV",
      date: "Fecha",
      athlete: "Deportista",
      category: "Categoría",
      risk: "Riesgo",
    },

    pendingCoach: {
      title: "Acceso pendiente de validación",
      subtitle: "Tu cuenta de entrenador/a está en revisión.",
      text: "El psicólogo responsable debe aprobar tu perfil antes de que puedas acceder al panel de equipo. Recibirás acceso en cuanto seas validado/a.",
      refresh: "Comprobar de nuevo",
    },

    team: {
      title: "Categoría / equipo",
      subtitle: "Selecciona el equipo con el que trabajas ahora mismo.",
      current: "Categoría actual",
      choose: "Elegir equipo",
      placeholder: "— Selecciona un equipo —",
      save: "Guardar equipo",
      saving: "Guardando...",
      required: "Debes elegir un equipo para continuar.",
    },

    teams: {
      manageTitle: "Equipos",
      manageSubtitle: "Crea equipos y asigna entrenadores al grupo correspondiente.",
      newPlaceholder: "Nombre del nuevo equipo",
      create: "Crear equipo",
      created: "Equipo creado correctamente.",
      assigned: "Equipo asignado correctamente.",
      chooseForCoach: "Elegir equipo",
      requiredForCoach: "Elige un equipo antes de aprobar este entrenador.",
      coachAssignmentsTitle: "Entrenadores aprobados",
      coachAssignmentsSubtitle: "Actualiza el equipo asignado a cada entrenador.",
      noApprovedCoaches: "Aún no hay entrenadores aprobados.",
      noTeam: "Sin equipo asignado",
      previewTitle: "Previsualizar panel de entrenador",
      previewSubtitle: "Abre la vista de entrenador por equipo sin aprobar ninguna cuenta.",
      previewTeam: "Equipo a revisar",
      previewOpen: "Ver panel",
      previewingTitle: "Previsualización de entrenador",
    },

    onboarding: {
      title: "Verificación de edad",
      subtitle: "Antes de continuar necesitamos confirmar tu edad por protección de datos.",
      birthDate: "Fecha de nacimiento",
      birthDateRequired: "Introduce tu fecha de nacimiento para continuar.",
      privacyHint:
        "En España solo los mayores de 18 años pueden continuar sin consentimiento adicional.",
      save: "Continuar",
      saving: "Guardando...",
      continueAsAthlete: "Continuar como deportista",
      guardianTitle: "Consentimiento del tutor legal",
      guardianSubtitle: "Para continuar, un tutor legal debe firmar la autorización.",
      minorText:
        "Según la fecha indicada, eres menor de edad en España. Un tutor legal debe firmar este consentimiento para activar tu acceso.",
      guardianFullName: "Nombre completo del tutor legal",
      guardianRelationship: "Relación con el/la deportista",
      guardianRelationshipPlaceholder: "Madre, padre, tutor/a legal...",
      guardianEmail: "Email del tutor legal",
      guardianPhone: "Teléfono del tutor legal",
      guardianSignature: "Firma escrita del tutor legal",
      guardianSignaturePlaceholder: "Escribe el nombre completo como firma",
      guardianRequired:
        "Introduce nombre completo, relación, firma y al menos un email o teléfono de contacto.",
      guardianConsentRequired: "El tutor legal debe aceptar y firmar el consentimiento.",
      guardianConsentText:
        "Como tutor legal, autorizo el uso de esta app por parte del/de la menor, confirmo que soy responsable legal y acepto el tratamiento de los datos necesarios para el seguimiento de rendimiento mental.",
      guardianEmailSubject: "Consentimiento legal para Elite Mind",
      guardianEmailBody:
        "Hola, necesitamos que un tutor legal revise y firme el consentimiento para que el/la menor pueda usar Elite Mind. Por favor, completa tus datos en la app junto al/la deportista.",
      emailGuardian: "Preparar email al tutor",
      signAndContinue: "Firmar y continuar",
      correctBirthDate: "Corregir fecha de nacimiento",
    },

    initialAssessment: {
      title: "Evaluación inicial",
      subtitle:
        "Completa este cuestionario antes de empezar. Tus respuestas solo serán visibles para el psicólogo.",
      progress: "Progreso de la evaluación inicial",
      stepLabel: "Paso {current} de {total}",
      personal: "Información personal",
      context: "Contexto personal y familiar",
      sleep: "Hábitos de sueño",
      nutrition: "Hábitos de nutrición",
      sports: "Trayectoria deportiva",
      support: "Apoyo familiar y social",
      choose: "Selecciona una opción",
      teamRequired: "Selecciona tu equipo para continuar.",
      back: "Atrás",
      next: "Siguiente",
      submit: "Enviar evaluación",
      saving: "Guardando...",
      options: {
        never: "Nunca",
        little: "Poco",
        quite: "Bastante",
        very: "Mucho",
        lessThan5: "Menos de 5",
        fiveSix: "5-6",
        sixSeven: "6-7",
        sevenEight: "7-8",
        moreThan8: "Más de 8",
        muchLess: "Mucho menos de lo normal",
        slightlyLess: "Un poco menos",
        same: "Igual que habitualmente",
        better: "Mejor de lo normal",
        low: "Baja",
        medium: "Media",
        high: "Alta",
        sometimes: "A veces",
        often: "A menudo",
        daily: "A diario",
        studyOnly: "Estudio",
        workOnly: "Trabajo",
        studyAndWork: "Estudio y trabajo",
        neitherStudyWork: "Actualmente no estudio ni trabajo",
        balanceVeryGood: "Muy bueno",
        balanceGood: "Bueno",
        balanceAcceptable: "Aceptable",
        balanceDifficult: "Difícil",
        balanceVeryDifficult: "Muy difícil",
      },
      fields: {
        calculatedAge: "Edad actual",
        teamId: "Equipo",
        sportPosition: "Posición deportiva",
        yearsCompeting: "Años compitiendo",
        categoryLevel: "Categoría / nivel",
        livingWith: "¿Con quién vives?",
        familySupport: "¿Tienes apoyo familiar en el deporte?",
        studiesWork: "¿Compatibilizas estudios o trabajo?",
        balanceDifficulty:
          "¿Cómo valoras actualmente el equilibrio entre deporte y vida personal?",
        sleepHoursTypical: "¿Cuántas horas duermes habitualmente?",
        preEventSleep:
          "Antes de una competición o examen importante, ¿cuántas horas sueles dormir?",
        troubleSleepingImportant: "¿Te cuesta dormir antes de eventos importantes?",
        wakeRecovered: "Cuando te despiertas, ¿sueles sentirte recuperado/a?",
        restPerformanceImpact: "¿Crees que el descanso afecta tu rendimiento deportivo?",
        mealsPerDay: "Comidas al día",
        hydration: "Hidratación habitual",
        dailyEnergy: "Percepción de energía diaria",
        caffeineUse: "Cafeína / bebidas energéticas",
        importantInjuries: "¿Has tenido lesiones importantes?",
        hardestSportMoment: "Momento más difícil deportivamente",
        currentGoal: "Principal objetivo actual",
        perceivedPressure: "Presión percibida",
        currentConfidence: "Confianza actual",
        coachRelationship: "Relación con entrenador/a",
      },
    },

    athlete: {
      loading: "Cargando tu panel...",
      greeting: "Encantado/a de verte",
      subtitle:
        "Responde tu autoevaluación mental. Recomendamos 1-2 registros por semana (unos 2 min cada uno).",
      todayTitle: "Estado de hoy",
      todaySubtitle: "Un vistazo rápido a tu registro diario.",
      todayDone: "Ya has completado tu autoevaluación de hoy. Puedes actualizarla si lo necesitas.",
      todayPending: "Aún no has registrado tu autoevaluación de hoy.",
    },

    athleteContact: {
      title: "¿Necesitas hablar con el/la psicólogo/a?",
      subtitle: "Pide una consulta de 30 minutos o envía un mensaje si lo necesitas.",
      requestAppointment: "Pedir consulta 30 min",
      sendMessage: "Enviar mensaje",
      appointmentHint:
        "El/la psicólogo/a recibirá tu solicitud y te contactará para concretar la cita.",
      messageHint: "Escribe un mensaje breve. Solo lo verá el/la psicólogo/a autorizado/a.",
      optionalNote: "Nota opcional",
      messageLabel: "Tu mensaje",
      appointmentPlaceholder: "Ej.: Prefiero por la tarde, tema de ansiedad pre-partido...",
      messagePlaceholder: "Cuéntanos brevemente qué necesitas...",
      confirmAppointment: "Enviar solicitud",
      confirmMessage: "Enviar mensaje",
      sending: "Enviando...",
      appointmentSent: "Solicitud enviada. El/la psicólogo/a te contactará pronto.",
      messageSent: "Mensaje enviado. El/la psicólogo/a lo revisará en breve.",
    },

    checkIn: {
      titleDaily: "Autoevaluación mental",
      subtitleDaily:
        "Recomendamos 1-2 registros por semana (unos 2 minutos). Puedes actualizar el de hoy si ya lo hiciste.",
      titleWeekly: "Autoevaluación + reflexión semanal",
      subtitleWeekly:
        "Primero tu pulso actual; después, preguntas sobre la semana (solo el/la psicólogo/a las ve).",
      dailyBadge: "Registro",
      dailyTitle: "Pulso mental",
      dailyIntro: "Valora cómo estás ahora mismo (1 = muy bajo, 10 = muy alto).",
      weeklyBadge: "Esta semana",
      weeklyTitle: "Reflexión semanal",
      weeklyIntro:
        "Repasa entrenamientos, competición o la semana en general. Sé concreto/a en tus respuestas.",
      weeklyNextHint:
        "La reflexión ampliada aparece en el primer registro de la semana o cada ~7 días. En los demás, solo el pulso mental.",
      metricMood: "Ánimo",
      metricStress: "Estrés",
      metricSleep: "Sueño",
      metricEnergy: "Energía",
      metricFocus: "Concentración",
      mood: "¿Cómo te sientes emocionalmente hoy?",
      moodHint: "Estado de ánimo global al hacer este registro.",
      stress: "¿Qué nivel de estrés o presión percibes hoy?",
      stressHint: "Incluye presión deportiva, académica o personal.",
      sleep: "¿Cómo has dormido la última noche?",
      sleepHint: "Calidad del descanso, no solo las horas.",
      energy: "¿Qué energía física y mental tienes ahora?",
      energyHint: "Sensación de carga disponible para entrenar o competir.",
      focus: "¿Cómo de concentrado/a estás para rendir?",
      focusHint: "Capacidad de mantener la atención en lo importante.",
      notes: "Notas personales (opcional)",
      notesHint: "Solo tú y tu psicólogo/a podéis leer esto.",
      notesPlaceholder: "Ej: nervios antes del partido, buen entreno técnico, discusión en casa…",
      updated: "Registro actualizado.",
      saved: "Registro guardado. Buen trabajo.",
      saving: "Guardando...",
      updateBtn: "Actualizar registro",
      submitDailyBtn: "Guardar autoevaluación",
      submitWeeklyBtn: "Guardar autoevaluación + reflexión",
      performanceRating: "¿Cómo valoras tu rendimiento esta semana?",
      performanceHint: "En entrenamientos, partidos o la semana deportiva en conjunto.",
      involvementRating: "¿Cómo valoras tu implicación y actitud esta semana?",
      involvementHint: "Esfuerzo, compromiso y actitud con el equipo o el objetivo.",
      generalMoodWords: "¿Con qué palabra(s) definirías tu ánimo esta semana?",
      generalMoodWordsHint: "Una o varias palabras que resuman cómo te has sentido.",
      generalMoodWordsPlaceholder: "Ej: motivado/a, cansado/a, ilusionado/a, frustrado/a…",
      moodChangeEvent: "¿Ha pasado algo importante que haya influido en tu estado de ánimo?",
      moodChangeEventHint: "Lesión, resultado, conflicto, logro, cambio de rol, etc.",
      moodChangeEventPlaceholder:
        "Describe el hecho y cómo te ha afectado emocionalmente esta semana.",
      nextGoal: "¿Cuál es tu objetivo principal para los próximos días?",
      nextGoalHint: "Algo concreto y alcanzable en deporte o en tu bienestar mental.",
      nextGoalPlaceholder: "Ej: dormir 8 h, mantener la calma en competición, hablar con el entrenador…",
      ratingLow: "Muy bajo",
      ratingHigh: "Excelente",
      involvementLow: "Mínima",
      involvementHigh: "Máxima",
      low: "Muy bajo",
      high: "Muy alto",
      calm: "Muy tranquilo",
      overwhelmed: "Muy abrumado",
      poor: "Muy mala",
      restorative: "Muy reparador",
      depleted: "Agotado",
      peak: "Al máximo",
      scattered: "Muy disperso",
      lockedIn: "Muy concentrado",
    },

    insights: {
      badge: "Análisis inteligente",
      footer:
        "Generado a partir de las autoevaluaciones de los últimos 7 días (objetivo: 1-2 registros/semana por deportista).",
      footerCoach:
        "Resumen agregado del equipo — sin datos individuales ni respuestas concretas por deportista.",
      namePair: "{a} y {b}",
      nameList: "{names} y {last}",
      teamTitle: "Estado general del equipo",
      athleteTitle: "Lectura individual",
      orgTitle: "Panorama de la categoría",
      areas: {
        mood: "ánimo",
        stress: "estrés",
        sleep: "sueño",
        energy: "energía",
        focus: "concentración",
        general: "carga emocional general",
      },
      trend: {
        stable: "estable",
        better: "mejora de {delta} pts",
        worse: "empeora {delta} pts",
      },
      team: {
        noAthletes: "Aún no hay deportistas asignados a este equipo. Cuando se registren, aquí verás un resumen automático del estado del grupo.",
        noData:
          "Todavía no hay autoevaluaciones recientes. Anima al equipo a completar 1-2 registros por semana para activar el análisis.",
        multipleHighRisk:
          "Prioridad alta: {count} deportistas en riesgo elevado ({names}). El equipo promedia ánimo {mood}/10 y estrés {stress}/10. Conviene revisar estos casos antes del próximo entrenamiento.",
        singleHighRisk:
          "Atención: {name} está en riesgo elevado (último registro). El resto del equipo promedia ánimo {mood}/10 y estrés {stress}/10. Seguimiento recomendado.",
        lowCompliance:
          "Cumplimiento bajo: {count} deportistas sin registro reciente ({names}). Solo {compliance}% ha registrado esta semana. Refuerza la rutina de autoevaluación.",
        risingStress:
          "El estrés del equipo está subiendo (media {stress}/10, +{delta} pts vs. días previos). Cumplimiento semanal: {compliance}%. Valora ajustar carga o hacer repaso grupal breve.",
        decliningMood:
          "El ánimo colectivo baja (media {mood}/10, −{delta} pts). Cumplimiento semanal: {compliance}%. Buen momento para detectar fatiga o presión acumulada.",
        healthy:
          "Buen momento del equipo: ánimo {mood}/10, energía {energy}/10 y {compliance}% de cumplimiento semanal. Mantén la rutina de registro y refuerza lo que está funcionando.",
        mixed:
          "Estado mixto: ánimo {mood}/10, estrés {stress}/10, {compliance}% de cumplimiento semanal y {watch} deportistas en vigilancia. Sin alertas críticas, pero conviene monitorizar.",
        coach: {
          noAthletes:
            "Aún no hay deportistas en este equipo. Cuando empiecen a registrarse, verás aquí un resumen global del grupo.",
          noData:
            "Todavía no hay autoevaluaciones recientes en el equipo. Anima al grupo a 1-2 registros por semana.",
          multipleHighRisk:
            "Prioridad alta: {count} deportistas en riesgo elevado según las métricas agregadas. El equipo promedia ánimo {mood}/10 y estrés {stress}/10. El psicólogo/a hará el seguimiento individual.",
          singleHighRisk:
            "Atención: {count} deportista en riesgo elevado. El equipo promedia ánimo {mood}/10 y estrés {stress}/10. El psicólogo/a hará el seguimiento individual.",
          lowCompliance:
            "Cumplimiento bajo: {count} deportistas sin registro reciente. Solo {compliance}% ha registrado esta semana. Refuerza la rutina de autoevaluación con el grupo.",
          risingStress:
            "El estrés medio del equipo está subiendo ({stress}/10, +{delta} pts). Cumplimiento semanal: {compliance}%. Valora ajustar carga o hacer un repaso grupal breve.",
          decliningMood:
            "El ánimo medio del equipo baja ({mood}/10, −{delta} pts). Cumplimiento semanal: {compliance}%. Buen momento para detectar fatiga o presión acumulada.",
          healthy:
            "Buen momento del equipo: ánimo medio {mood}/10, energía {energy}/10 y {compliance}% de cumplimiento semanal. Mantén la rutina de registro.",
          mixed:
            "Estado mixto del equipo: ánimo {mood}/10, estrés {stress}/10, {compliance}% de cumplimiento semanal y {watch} deportistas en vigilancia. Sin alertas críticas agregadas.",
        },
      },
      athlete: {
        noData:
          "{name} aún no tiene autoevaluaciones recientes. Cuando complete el primer registro, aquí aparecerá una lectura individual.",
        highRisk:
          "{name} requiere atención prioritaria: ánimo {mood}/10, estrés {stress}/10, sueño {sleep}/10 y energía {energy}/10. Áreas más sensibles: {areas}.",
        inactive:
          "{name} lleva {days} días sin autoevaluación. El semáforo no refleja el estado actual; contacta para reactivar el seguimiento.",
        watch:
          "{name} en vigilancia: ánimo {mood}/10 y estrés {stress}/10. Factores a observar: {areas}. {notes}",
        hasNotes: "Ha dejado notas personales en el último registro.",
        trendConcern:
          "{name} mantiene registro activo, pero la tendencia preocupa (ánimo {mood}/10, estrés {stress}/10). Evolución: ánimo {moodTrend}, estrés {stressTrend}.",
        stableWithNotes:
          "{name} se mantiene estable (ánimo medio {mood}/10, energía {energy}/10 en 7 días) y ha dejado notas recientes. Revisa el detalle clínico si procede.",
        healthy:
          "{name} en buen momento: ánimo medio {mood}/10, energía {energy}/10 y sueño {sleep}/10. Sin señales de riesgo en la última semana.",
        stable:
          "{name} estable en el último registro (ánimo {mood}/10, estrés {stress}/10, sueño {sleep}/10). Sueño {sleepTrend}.",
      },
    },

    chart: {
      trends: "Tendencias",
      trendsEmpty: "Completa autoevaluaciones para ver tu curva de rendimiento.",
      noData: "Sin datos aún.",
      title7d: "Tendencias de rendimiento (7 días)",
      subtitle7d: "Sigue tu ánimo, energía y estrés a lo largo del tiempo.",
      mood: "Ánimo",
      energy: "Energía",
      stress: "Estrés",
    },

    coach: {
      loading: "Cargando inteligencia del equipo...",
      team: "Tu categoría",
      subtitle:
        "Solo ves resúmenes agregados del equipo. El seguimiento individual lo realiza el/la psicólogo/a.",
      athletes: "Deportistas",
      checkedInThisWeek: "Con registro esta semana",
      weeklyCompliance: "Objetivo: 1-2 registros/semana",
      teamAvgMood: "Ánimo medio del equipo",
      teamAvgStress: "Estrés medio del equipo",
      aggregatedOnly: "Media del equipo (7 días)",
      teamSummary: "Panorama del equipo",
      teamSummarySubtitle: "Conteos agregados — sin identificar respuestas individuales.",
      summaryCompliance: "Con registro (7 días)",
      summaryStable: "Estables (último registro)",
      summaryWatch: "En vigilancia",
      summaryAtRisk: "En riesgo elevado",
      summaryInactive: "Sin registro reciente",
      privacyNote:
        "No tienes acceso a notas privadas ni a las respuestas concretas de cada deportista. Para casos individuales, contacta con el/la psicólogo/a.",
      noTeamTitle: "Equipo pendiente",
      noTeamSubtitle: "Tu acceso como entrenador/a está aprobado.",
      noTeamText:
        "El psicólogo todavía debe asignarte una categoría o equipo para activar el panel.",
    },

    psychologist: {
      loading: "Cargando vista clínica...",
      title: "Vista clínica",
      subtitle:
        "Visibilidad completa de deportistas — tendencias, riesgo emocional y notas privadas.",
      athletesMonitored: "Deportistas monitorizados",
      orgAvgMood: "Ánimo medio global",
      highEmotionalRisk: "Riesgo emocional alto",
      entriesWithNotes: "Entradas con notas",
      allAthletes: "Todos los deportistas",
      allAthletesSubtitle: "Selecciona un deportista para ver su historial.",
      historySubtitle: "Historial completo de autoevaluaciones, incluidas notas privadas.",
      emotionalRisk: "Indicadores de riesgo emocional",
      emotionalRiskSubtitle: "Puntuaciones de alto riesgo o notas personales relevantes.",
      checkInLog: "Registro de autoevaluaciones",
      checkInLogSubtitle: "Todas las autoevaluaciones y notas privadas.",
      noCheckIns: "Sin autoevaluaciones para este deportista.",
      noNotes: "Sin notas personales.",
      noAthletes: "Sin deportistas",
      noAthletesText: "Registra deportistas para empezar el seguimiento.",
      heatmap: "Mapa de riesgo del organización",
      heatmapSubtitle: "Estado más reciente de todos los deportistas.",
      hasNotes: " · Tiene notas",
      moodStress: "Ánimo {mood} · Estrés {stress}",
      filterTitle: "Filtrar por categoría",
      filterSubtitle: "Centra la vista clínica en un grupo concreto.",
      filterLabel: "Categoría",
      filterAll: "Todas las categorías",
      noAthletesInCategory: "No hay deportistas en esta categoría.",
      initialAssessment: "Evaluación inicial",
      initialAssessmentSubtitle: "Respuestas privadas visibles solo para psicología.",
      noInitialAssessment: "Este deportista aún no ha completado la evaluación inicial.",
      assessmentMissing: "Evaluación pendiente",
      guardianConsents: "Consentimientos",
      pendingConsents: "{count} pendientes",
      consentTitle: "Consentimiento y edad",
      consentSubtitle: "Registro de mayoría de edad o autorización del tutor legal.",
      birthDate: "Fecha de nacimiento",
      consentStatus: "Estado",
      guardianName: "Tutor legal",
      guardianRelationship: "Relación",
      guardianContact: "Contacto",
      guardianSignature: "Firma",
      consentSignedAt: "Firmado el",
      consentVersion: "Versión del texto",
      pendingAppointments: "Solicitudes de consulta",
      pendingAppointmentsSubtitle: "Peticiones pendientes de cita de 30 minutos.",
      unreadMessages: "Mensajes sin leer",
      unreadMessagesSubtitle: "Mensajes directos de deportistas.",
      noPendingAppointments: "Sin solicitudes pendientes.",
      noUnreadMessages: "Sin mensajes sin leer.",
      appointmentNoMessage: "Sin nota adicional.",
      markAppointmentHandled: "Marcar como gestionada",
      markMessageRead: "Marcar como leído",
      viewAthlete: "Ver deportista",
      unknownAthlete: "Deportista desconocido",
    },

    lang: {
      es: "Español",
      ca: "Català",
    },
  },

  ca: {
    appName: "Elite Mind",
    appEyebrow: "Rendiment mental",
    signOut: "Tancar sessió",
    retry: "Reintentar",
    loadingSession: "Carregant sessió...",
    noProfile: "No s'ha trobat el teu perfil.",
    noProfileHint:
      "A Supabase SQL Editor, executa el fitxer complet supabase/fix-profiles.sql i després prem Reintentar.",
    errorLabel: "Error",
    user: "Usuari",

    common: {
      close: "Tancar",
    },

    privacy: {
      title: "Privacitat i ús de dades",
      athleteData:
        "Les teves autoavaluacions i notes personals són privades: només tu i el/la psicòleg/òloga autoritzat/da en veuen el detall.",
      coachView:
        "L'entrenador/a només veu resums agregats de l'equip, sense respostes individuals ni notes privades.",
      psychologistView:
        "El/la psicòleg/òloga té accés clínic complet per seguiment, alertes i exportació autoritzada.",
      minors:
        "Si ets menor a Espanya, cal consentiment signat per un tutor legal abans de l'ús complet.",
      cadence:
        "Rutina recomanada: 1-2 autoavaluacions per setmana (uns 2 minuts cadascuna).",
    },

    roles: {
      athlete: "Esportista",
      coach: "Entrenador/a",
      psychologist: "Psicòleg/òloga",
    },

    risk: {
      low: "Estable",
      medium: "Vigilar",
      high: "En risc",
      noData: "Sense dades",
    },

    consent: {
      adult: "Major d'edat",
      guardianSigned: "Consentiment signat",
      guardianPending: "Consentiment pendent",
      missingBirthDate: "Edat pendent",
    },

    login: {
      badge: "Psicologia de l'esport",
      heroTitle: "Entrena la ment.",
      heroTitle2: "Domina el rendiment.",
      heroText:
        "Autoavaluacions mentals, intel·ligència d'equip per a entrenadors i visió clínica completa per a psicòlegs — dissenyat per a l'esport d'elit.",
      welcome: "Benvingut/da de nou",
      register: "Crear compte",
      hintLogin: "Inicia sessió al teu panell de rendiment.",
      hintRegister:
        "Tria si et registres com a esportista o entrenador/a. Els entrenadors hauran de ser aprovats pel psicòleg.",
      roleTitle: "Tipus de compte",
      athleteOnly: "Registre obert per a esportistes i entrenadors.",
      athleteRoleHint: "Autoavaluacions i seguiment personal.",
      coachRoleHint: "Panell d'equip després de l'aprovació.",
      coachApprovalHint:
        "El teu compte d'entrenador/a quedarà pendent fins que el psicòleg aprovi l'accés.",
      registerCoach: "Registre d'entrenador/a",
      hintRegisterCoach:
        "Has rebut un enllaç vàlid. Després de registrar-te, el psicòleg haurà d'aprovar el teu accés.",
      inviteValid: "Invitació vàlida — registre d'entrenador/a",
      inviteInvalid:
        "La invitació no és vàlida o ha caducat. Pots iniciar sessió o registrar-te com a esportista.",
      checkingInvite: "Comprovant invitació...",
      createCoachAccount: "Crear compte d'entrenador/a",
      email: "Correu electrònic",
      password: "Contrasenya",
      signIn: "Entrar",
      createAccount: "Crear compte",
      createAthleteAccount: "Crear compte d'esportista",
      toggleSignup: "Nou usuari? Crear compte",
      toggleLogin: "Ja tens compte? Iniciar sessió",
      confirmEmail:
        "Compte creat. Revisa el teu email per confirmar, després inicia sessió. El teu perfil es crearà en entrar.",
      errors: {
        rateLimit:
          "Massa intents de registre o correus enviats. Espera uns minuts o demana al psicòleg que creï el compte de prova.",
        tooSoon: "Espera un minut abans de tornar a intentar el registre.",
        invalidCredentials: "Correu o contrasenya incorrectes, o el correu encara no està confirmat.",
        alreadyRegistered: "Aquest correu ja està registrat. Prova d'iniciar sessió.",
      },
    },

    passwordReset: {
      forgotLink: "He oblidat la contrasenya",
      title: "Recuperar contrasenya",
      subtitle: "Escriu el teu correu i t'enviarem un enllaç per crear una nova contrasenya.",
      missingEmail: "Introdueix el teu correu electrònic per recuperar la contrasenya.",
      send: "Enviar correu de recuperació",
      sent: "T'hem enviat un correu per recuperar la contrasenya.",
      backToLogin: "Tornar a iniciar sessió",
      newTitle: "Crear nova contrasenya",
      newSubtitle: "Introdueix una nova contrasenya per al teu compte.",
      newPassword: "Nova contrasenya",
      confirmPassword: "Repetir nova contrasenya",
      update: "Desar nova contrasenya",
      updating: "Desant...",
      mismatch: "Les contrasenyes no coincideixen.",
      minLength: "La contrasenya ha de tenir almenys 6 caràcters.",
      updated: "Contrasenya actualitzada correctament.",
      continue: "Continuar",
    },

    invites: {
      title: "Invitacions d'entrenador/a",
      subtitle: "Genera enllaços segurs. Només qui rebi el teu enllaç es podrà registrar com a entrenador.",
      generate: "Generar nou enllaç",
      copy: "Copiar enllaç",
      copied: "Enllaç copiat al porta-retalls.",
      approved: "Entrenador/a aprovat/da correctament.",
      hint: "Comparteix l'enllaç per email o WhatsApp. Caduca en 14 dies i només es pot usar una vegada.",
      used: "Usada",
      active: "Activa",
      pendingTitle: "Entrenadors pendents d'aprovació",
      pendingSubtitle: "Valida la seva identitat abans de donar-los accés al panell.",
      noPending: "No hi ha entrenadors pendents.",
      approve: "Aprovar accés",
      reject: "Rebutjar",
      rejectConfirm: "Rebutjar aquesta sol·licitud d'entrenador/a?",
      rejected: "Sol·licitud rebutjada.",
    },

    rejectedCoach: {
      title: "Sol·licitud no aprovada",
      subtitle: "El teu accés com a entrenador/a no ha estat validat.",
      text: "El psicòleg responsable ha rebutjat la teva sol·licitud. Si creus que és un error, contacta amb ell/ella directament.",
    },

    export: {
      button: "Exportar CSV",
      date: "Data",
      athlete: "Esportista",
      category: "Categoria",
      risk: "Risc",
    },

    pendingCoach: {
      title: "Accés pendent de validació",
      subtitle: "El teu compte d'entrenador/a està en revisió.",
      text: "El psicòleg responsable ha d'aprovar el teu perfil abans que puguis accedir al panell d'equip. Rebràs accés tan aviat com siguis validat/da.",
      refresh: "Comprovar de nou",
    },

    team: {
      title: "Categoria / equip",
      subtitle: "Selecciona l'equip amb el qual treballes ara mateix.",
      current: "Equip actual",
      choose: "Triar equip",
      placeholder: "— Selecciona un equip —",
      save: "Desar equip",
      saving: "Desant...",
      required: "Has de triar un equip per continuar.",
    },

    teams: {
      manageTitle: "Equips",
      manageSubtitle: "Crea equips i assigna entrenadors al grup corresponent.",
      newPlaceholder: "Nom del nou equip",
      create: "Crear equip",
      created: "Equip creat correctament.",
      assigned: "Equip assignat correctament.",
      chooseForCoach: "Triar equip",
      requiredForCoach: "Tria un equip abans d'aprovar aquest entrenador.",
      coachAssignmentsTitle: "Entrenadors aprovats",
      coachAssignmentsSubtitle: "Actualitza l'equip assignat a cada entrenador.",
      noApprovedCoaches: "Encara no hi ha entrenadors aprovats.",
      noTeam: "Sense equip assignat",
      previewTitle: "Previsualitzar panell d'entrenador",
      previewSubtitle: "Obre la vista d'entrenador per equip sense aprovar cap compte.",
      previewTeam: "Equip a revisar",
      previewOpen: "Veure panell",
      previewingTitle: "Previsualització d'entrenador",
    },

    onboarding: {
      title: "Verificació d'edat",
      subtitle: "Abans de continuar necessitem confirmar la teva edat per protecció de dades.",
      birthDate: "Data de naixement",
      birthDateRequired: "Introdueix la teva data de naixement per continuar.",
      privacyHint:
        "A Espanya només els majors de 18 anys poden continuar sense consentiment addicional.",
      save: "Continuar",
      saving: "Desant...",
      continueAsAthlete: "Continuar com a esportista",
      guardianTitle: "Consentiment del tutor legal",
      guardianSubtitle: "Per continuar, un tutor legal ha de signar l'autorització.",
      minorText:
        "Segons la data indicada, ets menor d'edat a Espanya. Un tutor legal ha de signar aquest consentiment per activar el teu accés.",
      guardianFullName: "Nom complet del tutor legal",
      guardianRelationship: "Relació amb l'esportista",
      guardianRelationshipPlaceholder: "Mare, pare, tutor/a legal...",
      guardianEmail: "Email del tutor legal",
      guardianPhone: "Telèfon del tutor legal",
      guardianSignature: "Signatura escrita del tutor legal",
      guardianSignaturePlaceholder: "Escriu el nom complet com a signatura",
      guardianRequired:
        "Introdueix nom complet, relació, signatura i almenys un email o telèfon de contacte.",
      guardianConsentRequired: "El tutor legal ha d'acceptar i signar el consentiment.",
      guardianConsentText:
        "Com a tutor legal, autoritzo l'ús d'aquesta app per part del/de la menor, confirmo que en soc responsable legal i accepto el tractament de les dades necessàries per al seguiment del rendiment mental.",
      guardianEmailSubject: "Consentiment legal per a Elite Mind",
      guardianEmailBody:
        "Hola, necessitem que un tutor legal revisi i signi el consentiment perquè el/la menor pugui utilitzar Elite Mind. Si us plau, completa les teves dades a l'app al costat de l'esportista.",
      emailGuardian: "Preparar email al tutor",
      signAndContinue: "Signar i continuar",
      correctBirthDate: "Corregir data de naixement",
    },

    initialAssessment: {
      title: "Avaluació inicial",
      subtitle:
        "Completa aquest qüestionari abans de començar. Les teves respostes només seran visibles per al psicòleg.",
      progress: "Progrés de l'avaluació inicial",
      stepLabel: "Pas {current} de {total}",
      personal: "Informació personal",
      context: "Context personal i familiar",
      sleep: "Hàbits de son",
      nutrition: "Hàbits de nutrició",
      sports: "Trajectòria esportiva",
      support: "Suport familiar i social",
      choose: "Selecciona una opció",
      teamRequired: "Selecciona el teu equip per continuar.",
      back: "Enrere",
      next: "Següent",
      submit: "Enviar avaluació",
      saving: "Desant...",
      options: {
        never: "Mai",
        little: "Poc",
        quite: "Bastant",
        very: "Molt",
        lessThan5: "Menys de 5",
        fiveSix: "5-6",
        sixSeven: "6-7",
        sevenEight: "7-8",
        moreThan8: "Més de 8",
        muchLess: "Molt menys del normal",
        slightlyLess: "Una mica menys",
        same: "Igual que habitualment",
        better: "Millor del normal",
        low: "Baixa",
        medium: "Mitjana",
        high: "Alta",
        sometimes: "A vegades",
        often: "Sovint",
        daily: "A diari",
        studyOnly: "Estudio",
        workOnly: "Treballo",
        studyAndWork: "Estudio i treballo",
        neitherStudyWork: "Actualment no estudio ni treballo",
        balanceVeryGood: "Molt bo",
        balanceGood: "Bo",
        balanceAcceptable: "Acceptable",
        balanceDifficult: "Difícil",
        balanceVeryDifficult: "Molt difícil",
      },
      fields: {
        calculatedAge: "Edat actual",
        teamId: "Equip",
        sportPosition: "Posició esportiva",
        yearsCompeting: "Anys competint",
        categoryLevel: "Categoria / nivell",
        livingWith: "Amb qui vius?",
        familySupport: "Tens suport familiar en l'esport?",
        studiesWork: "Compatibilitzes estudis o feina?",
        balanceDifficulty:
          "Com valores actualment l'equilibri entre esport i vida personal?",
        sleepHoursTypical: "Quantes hores dorms habitualment?",
        preEventSleep:
          "Abans d'una competició o examen important, quantes hores acostumes a dormir?",
        troubleSleepingImportant: "Et costa dormir abans d'esdeveniments importants?",
        wakeRecovered: "Quan et despertes, acostumes a sentir-te recuperat/da?",
        restPerformanceImpact: "Creus que el descans afecta el teu rendiment esportiu?",
        mealsPerDay: "Àpats al dia",
        hydration: "Hidratació habitual",
        dailyEnergy: "Percepció d'energia diària",
        caffeineUse: "Cafeïna / begudes energètiques",
        importantInjuries: "Has tingut lesions importants?",
        hardestSportMoment: "Moment més difícil esportivament",
        currentGoal: "Principal objectiu actual",
        perceivedPressure: "Pressió percebuda",
        currentConfidence: "Confiança actual",
        coachRelationship: "Relació amb entrenador/a",
      },
    },

    athlete: {
      loading: "Carregant el teu panell...",
      greeting: "Content/a de veure't",
      subtitle:
        "Respon la teva autoavaluació mental. Recomanem 1-2 registres per setmana (uns 2 min cadascun).",
      todayTitle: "Estat d'avui",
      todaySubtitle: "Una ullada ràpida al teu registre diari.",
      todayDone: "Ja has completat la teva autoavaluació d'avui. Pots actualitzar-la si cal.",
      todayPending: "Encara no has registrat la teva autoavaluació d'avui.",
    },

    athleteContact: {
      title: "Necessites parlar amb el/la psicòleg/òloga?",
      subtitle: "Demana una consulta de 30 minuts o envia un missatge si ho necessites.",
      requestAppointment: "Demanar consulta 30 min",
      sendMessage: "Enviar missatge",
      appointmentHint:
        "El/la psicòleg/òloga rebrà la teva sol·licitud i et contactarà per concretar la cita.",
      messageHint: "Escriu un missatge breu. Només el veurà el/la psicòleg/òloga autoritzat/da.",
      optionalNote: "Nota opcional",
      messageLabel: "El teu missatge",
      appointmentPlaceholder: "Ex.: Prefereixo per la tarda, tema d'ansietat pre-partit...",
      messagePlaceholder: "Explica'ns breument què necessites...",
      confirmAppointment: "Enviar sol·licitud",
      confirmMessage: "Enviar missatge",
      sending: "Enviant...",
      appointmentSent: "Sol·licitud enviada. El/la psicòleg/òloga et contactarà aviat.",
      messageSent: "Missatge enviat. El/la psicòleg/òloga el revisarà aviat.",
    },

    checkIn: {
      titleDaily: "Autoavaluació mental",
      subtitleDaily:
        "Recomanem 1-2 registres per setmana (uns 2 minuts). Pots actualitzar el d'avui si ja el vas fer.",
      titleWeekly: "Autoavaluació + reflexió setmanal",
      subtitleWeekly:
        "Primer el teu pols actual; després, preguntes sobre la setmana (només ho veu el/la psicòleg/òloga).",
      dailyBadge: "Registre",
      dailyTitle: "Pols mental",
      dailyIntro: "Valora com estàs ara mateix (1 = molt baix, 10 = molt alt).",
      weeklyBadge: "Aquesta setmana",
      weeklyTitle: "Reflexió setmanal",
      weeklyIntro:
        "Repassa entrenaments, competició o la setmana en general. Sigues concret/a a les respostes.",
      weeklyNextHint:
        "La reflexió ampliada surt al primer registre de la setmana o cada ~7 dies. En la resta, només el pols mental.",
      metricMood: "Ànim",
      metricStress: "Estrès",
      metricSleep: "Son",
      metricEnergy: "Energia",
      metricFocus: "Concentració",
      mood: "Com et sents emocionalment avui?",
      moodHint: "Estat d'ànim global en fer aquest registre.",
      stress: "Quin nivell d'estrès o pressió perceps avui?",
      stressHint: "Inclou pressió esportiva, acadèmica o personal.",
      sleep: "Com has dormit la darrera nit?",
      sleepHint: "Qualitat del descans, no només les hores.",
      energy: "Quina energia física i mental tens ara?",
      energyHint: "Sensació de càrrega disponible per entrenar o competir.",
      focus: "Com de concentrat/da estàs per rendir?",
      focusHint: "Capacitat de mantenir l'atenció en el que importa.",
      notes: "Notes personals (opcional)",
      notesHint: "Només tu i el/la psicòleg/òloga podeu llegir això.",
      notesPlaceholder: "Ex: nervis abans del partit, bon entrenament tècnic, discussió a casa…",
      updated: "Registre actualitzat.",
      saved: "Registre desat. Bon treball.",
      saving: "Desant...",
      updateBtn: "Actualitzar registre",
      submitDailyBtn: "Desar autoavaluació",
      submitWeeklyBtn: "Desar autoavaluació + reflexió",
      performanceRating: "Com valores el teu rendiment aquesta setmana?",
      performanceHint: "En entrenaments, partits o la setmana esportiva en conjunt.",
      involvementRating: "Com valores la teva implicació i actitud aquesta setmana?",
      involvementHint: "Esforç, compromís i actitud amb l'equip o l'objectiu.",
      generalMoodWords: "Amb quina(es) paraula(es) definiries el teu ànim aquesta setmana?",
      generalMoodWordsHint: "Una o diverses paraules que resumeixin com t'has sentit.",
      generalMoodWordsPlaceholder: "Ex: motivat/da, cansat/da, il·lusionat/da, frustrat/da…",
      moodChangeEvent: "Ha passat alguna cosa important que hagi influït en el teu estat d'ànim?",
      moodChangeEventHint: "Lesió, resultat, conflicte, assoliment, canvi de rol, etc.",
      moodChangeEventPlaceholder:
        "Descriu el fet i com t'ha afectat emocionalment aquesta setmana.",
      nextGoal: "Quin és el teu objectiu principal per als propers dies?",
      nextGoalHint: "Alguna cosa concreta i assolible en esport o en el teu benestar mental.",
      nextGoalPlaceholder:
        "Ex: dormir 8 h, mantenir la calma en competició, parlar amb l'entrenador/a…",
      ratingLow: "Molt baix",
      ratingHigh: "Excel·lent",
      involvementLow: "Mínima",
      involvementHigh: "Màxima",
      low: "Molt baix",
      high: "Molt alt",
      calm: "Molt tranquil",
      overwhelmed: "Molt abrumat",
      poor: "Molt dolent",
      restorative: "Molt reparador",
      depleted: "Esgotat",
      peak: "Al màxim",
      scattered: "Molt dispers",
      lockedIn: "Molt concentrat",
    },

    insights: {
      badge: "Anàlisi intel·ligent",
      footer:
        "Generat a partir de les autoavaluacions dels últims 7 dies (objectiu: 1-2 registres/setmana per esportista).",
      footerCoach:
        "Resum agregat de l'equip — sense dades individuals ni respostes concretes per esportista.",
      namePair: "{a} i {b}",
      nameList: "{names} i {last}",
      teamTitle: "Estat general de l'equip",
      athleteTitle: "Lectura individual",
      orgTitle: "Panorama de la categoria",
      areas: {
        mood: "ànim",
        stress: "estrès",
        sleep: "son",
        energy: "energia",
        focus: "concentració",
        general: "càrrega emocional general",
      },
      trend: {
        stable: "estable",
        better: "millora de {delta} pts",
        worse: "empitjora {delta} pts",
      },
      team: {
        noAthletes:
          "Encara no hi ha esportistes assignats a aquest equip. Quan es registrin, aquí veuràs un resum automàtic de l'estat del grup.",
        noData:
          "Encara no hi ha autoavaluacions recents. Anima l'equip a fer 1-2 registres per setmana per activar l'anàlisi.",
        multipleHighRisk:
          "Prioritat alta: {count} esportistes en risc elevat ({names}). L'equip fa una mitjana d'ànim {mood}/10 i estrès {stress}/10. Conve revisar aquests casos abans del proper entrenament.",
        singleHighRisk:
          "Atenció: {name} està en risc elevat (últim registre). La resta de l'equip fa una mitjana d'ànim {mood}/10 i estrès {stress}/10. Seguiment recomanat.",
        lowCompliance:
          "Compliment baix: {count} esportistes sense registre recent ({names}). Només un {compliance}% ha registrat aquesta setmana. Reforça la rutina d'autoavaluació.",
        risingStress:
          "L'estrès de l'equip puja (mitjana {stress}/10, +{delta} pts vs. dies previs). Compliment setmanal: {compliance}%. Valora ajustar càrrega o fer un repàs grupal breu.",
        decliningMood:
          "L'ànim col·lectiu baixa (mitjana {mood}/10, −{delta} pts). Compliment setmanal: {compliance}%. Bon moment per detectar fatiga o pressió acumulada.",
        healthy:
          "Bon moment de l'equip: ànim {mood}/10, energia {energy}/10 i {compliance}% de compliment setmanal. Mantén la rutina de registre i reforça el que funciona.",
        mixed:
          "Estat mixt: ànim {mood}/10, estrès {stress}/10, {compliance}% de compliment setmanal i {watch} esportistes en vigilància. Sense alertes crítiques, però convé monitoritzar.",
        coach: {
          noAthletes:
            "Encara no hi ha esportistes en aquest equip. Quan comencin a registrar-se, veuràs aquí un resum global del grup.",
          noData:
            "Encara no hi ha autoavaluacions recents a l'equip. Anima el grup a 1-2 registres per setmana.",
          multipleHighRisk:
            "Prioritat alta: {count} esportistes en risc elevat segons les mètriques agregades. L'equip fa una mitjana d'ànim {mood}/10 i estrès {stress}/10. El psicòleg/òloga farà el seguiment individual.",
          singleHighRisk:
            "Atenció: {count} esportista en risc elevat. L'equip fa una mitjana d'ànim {mood}/10 i estrès {stress}/10. El psicòleg/òloga farà el seguiment individual.",
          lowCompliance:
            "Compliment baix: {count} esportistes sense registre recent. Només un {compliance}% ha registrat aquesta setmana. Reforça la rutina d'autoavaluació amb el grup.",
          risingStress:
            "L'estrès mitjà de l'equip puja ({stress}/10, +{delta} pts). Compliment setmanal: {compliance}%. Valora ajustar càrrega o fer un repàs grupal breu.",
          decliningMood:
            "L'ànim mitjà de l'equip baixa ({mood}/10, −{delta} pts). Compliment setmanal: {compliance}%. Bon moment per detectar fatiga o pressió acumulada.",
          healthy:
            "Bon moment de l'equip: ànim mitjà {mood}/10, energia {energy}/10 i {compliance}% de compliment setmanal. Mantén la rutina de registre.",
          mixed:
            "Estat mixt de l'equip: ànim {mood}/10, estrès {stress}/10, {compliance}% de compliment setmanal i {watch} esportistes en vigilància. Sense alertes crítiques agregades.",
        },
      },
      athlete: {
        noData:
          "{name} encara no té autoavaluacions recents. Quan completi el primer registre, aquí apareixerà una lectura individual.",
        highRisk:
          "{name} requereix atenció prioritària: ànim {mood}/10, estrès {stress}/10, son {sleep}/10 i energia {energy}/10. Àrees més sensibles: {areas}.",
        inactive:
          "{name} fa {days} dies sense autoavaluació. El semàfor no reflecteix l'estat actual; contacta per reactivar el seguiment.",
        watch:
          "{name} en vigilància: ànim {mood}/10 i estrès {stress}/10. Factors a observar: {areas}. {notes}",
        hasNotes: "Ha deixat notes personals a l'últim registre.",
        trendConcern:
          "{name} manté registre actiu, però la tendència preocupa (ànim {mood}/10, estrès {stress}/10). Evolució: ànim {moodTrend}, estrès {stressTrend}.",
        stableWithNotes:
          "{name} es manté estable (ànim mitjà {mood}/10, energia {energy}/10 en 7 dies) i ha deixat notes recents. Revisa el detall clínic si cal.",
        healthy:
          "{name} en bon moment: ànim mitjà {mood}/10, energia {energy}/10 i son {sleep}/10. Sense senyals de risc l'última setmana.",
        stable:
          "{name} estable a l'últim registre (ànim {mood}/10, estrès {stress}/10, son {sleep}/10). Son {sleepTrend}.",
      },
    },

    chart: {
      trends: "Tendències",
      trendsEmpty: "Completa autoavaluacions per veure la teva corba de rendiment.",
      noData: "Sense dades encara.",
      title7d: "Tendències de rendiment (7 dies)",
      subtitle7d: "Segueix el teu ànim, energia i estrès al llarg del temps.",
      mood: "Ànim",
      energy: "Energia",
      stress: "Estrès",
    },

    coach: {
      loading: "Carregant intel·ligència de l'equip...",
      team: "La teva categoria",
      subtitle:
        "Només veus resums agregats de l'equip. El seguiment individual el fa el/la psicòleg/òloga.",
      athletes: "Esportistes",
      checkedInThisWeek: "Amb registre aquesta setmana",
      weeklyCompliance: "Objectiu: 1-2 registres/setmana",
      teamAvgMood: "Ànim mitjà de l'equip",
      teamAvgStress: "Estrès mitjà de l'equip",
      aggregatedOnly: "Mitjana de l'equip (7 dies)",
      teamSummary: "Panorama de l'equip",
      teamSummarySubtitle: "Recomptes agregats — sense identificar respostes individuals.",
      summaryCompliance: "Amb registre (7 dies)",
      summaryStable: "Estables (últim registre)",
      summaryWatch: "En vigilància",
      summaryAtRisk: "En risc elevat",
      summaryInactive: "Sense registre recent",
      privacyNote:
        "No tens accés a notes privades ni a les respostes concretes de cada esportista. Per a casos individuals, contacta amb el/la psicòleg/òloga.",
      noTeamTitle: "Equip pendent",
      noTeamSubtitle: "El teu accés com a entrenador/a està aprovat.",
      noTeamText:
        "El psicòleg encara t'ha d'assignar una categoria o equip per activar el panell.",
    },

    psychologist: {
      loading: "Carregant vista clínica...",
      title: "Vista clínica",
      subtitle:
        "Visibilitat completa d'esportistes — tendències, risc emocional i notes privades.",
      athletesMonitored: "Esportistes monitoritzats",
      orgAvgMood: "Ànim mitjà global",
      highEmotionalRisk: "Risc emocional alt",
      entriesWithNotes: "Entrades amb notes",
      allAthletes: "Tots els esportistes",
      allAthletesSubtitle: "Selecciona un esportista per veure el seu historial.",
      historySubtitle: "Historial complet d'autoavaluacions, incloses notes privades.",
      emotionalRisk: "Indicadors de risc emocional",
      emotionalRiskSubtitle:
        "Puntuacions d'alt risc o notes personals rellevants.",
      checkInLog: "Registre d'autoavaluacions",
      checkInLogSubtitle: "Totes les autoavaluacions i notes privades.",
      noCheckIns: "Sense autoavaluacions per a aquest esportista.",
      noNotes: "Sense notes personals.",
      noAthletes: "Sense esportistes",
      noAthletesText: "Registra esportistes per començar el seguiment.",
      heatmap: "Mapa de risc de l'organització",
      heatmapSubtitle: "Estat més recent de tots els esportistes.",
      hasNotes: " · Té notes",
      moodStress: "Ànim {mood} · Estrès {stress}",
      filterTitle: "Filtrar per categoria",
      filterSubtitle: "Centra la vista clínica en un grup concret.",
      filterLabel: "Categoria",
      filterAll: "Totes les categories",
      noAthletesInCategory: "No hi ha esportistes en aquesta categoria.",
      initialAssessment: "Avaluació inicial",
      initialAssessmentSubtitle: "Respostes privades visibles només per a psicologia.",
      noInitialAssessment: "Aquest esportista encara no ha completat l'avaluació inicial.",
      assessmentMissing: "Avaluació pendent",
      guardianConsents: "Consentiments",
      pendingConsents: "{count} pendents",
      consentTitle: "Consentiment i edat",
      consentSubtitle: "Registre de majoria d'edat o autorització del tutor legal.",
      birthDate: "Data de naixement",
      consentStatus: "Estat",
      guardianName: "Tutor legal",
      guardianRelationship: "Relació",
      guardianContact: "Contacte",
      guardianSignature: "Signatura",
      consentSignedAt: "Signat el",
      consentVersion: "Versió del text",
      pendingAppointments: "Sol·licituds de consulta",
      pendingAppointmentsSubtitle: "Peticions pendents de cita de 30 minuts.",
      unreadMessages: "Missatges sense llegir",
      unreadMessagesSubtitle: "Missatges directes d'esportistes.",
      noPendingAppointments: "Sense sol·licituds pendents.",
      noUnreadMessages: "Sense missatges sense llegir.",
      appointmentNoMessage: "Sense nota addicional.",
      markAppointmentHandled: "Marcar com a gestionada",
      markMessageRead: "Marcar com a llegit",
      viewAthlete: "Veure esportista",
      unknownAthlete: "Esportista desconegut",
    },

    lang: {
      es: "Español",
      ca: "Català",
    },
  },
}

export function interpolate(text, vars = {}) {
  return Object.entries(vars).reduce(
    (str, [key, value]) => str.replaceAll(`{${key}}`, String(value)),
    text
  )
}
