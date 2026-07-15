const VARIANTS = ["text", "title", "button", "card", "circle"]

export function Skeleton({ variant = "text", className = "", style, width, height }) {
  const variantClass = VARIANTS.includes(variant) ? `skeleton--${variant}` : ""
  const inlineStyle = {
    ...(width != null ? { width: typeof width === "number" ? `${width}px` : width } : null),
    ...(height != null ? { height: typeof height === "number" ? `${height}px` : height } : null),
    ...style,
  }

  return (
    <div
      className={`skeleton ${variantClass} ${className}`.trim()}
      style={Object.keys(inlineStyle).length ? inlineStyle : undefined}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`page-skeleton__text-block ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? "72%" : "100%"}
          style={{ marginBottom: index < lines - 1 ? 10 : 0 }}
        />
      ))}
    </div>
  )
}
