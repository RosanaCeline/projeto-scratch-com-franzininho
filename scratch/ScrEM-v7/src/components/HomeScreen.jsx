import { useEffect, useState } from 'react';

const ROBOT = [
  '....rr....', '....oo....', '..oooooo..', '.oyyyyyyo.', '.owwwwwwo.',
  '.owewwewo.', '.ocwoowco.', '..oooooo..', '..oyyyyo..', '..oyssyo..', '..og..go..'
];

const ROBOT_COLORS = {
  o: '#0d0d6b', y: '#ffd23f', w: '#e8f6ff', e: '#0d0d6b',
  c: '#ff6fa0', r: '#e5484d', s: '#e0a800', g: '#6b6f9c'
};

function PreviewBoard() {
  const obstacles = new Set([6, 7, 12, 17, 18]);
  const terrain = { 3: 'vermelho', 11: 'azul', 14: 'amarelo', 4: 'verde', 24: 'verde' };

  return (
    <div className="scr-preview-card" aria-label="Prévia do tabuleiro">
      <div className="scr-preview-grid">
        {Array.from({ length: 25 }, (_, index) => {
          const type = obstacles.has(index)
            ? 'obstaculo'
            : terrain[index] || 'normal';
          return (
            <span className={`scr-preview-cell ${type}`} key={index}>
              {index === 9 ? '9' : ''}
            </span>
          );
        })}
      </div>
      <div className="scr-preview-robot" aria-hidden="true">
        <span>
          {ROBOT.flatMap((line, row) =>
            [...line].map((pixel, column) => (
              <i
                key={`${row}-${column}`}
                style={pixel === '.' ? undefined : { '--pixel': ROBOT_COLORS[pixel] }}
              />
            )),
          )}
        </span>
      </div>
    </div>
  );
}

export default function HomeScreen({ active }) {
  const [snapshot, setSnapshot] = useState(() => window.ScrEMAPI?.getSnapshot() ?? null);

  useEffect(() => {
    if (!active || !window.ScrEMAPI) return undefined;
    const atualizar = (proximo) => setSnapshot(proximo);
    const cancelar = window.ScrEMAPI.subscribe(atualizar);
    return cancelar;
  }, [active]);

  if (!active || snapshot?.tela !== 'inicio') return null;

  const api = window.ScrEMAPI;

  return (
    <main className="scr-menu scr-react-menu" aria-label="Menu inicial do ScrEM">
      <section className="scr-page scr-home">
        <div className="scr-home-copy">
          <span className="scr-kicker">Pensamento computacional</span>
          <h1>ScrEM</h1>
          <p className="scr-lead">
            Programe o caminho do personagem, escolha as cores certas e resolva a missão de matemática.
          </p>
          <p className="scr-progress" aria-live="polite">
            Mapas concluídos: <strong>{snapshot.mapasConcluidos} de {snapshot.totalMapas}</strong>
            <span>·</span>
            Estrelas: <strong>{snapshot.estrelas} de {snapshot.maxEstrelas}</strong>
          </p>
          <div className="scr-actions">
            <button className="scr-button" type="button" onClick={() => api.irPara('assuntos')}>
              Começar
            </button>
            <button className="scr-button secondary" type="button" onClick={() => api.irPara('como')}>
              Como jogar
            </button>
          </div>
          <p className="scr-shortcuts">
            Setas ou WASD: montar · Enter: executar · Backspace: desfazer · H: dica · F: tela cheia · M: som
          </p>
        </div>

        <div className="scr-home-art">
          <PreviewBoard />
        </div>

        <div className="scr-top-actions">
          <button className="scr-button ghost" type="button" onClick={api.alternarSom}>
            Som: {snapshot.som ? 'ligado' : 'desligado'}
          </button>
          <button className="scr-button ghost" type="button" onClick={api.telaCheia}>
            Tela cheia
          </button>
        </div>
      </section>
    </main>
  );
}
