import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { LanguageProvider } from "./i18n/LanguageContext"
import { ToastProvider } from "./context/ToastContext"
import { ErrorBoundary } from "./components/ErrorBoundary"
import "./index.css"
import "./styles/premium-ui.css"
import "./styles/design-system.css"
import "./styles/auth-landing.css"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
)
