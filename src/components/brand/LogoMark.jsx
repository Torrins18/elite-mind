import { useId } from "react"

export const BRAND = {
  red: "#E31E24",
  grey: "#3A3A3A",
  muted: "#707070",
}

const PALETTES = {
  light: {
    leftArc: BRAND.grey,
    rightArc: BRAND.red,
    brain: BRAND.grey,
    athlete: BRAND.red,
    strokeWidth: 2.8,
  },
  dark: {
    leftArc: "rgba(255,255,255,0.9)",
    rightArc: BRAND.red,
    brain: "rgba(255,255,255,0.9)",
    athlete: BRAND.red,
    strokeWidth: 2.8,
  },
}

/** Zona Mental+ emblem — brain + athlete */
export function LogoMark({ size = 48, className = "", title = "Zona Mental+", surface = "light" }) {
  const uid = useId().replace(/:/g, "")
  const leftClip = `zm-left-${uid}`
  const rightClip = `zm-right-${uid}`
  const colors = PALETTES[surface] || PALETTES.light
  const strokeW = colors.strokeWidth

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <clipPath id={leftClip}>
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>
        <clipPath id={rightClip}>
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
      </defs>

      <path
        d="M 50 6 A 44 44 0 0 0 50 94"
        stroke={colors.leftArc}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      <path
        d="M 50 6 A 44 44 0 0 1 50 94"
        stroke={colors.rightArc}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      <g
        clipPath={`url(#${leftClip})`}
        stroke={colors.brain}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M 34 30 C 26 28 22 36 24 44 C 20 50 22 58 28 60 C 26 66 30 72 36 68 C 34 74 40 78 46 72" />
        <path d="M 28 42 C 32 40 36 44 34 50" />
        <path d="M 30 54 C 34 52 38 56 36 62" />
        <path d="M 38 34 C 42 32 44 38 42 44" />
      </g>

      <g clipPath={`url(#${rightClip})`} fill={colors.athlete} stroke="none">
        <circle cx="68" cy="28" r="5.5" />
        <path d="M 66 34 L 60 48 L 54 70 L 48 78 L 54 80 L 62 72 L 66 58 L 72 62 L 78 56 L 70 50 L 68 42 Z" />
        <path d="M 64 42 L 76 36 L 78 40 L 68 46 Z" />
      </g>
    </svg>
  )
}
