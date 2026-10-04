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
const FAVORITES_KEY = 'eleicoes-ba-2026:favorites'

function candidateKey(electionId, candidate) {
  return `${electionId}:${candidate.numero}:${candidate.nome}`
}

function loadFavorites() {
  try {
    return JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || '[]')
  } catch {
    return []
  }
}

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
  const [search, setSearch] = React.useState('')
  const [favoriteKeys, setFavoriteKeys] = React.useState(loadFavorites)
  const [alerts, setAlerts] = React.useState([])
  const [notificationPermission, setNotificationPermission] = React.useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )
  const previousVotes = React.useRef(new Map())

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

  React.useEffect(() => {
    if (!Object.keys(results).length) return
    const currentVotes = new Map()
    const detectedAlerts = []

    Object.entries(results).forEach(([electionId, electionData]) => {
      electionData.candidatos?.forEach((candidate) => {
        const key = candidateKey(electionId, candidate)
        const votes = Number(candidate.votos?.quantidade || 0)
        const previous = previousVotes.current.get(key)
        currentVotes.set(key, votes)
        if (previous !== undefined && previous !== votes && favoriteKeys.includes(key)) {
          const election = ELECTIONS.find((item) => item.id === electionId)
          detectedAlerts.push({
            id: `${key}:${votes}`,
            text: `${candidate.nome} recebeu ${number.format(votes - previous)} novo(s) voto(s) em ${election.shortTitle}.`,
          })
        }
      })
    })

    previousVotes.current = currentVotes
    if (detectedAlerts.length) {
      setAlerts((current) => [...detectedAlerts, ...current].slice(0, 5))
      if (notificationPermission === 'granted') {
        detectedAlerts.forEach((alert) => new Notification('Eleições 2026 · Bahia', { body: alert.text }))
      }
    }
  }, [results, favoriteKeys, notificationPermission])

  const activeElection = ELECTIONS.find((item) => item.id === activeId)
  const data = results[activeId]
  const scope = data?.abrangencia
  const candidates = [...(data?.candidatos ?? [])]
    .filter((candidate) => candidate.destinacaoDosVotos === 'Válido')
    .sort((a, b) => a.posicao - b.posicao)
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const filteredCandidates = normalizedSearch
    ? candidates.filter((candidate) => [candidate.nome, candidate.partido, candidate.numero]
      .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(normalizedSearch)))
    : candidates
  const displayedCandidates = filteredCandidates.slice(0, 50)
  const favorites = Object.entries(results).flatMap(([electionId, electionData]) =>
    (electionData.candidatos ?? []).map((candidate) => ({
      ...candidate,
      electionId,
      election: ELECTIONS.find((item) => item.id === electionId),
      key: candidateKey(electionId, candidate),
    })),
  ).filter((candidate) => favoriteKeys.includes(candidate.key))

  const toggleFavorite = (electionId, candidate) => {
    const key = candidateKey(electionId, candidate)
    setFavoriteKeys((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      return next
    })
  }

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
  }

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
        {alerts.length > 0 && <div className="notice alert-notice"><div><strong>Novidade na apuração</strong>{alerts.map((alert) => <span key={alert.id}>{alert.text}</span>)}</div><button onClick={() => setAlerts([])}>Limpar</button></div>}

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

          <div className="candidate-tools">
            <label htmlFor="candidate-search">Buscar candidato</label>
            <input id="candidate-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, partido ou número" />
          </div>
          <div className="candidate-header"><span>Candidatos {filteredCandidates.length > 50 ? '(top 50)' : ''}</span><span>Votos</span></div>
          {loading && !data ? <div className="loading-state">Consultando a fonte oficial…</div> : displayedCandidates.map((candidate, index) => (
            <div className="candidate" key={`${candidate.numero}-${candidate.nome}`}>
              <span className="rank">{candidate.posicao || index + 1}</span>
              <div className="candidate-name"><strong>{candidate.nome}</strong><span>{candidate.partido} · {candidate.numero}</span></div>
              <div className="candidate-votes"><strong>{candidate.votos.porcentagem}%</strong><span>{number.format(candidate.votos.quantidade)} votos</span></div>
              <button className={`pin ${favoriteKeys.includes(candidateKey(activeId, candidate)) ? 'pinned' : ''}`} onClick={() => toggleFavorite(activeId, candidate)} aria-label={`${favoriteKeys.includes(candidateKey(activeId, candidate)) ? 'Remover' : 'Fixar'} ${candidate.nome}`} title="Fixar candidato">★</button>
            </div>
          ))}
          {!loading && !filteredCandidates.length && <div className="loading-state">Nenhum candidato encontrado para esta busca.</div>}
          {filteredCandidates.length > 50 && <p className="candidate-limit">Exibindo os 50 primeiros de {number.format(filteredCandidates.length)} candidatos.</p>}
        </article>

        <section className="favorites-panel" aria-labelledby="favorites-title">
          <div className="favorites-heading"><div><p className="eyebrow">SEUS ACOMPANHAMENTOS</p><h3 id="favorites-title">Candidatos fixados</h3></div>
            {notificationPermission === 'granted' ? <span className="alerts-enabled">● Alertas ativos</span> : notificationPermission === 'unsupported' ? <span className="alerts-unavailable">Alertas não suportados</span> : <button className="enable-alerts" onClick={enableNotifications}>Ativar alertas</button>}
          </div>
          {favorites.length ? <div className="favorite-list">{favorites.map((candidate) => <div className="favorite" key={candidate.key}><span className="favorite-star">★</span><div><strong>{candidate.nome}</strong><span>{candidate.election.shortTitle} · {candidate.partido} {candidate.numero}</span></div><div><strong>{candidate.votos.porcentagem}%</strong><span>{number.format(candidate.votos.quantidade)} votos</span></div><button onClick={() => toggleFavorite(candidate.electionId, candidate)} aria-label={`Remover ${candidate.nome} dos fixados}`}>×</button></div>)}</div> : <p className="empty-favorites">Use a estrela ao lado de um candidato para deixá-lo fixado aqui e acompanhar qualquer mudança nos votos.</p>}
        </section>

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
