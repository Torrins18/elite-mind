import { Icon } from "./Icon"

export function EmptyState({ icon = "inbox", title, description, action, className = "" }) {
  return (
    <div className={`empty-state-block ${className}`.trim()} role="status">
      {icon ? (
        <span className="empty-state-block__icon" aria-hidden="true">
          <Icon name={icon} size={20} strokeWidth={1.75} />
        </span>
      ) : null}
      {title ? <p className="empty-state-block__title">{title}</p> : null}
      {description ? <p className="empty-state-block__body">{description}</p> : null}
      {action ? <div className="empty-state-block__action">{action}</div> : null}
    </div>
  )
}
