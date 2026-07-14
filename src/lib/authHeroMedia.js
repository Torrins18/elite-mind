/**
 * Auth hero media — single source of truth for the login landing hero.
 *
 * MVP: mode "image"
 * Future: set mode to "video" and add files under public/video/
 *
 * Future time-of-day: set enableSchedule to true in resolveAuthHeroMedia().
 */

const BASE_IMAGE = {
  src: "/images/auth-hero.jpg",
  position: "center 42%",
}

const BASE_VIDEO = {
  mp4: "/video/auth-hero.mp4",
  webm: "/video/auth-hero.webm",
  poster: BASE_IMAGE.src,
}

/** @typedef {'image' | 'video'} AuthHeroMediaMode */

/** @type {{ mode: AuthHeroMediaMode, image: typeof BASE_IMAGE, video: typeof BASE_VIDEO }} */
export const AUTH_HERO_DEFAULT = {
  mode: "image",
  image: BASE_IMAGE,
  video: BASE_VIDEO,
}

/**
 * Optional time-of-day presets (disabled until enableSchedule is true).
 * Swap image/video per slot when ready.
 */
export const AUTH_HERO_SCHEDULE = {
  morning: {
    mode: "image",
    image: { src: "/images/auth-hero-morning.jpg", position: "center 35%" },
    video: { ...BASE_VIDEO, mp4: "/video/auth-hero-morning.mp4", poster: "/images/auth-hero-morning.jpg" },
  },
  afternoon: {
    mode: "image",
    image: { src: "/images/auth-hero-afternoon.jpg", position: "center 30%" },
    video: { ...BASE_VIDEO, mp4: "/video/auth-hero-afternoon.mp4", poster: "/images/auth-hero-afternoon.jpg" },
  },
  evening: {
    mode: "image",
    image: { src: "/images/auth-hero-evening.jpg", position: "center 40%" },
    video: { ...BASE_VIDEO, mp4: "/video/auth-hero-evening.mp4", poster: "/images/auth-hero-evening.jpg" },
  },
  competition: {
    mode: "image",
    image: { src: "/images/auth-hero-competition.jpg", position: "center 25%" },
    video: { ...BASE_VIDEO, mp4: "/video/auth-hero-competition.mp4", poster: "/images/auth-hero-competition.jpg" },
  },
}

export function getAuthHeroTimeSlot(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 22) return "evening"
  return "competition"
}

function mergeHeroMedia(base, override) {
  if (!override) return { ...base, image: { ...base.image }, video: { ...base.video } }
  return {
    mode: override.mode ?? base.mode,
    image: { ...base.image, ...override.image },
    video: { ...base.video, ...override.video },
  }
}

/**
 * Resolve hero media for the current context.
 * @param {{ now?: Date, enableSchedule?: boolean, forceMode?: AuthHeroMediaMode }} [options]
 */
export function resolveAuthHeroMedia(options = {}) {
  const { now = new Date(), enableSchedule = false, forceMode } = options

  let media = mergeHeroMedia(AUTH_HERO_DEFAULT, null)

  if (enableSchedule) {
    const slot = getAuthHeroTimeSlot(now)
    media = mergeHeroMedia(media, AUTH_HERO_SCHEDULE[slot])
  }

  if (forceMode) {
    media = { ...media, mode: forceMode }
  }

  return media
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function canPlayHeroVideo() {
  if (typeof document === "undefined") return false
  const probe = document.createElement("video")
  return Boolean(
    probe.canPlayType('video/mp4; codecs="avc1.42E01E"') ||
      probe.canPlayType("video/webm; codecs=vp9") ||
      probe.canPlayType("video/webm")
  )
}
