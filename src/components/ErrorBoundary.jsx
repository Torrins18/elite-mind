import { Component } from "react"

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="auth-page">
          <div className="card setup-hint" style={{ maxWidth: 520 }}>
            <h2>Error a l&apos;aplicació</h2>
            <p className="form-error">{this.state.error.message}</p>
            <p className="empty-state">
              Prova de recarregar la pàgina. Si persisteix, executa els fitxers SQL de la
              carpeta <code>supabase/</code> (vegeu SETUP.md).
            </p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => window.location.reload()}
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
