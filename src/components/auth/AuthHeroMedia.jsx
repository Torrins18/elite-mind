import { useEffect, useMemo, useRef, useState } from "react"
import {
  canPlayHeroVideo,
  prefersReducedMotion,
  resolveAuthHeroMedia,
} from "../../lib/authHeroMedia"

/**
 * Premium hero background — image (MVP) or looping cinematic video (future).
 * Falls back to poster/image when video is unavailable or fails.
 */
export function AuthHeroMedia({ enableSchedule = false }) {
  const media = useMemo(() => resolveAuthHeroMedia({ enableSchedule }), [enableSchedule])
  const reducedMotion = useMemo(() => prefersReducedMotion(), [])

  const wantsVideo = media.mode === "video" && !reducedMotion
  const [activeMode, setActiveMode] = useState(wantsVideo ? "video" : "image")
  const [videoVisible, setVideoVisible] = useState(false)

  const videoRef = useRef(null)

  useEffect(() => {
    if (!wantsVideo) {
      setActiveMode("image")
      return
    }

    if (!canPlayHeroVideo()) {
      setActiveMode("image")
      return
    }

    const video = videoRef.current
    if (!video) return

    let cancelled = false

    const showImageFallback = () => {
      if (!cancelled) {
        setActiveMode("image")
        setVideoVisible(false)
      }
    }

    const onReady = async () => {
      if (cancelled) return
      try {
        await video.play()
        if (!cancelled) setVideoVisible(true)
      } catch {
        showImageFallback()
      }
    }

    const onError = () => showImageFallback()

    video.addEventListener("canplay", onReady, { once: true })
    video.addEventListener("error", onError, { once: true })

    if (video.readyState >= 3) {
      onReady()
    }

    return () => {
      cancelled = true
      video.removeEventListener("canplay", onReady)
      video.removeEventListener("error", onError)
    }
  }, [wantsVideo, media.video.mp4, media.video.webm])

  const imageStyle = { objectPosition: media.image.position }
  const showVideo = activeMode === "video"
  const posterSrc = media.video.poster || media.image.src

  return (
    <div className="auth-landing__media-wrap" aria-hidden>
      <div
        className={`auth-landing__media-layer${reducedMotion ? " auth-landing__media-layer--static" : ""}`}
      >
        {showVideo && (
          <video
            ref={videoRef}
            className={`auth-landing__video${videoVisible ? " auth-landing__video--ready" : ""}`}
            poster={posterSrc}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            tabIndex={-1}
          >
            {media.video.webm && <source src={media.video.webm} type="video/webm" />}
            {media.video.mp4 && <source src={media.video.mp4} type="video/mp4" />}
          </video>
        )}

        <img
          className={`auth-landing__image${showVideo && videoVisible ? " auth-landing__image--hidden" : ""}${showVideo && !videoVisible ? " auth-landing__image--poster" : ""}`}
          src={showVideo && !videoVisible ? posterSrc : media.image.src}
          alt=""
          decoding="async"
          fetchPriority="high"
          loading="eager"
          style={imageStyle}
        />
      </div>
    </div>
  )
}
