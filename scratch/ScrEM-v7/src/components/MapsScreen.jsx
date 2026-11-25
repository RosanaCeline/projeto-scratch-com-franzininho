
export default function MapsScreen({
  tela,
  assunto,
  mapas = [],
  onIniciarMapa,
  onVoltar
}) {
  if (tela !== 'mapas') return null;

  return (
    <main className="scr-menu scr-react-menu" aria-label="Seleção de mapas">
      <section className="scr-page">
        <header
          className="scr-page-heading scr-map-heading"
          style={{ '--subject-color': assunto?.cor ?? '#0d0d6b' }}
        >
          <h1>{assunto?.nome ?? 'Mapas'}</h1>
          <p>{assunto?.mapasDescricao}</p>
        </header>

        {mapas.length > 0 ? (
          <div className="scr-map-grid">
            {mapas.map((mapa) => (
              <button
                className="scr-card scr-map-card"
                key={mapa.id}
                type="button"
                style={{ '--subject-color': assunto?.cor ?? '#0d0d6b' }}
                onClick={() => onIniciarMapa(mapa.id)}
                aria-label={`${mapa.nome}, nível ${mapa.nivel}${mapa.concluido ? ', concluído' : ''}`}
              >
                <span className="scr-map-badges">
                  <span
                    className="scr-level"
                    style={{ '--level-color': mapa.corNivel }}
                  >
                    {mapa.nivel}
                  </span>

                  {!mapa.fixo && (
                    <span className="scr-random">Cores sorteadas</span>
                  )}

                  {mapa.concluido && (
                    <span className="scr-completed">✓ Concluído</span>
                  )}
                </span>

                <h2>{mapa.nome}</h2>
                <p>{mapa.tema}</p>

                <span className="scr-map-meta">
                  Acerte {mapa.missoesNecessarias} de {mapa.totalMissoes} missões
                  {' · '}até {mapa.limite} passos
                </span>

                <strong className="scr-map-stars">
                  ★ {mapa.estrelas} de {mapa.maxEstrelas}
                </strong>
              </button>
            ))}
          </div>
        ) : (
          <p className="scr-empty">
            Em breve, mais mapas neste assunto.
          </p>
        )}

        <footer className="scr-page-actions">
          <button
            className="scr-button secondary"
            type="button"
            onClick={onVoltar}
          >
            Assuntos
          </button>
        </footer>
      </section>
    </main>
  );
}
