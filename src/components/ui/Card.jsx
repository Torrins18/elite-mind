export function Card({ title, subtitle, action, children, className = "", interactive = false }) {
  return (
    <section className={`card${interactive ? " card--interactive" : ""} ${className}`.trim()}>
      {(title || action) && (
        <header className="card__header">
          <div>
            {title && <h2 className="card__title">{title}</h2>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  )
}
