export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
