import { useId } from "react"

/** Zona Mental+ emblem — brain + athlete, clinical palette */
export function LogoMark({ size = 48, className = "", title = "Zona Mental+" }) {
  const uid = useId().replace(/:/g, "")
  const leftClip = `zm-left-${uid}`
  const rightClip = `zm-right-${uid}`

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
        stroke="#2563EB"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M 50 6 A 44 44 0 0 1 50 94"
        stroke="#16A34A"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      <g clipPath={`url(#${leftClip})`} stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 34 30 C 26 28 22 36 24 44 C 20 50 22 58 28 60 C 26 66 30 72 36 68 C 34 74 40 78 46 72" />
        <path d="M 28 42 C 32 40 36 44 34 50" />
        <path d="M 30 54 C 34 52 38 56 36 62" />
        <path d="M 38 34 C 42 32 44 38 42 44" />
      </g>

      <g clipPath={`url(#${rightClip})`} stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="68" cy="30" r="4.5" fill="#16A34A" stroke="none" />
        <path d="M 68 35 L 62 50 L 56 72" />
        <path d="M 64 44 L 74 38" />
        <path d="M 62 50 L 72 58" />
        <path d="M 56 72 L 50 78" />
        <path d="M 56 72 L 64 76" />
      </g>
    </svg>
  )
}
