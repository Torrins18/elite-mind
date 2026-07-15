/** @type {import('../../lib/entrenamentMental/types.js').MentalTrainingPhase[]} */
export const MENTAL_TRAINING_PHASES = [
  { id: "self_knowledge", weekStart: 1, weekEnd: 2 },
  { id: "goals", weekStart: 3, weekEnd: 4 },
  { id: "attention", weekStart: 5, weekEnd: 6 },
  { id: "error_management", weekStart: 7, weekEnd: 8 },
  { id: "confidence", weekStart: 9, weekEnd: 10 },
  { id: "communication", weekStart: 11, weekEnd: 12 },
  { id: "competitive_pressure", weekStart: 13, weekEnd: 14 },
  { id: "resilience", weekStart: 15, weekEnd: 16 },
  { id: "season_finale", weekStart: 17, weekEnd: 99 },
]

/** @type {import('../../lib/entrenamentMental/types.js').MentalTrainingWeek[]} */
export const DEFAULT_SEASON_PROGRAM = [
  {
    week: 1,
    phaseId: "self_knowledge",
    type: "reflection",
    es: {
      topic: "Valores",
      concept: "Piensa en un valor personal que quieres respetar esta semana, dentro y fuera del deporte.",
      action: "Escríbelo en una frase corta y recuérdalo antes del primer entrenamiento.",
    },
    ca: {
      topic: "Valors",
      concept: "Pensa en un valor personal que vulguis respectar aquesta setmana, dins i fora de l'esport.",
      action: "Escriu-lo en una frase curta i recorda'l abans del primer entrenament.",
    },
  },
  {
    week: 2,
    phaseId: "self_knowledge",
    type: "reflection",
    es: {
      topic: "Fortalezas personales",
      concept: "Identifica una fortaleza tuya como deportista que ya te ha ayudado en momentos difíciles.",
      action: "Esta semana, úsala de forma consciente al menos una vez por sesión.",
    },
    ca: {
      topic: "Fortaleses personals",
      concept: "Identifica una fortalesa teva com a esportista que ja t'ha ajudat en moments difícils.",
      action: "Aquesta setmana, utilitza-la de forma conscient almenys una vegada per sessió.",
    },
  },
  {
    week: 3,
    phaseId: "goals",
    type: "mini_challenge",
    es: {
      topic: "Objetivos SMART",
      concept: "Elige un objetivo de proceso para esta semana: específico, medible y bajo tu control.",
      action: "Ejemplo: «Completar cada calentamiento con la misma rutina».",
    },
    ca: {
      topic: "Objectius SMART",
      concept: "Tria un objectiu de procés per a aquesta setmana: específic, mesurable i sota el teu control.",
      action: "Exemple: «Completar cada escalfament amb la mateixa rutina».",
    },
  },
  {
    week: 4,
    phaseId: "goals",
    type: "attention_exercise",
    es: {
      topic: "Enfoque diario",
      concept: "Cada día de entrenamiento, elige una sola acción técnica como prioridad.",
      action: "Antes de empezar, dilo en voz baja o escríbelo. Solo una.",
    },
    ca: {
      topic: "Focus diari",
      concept: "Cada dia d'entrenament, tria una sola acció tècnica com a prioritat.",
      action: "Abans de començar, digues-ho en veu baixa o escriu-ho. Només una.",
    },
  },
  {
    week: 5,
    phaseId: "attention",
    type: "attention_exercise",
    es: {
      topic: "Momento presente",
      concept: "Cuando notes que tu mente va al pasado o al futuro, vuelve a lo que puedes hacer ahora.",
      action: "Pregúntate: «¿Qué necesito hacer en los próximos diez segundos?»",
    },
    ca: {
      topic: "Moment present",
      concept: "Quan notis que la teva ment va al passat o al futur, torna al que pots fer ara.",
      action: "Pregunta't: «Què necessito fer en els propers deu segons?»",
    },
  },
  {
    week: 6,
    phaseId: "attention",
    type: "mental_routine",
    es: {
      topic: "Rutina de reset",
      concept: "Crea una señal breve para reiniciar la atención: un gesto, una palabra o tres respiraciones.",
      action: "Úsala una vez cuando pierdas el foco durante el entrenamiento.",
    },
    ca: {
      topic: "Rutina de reset",
      concept: "Crea un senyal breu per reiniciar l'atenció: un gest, una paraula o tres respiracions.",
      action: "Utilitza-la un cop quan perdis el focus durant l'entrenament.",
    },
  },
  {
    week: 7,
    phaseId: "error_management",
    type: "confidence_exercise",
    es: {
      topic: "Gestión del error",
      concept: "Cuando cometas un error durante el entrenamiento, evita valorarte como deportista.",
      action: "Solo responde: «¿Cuál es la mejor acción que puedo hacer ahora mismo?»",
    },
    ca: {
      topic: "Gestió de l'error",
      concept: "Quan cometis un error durant l'entrenament, evita valorar-te com a esportista.",
      action: "Només respon aquesta pregunta: «Quina és la millor acció que puc fer ara mateix?»",
    },
  },
  {
    week: 8,
    phaseId: "error_management",
    type: "reflection",
    es: {
      topic: "Diálogo interno",
      concept: "Tras un error, sustituye juicios sobre ti («soy malo/a») por instrucciones sobre la acción.",
      action: "Prueba: «Siguiente acción: …» en lugar de «Otra vez igual».",
    },
    ca: {
      topic: "Diàleg intern",
      concept: "Després d'un error, substitueix judicis sobre tu («soc dolent/a») per instruccions sobre l'acció.",
      action: "Prova: «Següent acció: …» en lloc d'«Un cop més igual».",
    },
  },
  {
    week: 9,
    phaseId: "confidence",
    type: "confidence_exercise",
    es: {
      topic: "Confianza basada en evidencia",
      concept: "Recuerda un entrenamiento reciente donde ejecutaste bien una habilidad concreta.",
      action: "Antes de competir o entrenar fuerte, evoca ese momento durante quince segundos.",
    },
    ca: {
      topic: "Confiança basada en evidència",
      concept: "Recorda un entrenament recent on vas executar bé una habilitat concreta.",
      action: "Abans de competir o entrenar fort, evoca aquell moment durant quinze segons.",
    },
  },
  {
    week: 10,
    phaseId: "confidence",
    type: "mental_routine",
    es: {
      topic: "Preparación y confianza",
      concept: "La confianza crece con la preparación repetida, no con frases vacías.",
      action: "Esta semana, completa tu rutina de preparación aunque no tengas ganas.",
    },
    ca: {
      topic: "Preparació i confiança",
      concept: "La confiança creix amb la preparació repetida, no amb frases buides.",
      action: "Aquesta setmana, completa la teva rutina de preparació encara que no tinguis ganes.",
    },
  },
  {
    week: 11,
    phaseId: "communication",
    type: "communication_challenge",
    es: {
      topic: "Escucha activa",
      concept: "En un entrenamiento, practica escuchar a un compañero/a sin interrumpir ni dar consejos de inmediato.",
      action: "Resume lo que entendiste antes de responder.",
    },
    ca: {
      topic: "Escolta activa",
      concept: "En un entrenament, practica escoltar un company/a sense interrompre ni donar consells de seguida.",
      action: "Resumeix el que has entès abans de respondre.",
    },
  },
  {
    week: 12,
    phaseId: "communication",
    type: "communication_challenge",
    es: {
      topic: "Comunicación con el/la entrenador/a",
      concept: "Pide una aclaración concreta si algo no te queda claro. Preguntar no es debilidad.",
      action: "Formula una pregunta específica esta semana, no genérica.",
    },
    ca: {
      topic: "Comunicació amb l'entrenador/a",
      concept: "Demana una aclaració concreta si alguna cosa no et queda clara. Preguntar no és debilitat.",
      action: "Formula una pregunta específica aquesta setmana, no genèrica.",
    },
  },
  {
    week: 13,
    phaseId: "competitive_pressure",
    type: "mental_routine",
    es: {
      topic: "Rutina pre-competición",
      concept: "Define tres pasos fijos antes de competir (ej.: respiración, enfoque, activación).",
      action: "Repítelos igual esta semana, aunque cambie el rival o el escenario.",
    },
    ca: {
      topic: "Rutina pre-competició",
      concept: "Defineix tres passos fixos abans de competir (p. ex.: respiració, focus, activació).",
      action: "Repeteix-los igual aquesta setmana, encara que canviï el rival o l'escenari.",
    },
  },
  {
    week: 14,
    phaseId: "competitive_pressure",
    type: "breathing",
    es: {
      topic: "Presión y respiración",
      concept: "Los nervios son normales. Una respiración lenta activa tu capacidad de regular la atención.",
      action: "Antes de competir: inhala cuatro segundos, exhala seis. Tres veces.",
    },
    ca: {
      topic: "Pressió i respiració",
      concept: "Els nervis són normals. Una respiració lenta activa la teva capacitat de regular l'atenció.",
      action: "Abans de competir: inhala quatre segons, exhala sis. Tres vegades.",
    },
  },
  {
    week: 15,
    phaseId: "resilience",
    type: "reflection",
    es: {
      topic: "Adversidad",
      concept: "Un mal resultado o un día difícil describe un momento, no toda la temporada.",
      action: "Identifica una acción pequeña que sí puedes controlar mañana.",
    },
    ca: {
      topic: "Adversitat",
      concept: "Un mal resultat o un dia difícil descriu un moment, no tota la temporada.",
      action: "Identifica una acció petita que sí puguis controlar demà.",
    },
  },
  {
    week: 16,
    phaseId: "resilience",
    type: "mini_challenge",
    es: {
      topic: "Persistencia",
      concept: "Volver a entrenar tras una lesión o una derrota requiere paciencia, no perfección.",
      action: "Celebra completar el proceso, no solo el resultado del día.",
    },
    ca: {
      topic: "Persistència",
      concept: "Tornar a entrenar després d'una lesió o una derrota requereix paciència, no perfecció.",
      action: "Celebra completar el procés, no només el resultat del dia.",
    },
  },
  {
    week: 17,
    phaseId: "season_finale",
    type: "reflection",
    es: {
      topic: "Disfrute",
      concept: "Recordar por qué empezaste ayuda a sostener el esfuerzo en la recta final.",
      action: "Esta semana, nota un momento del entrenamiento que hayas disfrutado, aunque sea breve.",
    },
    ca: {
      topic: "Gaudi",
      concept: "Recordar per què vas començar ajuda a sostenir l'esforç a la recta final.",
      action: "Aquesta setmana, nota un moment de l'entrenament que hagis gaudit, encara que sigui breu.",
    },
  },
  {
    week: 18,
    phaseId: "season_finale",
    type: "reflection",
    es: {
      topic: "Reflexión",
      concept: "¿Qué has aprendido sobre ti mismo/a como deportista esta temporada?",
      action: "Escoge una lección concreta, no una frase general.",
    },
    ca: {
      topic: "Reflexió",
      concept: "Què has après sobre tu mateix/a com a esportista aquesta temporada?",
      action: "Tria una lliçó concreta, no una frase general.",
    },
  },
  {
    week: 19,
    phaseId: "season_finale",
    type: "mini_challenge",
    es: {
      topic: "Aprendizaje",
      concept: "Cada semana deja una pista sobre qué funciona para ti bajo presión.",
      action: "Anota una cosa que quieras repetir la próxima temporada.",
    },
    ca: {
      topic: "Aprenentatge",
      concept: "Cada setmana deixa una pista sobre què funciona per a tu sota pressió.",
      action: "Anota una cosa que vulguis repetir la propera temporada.",
    },
  },
  {
    week: 20,
    phaseId: "season_finale",
    type: "reflection",
    es: {
      topic: "Compromiso y valores de equipo",
      concept: "Tu actitud en el grupo influye en el entorno, incluso cuando no lideras el marcador.",
      action: "Esta semana, modela un valor de equipo con una acción concreta.",
    },
    ca: {
      topic: "Compromís i valors d'equip",
      concept: "La teva actitud al grup influeix en l'entorn, fins i tot quan no lideres el marcador.",
      action: "Aquesta setmana, modela un valor d'equip amb una acció concreta.",
    },
  },
]
