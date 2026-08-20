import './App.css'
import { useBackendHealth } from './hooks/useBackendHealth.js'
import { API_BASE_URL } from './services/api.js'

const STATUS_TEXT = {
  loading: 'Testando conexão...',
  success: 'Backend conectado com sucesso.',
  error: 'Não foi possível conectar ao backend.',
}

function App() {
  const { status, health, error, retry } = useBackendHealth()

  return (
    <main className="page">
      <section className="test-card">
        <h1>Flow CRM</h1>
        <p className="subtitle">Tela inicial de teste</p>

        <div className={`status status--${status}`} role="status">
          <span className="status-dot" aria-hidden="true" />
          {STATUS_TEXT[status]}
        </div>

        {status === 'success' && health && (
          <div className="result">
            <p>
              <strong>Serviço:</strong> {health.service}
            </p>
            <p>
              <strong>Módulos:</strong> {health.modules.length}
            </p>
          </div>
        )}

        {status === 'error' && <p className="error-message">{error}</p>}

        <p className="api-url">
          <strong>API:</strong> <code>{API_BASE_URL}</code>
        </p>

        <button type="button" onClick={retry} disabled={status === 'loading'}>
          Testar conexão
        </button>
      </section>
    </main>
  )
}

export default App
