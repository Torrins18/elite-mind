export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  className = "",
}) {
  const resolvedVariant = ["primary", "secondary", "ghost"].includes(variant) ? variant : "ghost"

  return (
    <button
      type={type}
      className={`btn btn--${resolvedVariant} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
