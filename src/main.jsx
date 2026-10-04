import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const API_BASE = 'https://s.glbimg.com/jo/el/2026/apuracao/1-turno/ba'
const ELECTIONS = [
  { id: 'senador', title: 'Senado Federal', shortTitle: 'Senador', description: '2 vagas em disputa', icon: '◉' },
  { id: 'deputado-federal', title: 'Câmara dos Deputados', shortTitle: 'Deputado Federal', description: '39 cadeiras em disputa', icon: '▦' },
  { id: 'deputado-estadual', title: 'Assembleia Legislativa', shortTitle: 'Deputado Estadual', description: '63 cadeiras em disputa', icon: '▤' },
]

const number = new Intl.NumberFormat('pt-BR')
const percent = (value) => Number(String(value ?? 0).replace(',', '.'))

function formatDate(value) {
  if (!value) return 'Aguardando atualização'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Aguardando atualização'
    : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function App() {
  const [results, setResults] = React.useState({})
  const [activeId, setActiveId] = React.useState('senador')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [updatedAt, setUpdatedAt] = React.useState(null)

  const loadResults = React.useCallback(async () => {
    try {
      setError('')
      const responses = await Promise.all(
        ELECTIONS.map(async (election) => {
          const response = await fetch(`${API_BASE}/${election.id}.json`, { cache: 'no-store' })
          if (!response.ok) throw new Error(`Não foi possível atualizar ${election.shortTitle}.`)
          return [election.id, await response.json()]
        }),
      )
      setResults(Object.fromEntries(responses))
      setUpdatedAt(new Date())
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível consultar a apuração agora.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadResults()
    const interval = window.setInterval(loadResults, 30_000)
    return () => window.clearInterval(interval)
  }, [loadResults])

  const activeElection = ELECTIONS.find((item) => item.id === activeId)
  const data = results[activeId]
  const scope = data?.abrangencia
  const candidates = [...(data?.candidatos ?? [])]
    .filter((candidate) => candidate.destinacaoDosVotos === 'Válido')
    .sort((a, b) => a.posicao - b.posicao)
  const displayedCandidates = candidates.slice(0, 50)

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="brand" aria-label="Eleições 2026 Bahia">
            <span className="brand-mark">e</span>
            <span>eleições <strong>2026</strong></span>
          </div>
          <div className="live-pill"><span className="pulse" /> APURAÇÃO AO VIVO</div>
          <h1>Bahia decide seu futuro.</h1>
          <p>Acompanhe os resultados oficiais das eleições legislativas em tempo real.</p>
          <div className="hero-meta">
            <span>BAHIA</span><i />
            <span>{scope ? `${number.format(scope.eleitores)} eleitores` : 'Dados oficiais'}</span>
          </div>
        </div>
      </section>

      <section className="content" aria-live="polite">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RESULTADOS OFICIAIS</p>
            <h2>Apuração em andamento</h2>
          </div>
          <button className="refresh" onClick={loadResults} disabled={loading}>
            <span className={loading ? 'spin' : ''}>↻</span> {loading ? 'Atualizando' : 'Atualizar agora'}
          </button>
        </div>

        {error && <div className="notice error">{error} <button onClick={loadResults}>Tentar novamente</button></div>}

        <div className="election-tabs" role="tablist" aria-label="Cargos em apuração">
          {ELECTIONS.map((election) => {
            const electionData = results[election.id]
            const progress = electionData?.abrangencia?.andamento ?? '0,00'
            return (
              <button key={election.id} role="tab" aria-selected={activeId === election.id}
                className={`election-tab ${activeId === election.id ? 'active' : ''}`} onClick={() => setActiveId(election.id)}>
                <span className="tab-icon">{election.icon}</span>
                <span><strong>{election.shortTitle}</strong><small>{progress}% apurado</small></span>
              </button>
            )
          })}
        </div>

        <article className="results-card">
          <header className="card-header">
            <div>
              <p className="eyebrow">{activeElection?.description}</p>
              <h3>{activeElection?.title}</h3>
            </div>
            <div className="progress-stat"><strong>{scope?.andamento ?? '0,00'}%</strong><span>apurado</span></div>
          </header>
          <div className="progress-track"><div className="progress-bar" style={{ width: `${percent(scope?.andamento)}%` }} /></div>
          <div className="count-grid">
            <div><span>Seções totalizadas</span><strong>{scope ? `${number.format(scope.secoesTotalizadas)} de ${number.format(scope.secoes)}` : '—'}</strong></div>
            <div><span>Votos válidos</span><strong>{scope ? number.format(scope.votos.validos.quantidade) : '—'}</strong></div>
            <div><span>Comparecimento</span><strong>{scope ? `${scope.votos.comparecimento ?? 0}%` : '—'}</strong></div>
          </div>

          <div className="candidate-header"><span>Candidatos {candidates.length > 50 ? '(top 50)' : ''}</span><span>Votos</span></div>
          {loading && !data ? <div className="loading-state">Consultando a fonte oficial…</div> : displayedCandidates.map((candidate, index) => (
            <div className="candidate" key={`${candidate.numero}-${candidate.nome}`}>
              <span className="rank">{index + 1}</span>
              <div className="candidate-name"><strong>{candidate.nome}</strong><span>{candidate.partido} · {candidate.numero}</span></div>
              <div className="candidate-votes"><strong>{candidate.votos.porcentagem}%</strong><span>{number.format(candidate.votos.quantidade)} votos</span></div>
            </div>
          ))}
          {!loading && !candidates.length && <div className="loading-state">Nenhum candidato disponível no momento.</div>}
          {candidates.length > 50 && <p className="candidate-limit">Exibindo os 50 primeiros de {number.format(candidates.length)} candidatos.</p>}
        </article>

        <footer>
          <span><i className="status-dot" /> Dados atualizados automaticamente a cada 30 segundos</span>
          <span>Última consulta: {updatedAt ? formatDate(updatedAt) : '—'}</span>
          <small>Fonte: dados públicos de apuração eleitoral.</small>
        </footer>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
