import { useEffect, useState } from 'react';

const CONFETES = Array.from({ length: 90 }, (_, i) => ({
  left: `${(i * 37.7) % 100}%`,
  delay: `${(i * 17) % 900}ms`,
  duration: `${2200 + ((i * 97) % 1800)}ms`,
  color: ['#ffd23f', '#0d0d6b', '#1f9d61', '#ff6fa0', '#4aa8ff', '#9b8cff'][i % 6],
  size: `${5 + (i % 5)}px`,
  height: `${(5 + (i % 5)) * 1.8}px`,
}));

export default function FinishScreen() {
  const [snapshot, setSnapshot] = useState(() => window.ScrEMAPI?.getSnapshot() ?? null);
  useEffect(() => {
    if (!window.ScrEMAPI) return undefined;
    return window.ScrEMAPI.subscribe(setSnapshot);
  }, []);

  const resultado = snapshot?.resultado;
  if (snapshot?.tela !== 'fim' || !resultado) return null;

  const mensagem = resultado.perfeito
    ? '★★★ Caminho perfeito! Você achou os melhores caminhos.'
    : 'Ótimo trabalho! Tente os caminhos mais curtos para ganhar mais estrelas.';
  const rotuloProximo = resultado.proximo?.nome || (resultado.todosConcluidos ? 'Tudo concluído!' : 'Sem pendências');

  return (
    <main className="scr-finish-screen" aria-label="Resultado da missão">
      <div className="scr-finish-confetti" aria-hidden="true">
        {CONFETES.map((confete, i) => <i key={i} style={{ '--left': confete.left, '--delay': confete.delay, '--duration': confete.duration, '--confetti-color': confete.color, '--confetti-size': confete.size, '--confetti-height': confete.height }} />)}
      </div>
      <section className="scr-finish-content">
        <span className="scr-finish-kicker">Missão concluída</span>
        <h1>Mapa concluído!</h1>
        <p className="scr-finish-map-name">{resultado.mapa.nome}</p>

        <div className="scr-finish-stats">
          <article className="scr-finish-stat">
            <span>Estrelas no mapa</span>
            <strong>★ {resultado.estrelas} de {resultado.maxEstrelas}</strong>
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
          <button className="scr-button" type="button" onClick={() => window.ScrEMAPI?.iniciarMapa(resultado.mapa.id)}>Jogar de novo</button>
          <button className="scr-button" type="button" disabled={!resultado.proximo} onClick={() => resultado.proximo && window.ScrEMAPI?.iniciarMapa(resultado.proximo.id)}>{resultado.proximo ? 'Próximo pendente' : rotuloProximo}</button>
          <button className="scr-button secondary" type="button" onClick={() => window.ScrEMAPI?.irPara('mapas')}>Escolher mapa</button>
          <button className="scr-button secondary" type="button" onClick={() => window.ScrEMAPI?.irPara('inicio')}>Tela inicial</button>
        </div>
      </section>
    </main>
  );
}
