
export default function FinishScreen({
  tela,
  resultado,
  onJogarNovamente,
  onProximo,
  onEscolherMapa,
  onInicio
}) {
  if (tela !== 'fim' || !resultado) return null;

  const mensagem = resultado.perfeito
    ? '★★★ Caminho perfeito! Você achou os melhores caminhos.'
    : 'Ótimo trabalho! Tente os caminhos mais curtos para ganhar mais estrelas.';

  const rotuloProximo = resultado.proximo?.nome ||
    (resultado.todosConcluidos ? 'Tudo concluído!' : 'Sem pendências');

  return (
    <main className="scr-finish-screen" aria-label="Resultado da missão">
      <section className="scr-finish-content">
        <h1>Mapa concluído!</h1>

        <p className="scr-finish-map-name">
          {resultado.mapa.nome}
        </p>

        <div className="scr-finish-stats">
          <article className="scr-finish-stat">
            <span>Estrelas no mapa</span>
            <strong>
              ★ {resultado.estrelas} de {resultado.maxEstrelas}
            </strong>
          </article>

          <article className="scr-finish-stat">
            <span>Tentativas</span>
            <strong>{resultado.tentativas}</strong>
          </article>

          <article className="scr-finish-stat">
            <span>Maior sequência</span>
            <strong>{resultado.maiorSequencia}</strong>
          </article>
        </div>

        <p className="scr-finish-message">{mensagem}</p>

        <div className="scr-finish-actions">
          <button
            className="scr-button"
            type="button"
            onClick={onJogarNovamente}
          >
            Jogar de novo
          </button>

          <button
            className="scr-button"
            type="button"
            disabled={!resultado.proximo}
            onClick={onProximo}
          >
            {resultado.proximo ? 'Próximo pendente' : rotuloProximo}
          </button>

          <button
            className="scr-button secondary"
            type="button"
            onClick={onEscolherMapa}
          >
            Escolher mapa
          </button>

          <button
            className="scr-button secondary"
            type="button"
            onClick={onInicio}
          >
            Tela inicial
          </button>
        </div>
      </section>
    </main>
  );
}
