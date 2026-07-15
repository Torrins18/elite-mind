/**
 * Built-in Espai Mental content library.
 * Psychologist-uploaded items will merge via contentProvider (future).
 *
 * tags.sports: general | football | basketball | volleyball | individual
 * tags.contexts: general | competition | recovery | injury_return | finals | playoffs
 */

/** @type {import('../lib/espaiMental/types.js').EspaiMentalItem[]} */
export const ESPAI_MENTAL_LIBRARY = [
  {
    id: "reflection-control-001",
    type: "reflection",
    es: { body: "¿Qué depende realmente de ti esta semana?" },
    ca: { body: "Què depèn realment de tu aquesta setmana?" },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "reflection-process-001",
    type: "reflection",
    es: { body: "Esta semana, ¿qué aspecto de tu preparación puedes mejorar aunque sea un poco?" },
    ca: { body: "Aquesta setmana, quin aspecte de la teva preparació pots millorar encara que sigui una mica?" },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "reflection-attention-001",
    type: "reflection",
    es: { body: "¿En qué momentos pierdes la concentración durante el entrenamiento?" },
    ca: { body: "En quins moments perds la concentració durant l'entrenament?" },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "focus-single-action-001",
    type: "focus",
    es: { body: "Antes de empezar el entrenamiento, decide una única acción que quieres hacer especialmente bien." },
    ca: { body: "Abans de començar l'entrenament, decideix una única acció que vols fer especialment bé." },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "focus-first-drill-001",
    type: "focus",
    es: { body: "Elige una sola cosa para vigilar en el primer ejercicio del entrenamiento. Solo una." },
    ca: { body: "Tria una sola cosa per vigilar en el primer exercici de l'entrenament. Només una." },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "focus-competition-001",
    type: "focus",
    es: { body: "Antes de competir, escribe mentalmente tu prioridad técnica para los primeros cinco minutos." },
    ca: { body: "Abans de competir, escriu mentalment la teva prioritat tècnica pels primers cinc minuts." },
    tags: { sports: ["general"], contexts: ["competition", "finals", "playoffs"] },
    source: "system",
  },
  {
    id: "breathing-pre-comp-001",
    type: "breathing",
    es: { body: "Antes de competir, prueba tres respiraciones lentas y profundas para reducir la tensión." },
    ca: { body: "Abans de competir, prova tres respiracions lentes i profundes per reduir la tensió." },
    tags: { sports: ["general"], contexts: ["competition", "finals", "playoffs"] },
    source: "system",
  },
  {
    id: "breathing-reset-001",
    type: "breathing",
    es: { body: "Tras un error, haz una exhalación larga antes de volver a la acción." },
    ca: { body: "Després d'un error, fes una exhalació llarga abans de tornar a l'acció." },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "breathing-recovery-001",
    type: "breathing",
    es: { body: "En un momento de pausa, inhala cuatro segundos y exhala seis. Repite dos veces." },
    ca: { body: "En un moment de pausa, inhala quatre segons i exhala sis. Repeteix dues vegades." },
    tags: { sports: ["general"], contexts: ["recovery"] },
    source: "system",
  },
  {
    id: "mental-skill-error-001",
    type: "mental_skill",
    es: {
      title: "Gestión del error",
      body: "Cuando cometas un error, evita valorarte como deportista. Céntrate solo en la siguiente acción.",
    },
    ca: {
      title: "Gestió de l'error",
      body: "Quan cometis un error, evita valorar-te com a esportista. Centra't només en la següent acció.",
    },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "mental-skill-self-talk-001",
    type: "mental_skill",
    es: {
      title: "Diálogo interno",
      body: "Sustituye «no puedo» por «todavía no lo he conseguido». Cambia la evaluación por la acción.",
    },
    ca: {
      title: "Diàleg intern",
      body: "Substitueix «no puc» per «encara no ho he aconseguit». Canvia l'avaluació per l'acció.",
    },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "mental-skill-pressure-001",
    type: "mental_skill",
    es: {
      title: "Presión útil",
      body: "La presión indica que algo te importa. Úsala para enfocar tu atención, no para juzgarte.",
    },
    ca: {
      title: "Pressió útil",
      body: "La pressió indica que alguna cosa t'importa. Utilitza-la per enfocar la teva atenció, no per jutjar-te.",
    },
    tags: { sports: ["general"], contexts: ["competition", "finals"] },
    source: "system",
  },
  {
    id: "quote-control-001",
    type: "quote",
    es: {
      title: "Recordatorio",
      body: "No puedes controlar el resultado. Sí que puedes controlar tu actitud.",
    },
    ca: {
      title: "Recordatori",
      body: "No pots controlar el resultat. Sí que pots controlar la teva actitud.",
    },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "quote-preparation-001",
    type: "quote",
    es: {
      title: "Recordatorio",
      body: "La confianza viene de lo que haces de forma repetida, no de lo que te dices el día del partido.",
    },
    ca: {
      title: "Recordatori",
      body: "La confiança ve del que fas de forma repetida, no del que et dius el dia del partit.",
    },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "quote-comparison-001",
    type: "quote",
    es: {
      title: "Recordatorio",
      body: "Compararte con otros consume energía que podrías usar en tu propio proceso.",
    },
    ca: {
      title: "Recordatori",
      body: "Comparar-te amb altres consumeix energia que podries usar en el teu propi procés.",
    },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "mini-challenge-routine-001",
    type: "mini_challenge",
    es: { body: "Esta semana, repite la misma rutina de calentamiento mental antes de un entrenamiento." },
    ca: { body: "Aquesta setmana, repeteix la mateixa rutina d'escalfament mental abans d'un entrenament." },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "mini-challenge-journal-001",
    type: "mini_challenge",
    es: { body: "Tras entrenar, anota una cosa que hiciste bien y una que quieres repetir la próxima vez." },
    ca: { body: "Després d'entrenar, anota una cosa que vas fer bé i una que vols repetir la propera vegada." },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "mini-challenge-recovery-001",
    type: "mini_challenge",
    es: { body: "En un día de descanso, dedica cinco minutos a planificar la intención del próximo entrenamiento." },
    ca: { body: "En un dia de descans, dedica cinc minuts a planificar la intenció del proper entrenament." },
    tags: { sports: ["general"], contexts: ["recovery"] },
    source: "system",
  },
  {
    id: "visualization-match-start-001",
    type: "visualization",
    es: { body: "Dedica un minuto a imaginar cómo quieres afrontar el primer minuto del partido." },
    ca: { body: "Dedica un minut a imaginar com vols afrontar el primer minut del partit." },
    tags: { sports: ["general"], contexts: ["competition", "finals"] },
    source: "system",
  },
  {
    id: "visualization-skill-001",
    type: "visualization",
    es: { body: "Cierra los ojos diez segundos y visualiza una acción técnica que dominas bien." },
    ca: { body: "Tanca els ulls deu segons i visualitza una acció tècnica que domines bé." },
    tags: { sports: ["general"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "visualization-return-001",
    type: "visualization",
    es: {
      body: "Imagina tu vuelta progresiva: primero el entrenamiento, luego la confianza, sin apresurar el resultado.",
    },
    ca: {
      body: "Imagina la teva tornada progressiva: primer l'entrenament, després la confiança, sense apressar el resultat.",
    },
    tags: { sports: ["general"], contexts: ["injury_return"] },
    source: "system",
  },
  {
    id: "focus-football-001",
    type: "focus",
    es: { body: "En el próximo entrenamiento, elige una sola función táctica y mantén la atención en ella." },
    ca: { body: "En el proper entrenament, tria una sola funció tàctica i mantén l'atenció en ella." },
    tags: { sports: ["football"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "mental-skill-basketball-001",
    type: "mental_skill",
    es: {
      title: "Ritmo tras el error",
      body: "Tras un tiro fallado, vuelve a tu rutina habitual antes del siguiente intento.",
    },
    ca: {
      title: "Ritme després de l'error",
      body: "Després d'un tir fallat, torna a la teva rutina habitual abans del següent intent.",
    },
    tags: { sports: ["basketball"], contexts: ["general"] },
    source: "system",
  },
  {
    id: "breathing-volleyball-001",
    type: "breathing",
    es: { body: "Entre puntos, una exhalación lenta ayuda a bajar el ritmo antes del siguiente saque." },
    ca: { body: "Entre punts, una exhalació lenta ajuda a baixar el ritme abans del següent servei." },
    tags: { sports: ["volleyball"], contexts: ["competition"] },
    source: "system",
  },
]
