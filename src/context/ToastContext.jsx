import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { Icon } from "../components/ui/Icon"

const ToastContext = createContext(null)

const ICON_BY_TONE = {
  success: "check",
  error: "alert",
  neutral: "clipboard",
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((row) => row.id !== id))
  }, [])

  const showToast = useCallback(
    (message, tone = "success", duration = 2600) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current.slice(-2), { id, message, tone }])
      window.setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
            <Icon name={ICON_BY_TONE[toast.tone] || "check"} size={16} className="toast__icon" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
